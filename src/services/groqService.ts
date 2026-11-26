import type { SeedBook, BookRecommendation, CurationFocus } from '../types/book';
import { CURATED_BOOKS } from '../data/curatedBooks';
import { upgradeGoogleBookCover } from './bookCoverService';

// Module-level deduplication cache for concurrent requests
let activeRequestPromise: Promise<RecommendationBatchResult> | null = null;
let activeRequestKey: string | null = null;

export interface RecommendationBatchResult {
  recommendations: BookRecommendation[];
  source: 'groq' | 'fallback';
  model?: string;
  errorCode?: string;
}

function getSeedGenres(seedBooks: SeedBook[]): Set<string> {
  const genres = new Set<string>();
  seedBooks.forEach((book) => {
    book.categories.forEach((cat) => genres.add(cat.toLowerCase()));
  });
  return genres;
}

function getFocusBoost(book: SeedBook, focus: CurationFocus): number {
  const year =
    typeof book.publishedYear === 'number'
      ? book.publishedYear
      : parseInt(String(book.publishedYear || '0'), 10);
  const pages = book.pageCount || 300;

  switch (focus) {
    case 'quick':
      return pages <= 260 ? 2.5 : 0;
    case 'classics':
      return year > 0 && year < 1980 ? 2.5 : 0;
    case 'modern':
      return year >= 2000 ? 2.5 : 0;
    case 'hidden-gems':
      return !book.categories.some((c) => c.toLowerCase() === 'bestseller') ? 1.5 : 0;
    default:
      return 0;
  }
}

export function generateFallbackRecommendations(
  seedBooks: SeedBook[],
  excludeTitles: string[],
  focus: CurationFocus = 'balanced'
): BookRecommendation[] {
  const allExcluded = new Set([
    ...excludeTitles.map((t) => t.toLowerCase().trim()),
    ...seedBooks.map((b) => b.title.toLowerCase().trim()),
  ]);

  const seedGenres = getSeedGenres(seedBooks);
  const available = CURATED_BOOKS.filter(
    (b) => !allExcluded.has(b.title.toLowerCase().trim())
  );

  // Score books by how many DIFFERENT seed books they resonate with + focus boost
  const scored = available.map((book) => {
    const matchedSeedsCount = seedBooks.filter((seed) =>
      seed.categories.some((sc) =>
        book.categories.some((bc) => bc.toLowerCase() === sc.toLowerCase())
      )
    ).length;
    const sharedGenresCount = book.categories.filter((cat) =>
      seedGenres.has(cat.toLowerCase())
    ).length;
    const focusBoost = getFocusBoost(book, focus);
    const score = matchedSeedsCount * 1.6 + sharedGenresCount + focusBoost + Math.random() * 0.5;
    return { book, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Enforce max 1 book per author for diversity
  const seenAuthors = new Set<string>();
  const selected: SeedBook[] = [];
  for (const entry of scored) {
    const authorKey = entry.book.author.toLowerCase().trim();
    if (seenAuthors.has(authorKey)) continue;
    seenAuthors.add(authorKey);
    selected.push(entry.book);
    if (selected.length >= 10) break;
  }

  return selected.map((book, i) => {
    const matchPercentage = Math.max(85, 98 - i);
    const matchingSeeds = seedBooks.filter((s) =>
      s.categories.some((sc) =>
        book.categories.some((bc) => bc.toLowerCase() === sc.toLowerCase())
      )
    );
    const seedRef =
      matchingSeeds[i % Math.max(1, matchingSeeds.length)] ||
      seedBooks[i % Math.max(1, seedBooks.length)];

    const sharedGenre =
      book.categories.find((bc) =>
        seedRef?.categories.some((sc) => sc.toLowerCase() === bc.toLowerCase())
      ) || book.categories[0] || 'literatura';

    const coverUrl = book.coverUrl ? upgradeGoogleBookCover(book.coverUrl) : undefined;

    return {
      id: `curated-${book.id}`,
      title: book.title,
      originalTitle: book.originalTitle || book.title,
      author: book.author,
      publishedYear:
        typeof book.publishedYear === 'number'
          ? book.publishedYear
          : parseInt(String(book.publishedYear || '2000'), 10),
      pageCount: book.pageCount || 300,
      categories: book.categories.slice(0, 3),
      matchPercentage,
      synopsis:
        book.fallbackSynopsis ||
        `Uma obra que ressoa com os temas de ${seedRef?.title ?? 'suas leituras'} e explora ${sharedGenre.toLowerCase()} de forma envolvente.`,
      matchReason:
        book.fallbackMatchReason ||
        `Compartilha a essência de ${sharedGenre.toLowerCase()} presente em "${seedRef?.title ?? 'sua seleção'}".`,
      coverUrl,
      isbn: book.isbn,
    };
  });
}

export async function getRecommendations(
  seedBooks: SeedBook[],
  excludeTitles: string[] = [],
  focus: CurationFocus = 'balanced'
): Promise<RecommendationBatchResult> {
  const requestKey = `${focus}|${seedBooks.map((b) => b.id).sort().join(',')}|${[...excludeTitles].sort().join(',')}`;

  if (activeRequestPromise && activeRequestKey === requestKey) {
    return activeRequestPromise;
  }

  const requestPromise = (async (): Promise<RecommendationBatchResult> => {
    let errorCode: string | undefined;

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedBooks, excludeTitles, focus }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          recommendations?: BookRecommendation[];
          source?: 'groq' | 'fallback';
          model?: string;
          errorCode?: string;
        };

        if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          return {
            recommendations: data.recommendations,
            source: data.source || 'groq',
            model: data.model,
          };
        }

        errorCode = data.errorCode;
      } else {
        errorCode = `HTTP_${response.status}`;
      }
    } catch (error) {
      errorCode = 'NETWORK_ERROR';
      console.warn('[MatchBook] API /api/recommendations indisponível, usando acervo local:', error);
    }

    return {
      recommendations: generateFallbackRecommendations(seedBooks, excludeTitles, focus),
      source: 'fallback',
      errorCode,
    };
  })().finally(() => {
    activeRequestPromise = null;
    activeRequestKey = null;
  });

  activeRequestPromise = requestPromise;
  activeRequestKey = requestKey;
  return requestPromise;
}
