import type { SeedBook, BookRecommendation } from '../types/book';
import { CURATED_BOOKS } from '../data/curatedBooks';
import { upgradeGoogleBookCover } from './bookCoverService';

// Module-level deduplication cache for concurrent requests
let activeRequestPromise: Promise<RecommendationBatchResult> | null = null;
let activeRequestKey: string | null = null;

export interface RecommendationBatchResult {
  recommendations: BookRecommendation[];
  source: 'groq' | 'fallback';
  model?: string;
}

function getSeedGenres(seedBooks: SeedBook[]): Set<string> {
  const genres = new Set<string>();
  seedBooks.forEach((book) => {
    book.categories.forEach((cat) => genres.add(cat.toLowerCase()));
  });
  return genres;
}

export function generateFallbackRecommendations(
  seedBooks: SeedBook[],
  excludeTitles: string[]
): BookRecommendation[] {
  const allExcluded = new Set([
    ...excludeTitles.map((t) => t.toLowerCase().trim()),
    ...seedBooks.map((b) => b.title.toLowerCase().trim()),
  ]);

  const seedGenres = getSeedGenres(seedBooks);

  const available = CURATED_BOOKS.filter(
    (b) => !allExcluded.has(b.title.toLowerCase().trim())
  );

  // Score books by shared genres with seedBooks for better thematic coherence
  const scored = available.map((book) => {
    const sharedCount = book.categories.filter((cat) =>
      seedGenres.has(cat.toLowerCase())
    ).length;
    return { book, sharedCount, jitter: Math.random() * 0.4 };
  });

  scored.sort((a, b) => b.sharedCount + b.jitter - (a.sharedCount + a.jitter));
  const selected = scored.slice(0, 10).map((entry) => entry.book);

  return selected.map((book, i) => {
    const matchPercentage = Math.max(85, 98 - i);
    const matchingSeeds = seedBooks.filter((s) =>
      s.categories.some((sc) =>
        book.categories.some((bc) => bc.toLowerCase() === sc.toLowerCase())
      )
    );
    const seedRef =
      matchingSeeds[i % matchingSeeds.length] ||
      seedBooks[i % Math.max(1, seedBooks.length)];

    const sharedGenre =
      book.categories.find((bc) =>
        seedRef?.categories.some((sc) => sc.toLowerCase() === bc.toLowerCase())
      ) || book.categories[0] || 'literatura';

    const coverUrl = book.coverUrl ? upgradeGoogleBookCover(book.coverUrl) : undefined;

    return {
      id: `curated-${book.id}`,
      title: book.title,
      originalTitle: book.title,
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
  excludeTitles: string[] = []
): Promise<RecommendationBatchResult> {
  const requestKey = `${seedBooks.map((b) => b.id).sort().join(',')}|${[...excludeTitles].sort().join(',')}`;

  if (activeRequestPromise && activeRequestKey === requestKey) {
    return activeRequestPromise;
  }

  const requestPromise = (async (): Promise<RecommendationBatchResult> => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedBooks, excludeTitles }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          recommendations?: BookRecommendation[];
          source?: 'groq' | 'fallback';
          model?: string;
        };

        if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          return {
            recommendations: data.recommendations,
            source: data.source || 'groq',
            model: data.model,
          };
        }
      }
    } catch (error) {
      console.warn('[MatchBook] API /api/recommendations indisponível, usando acervo local:', error);
    }

    return {
      recommendations: generateFallbackRecommendations(seedBooks, excludeTitles),
      source: 'fallback',
    };
  })().finally(() => {
    activeRequestPromise = null;
    activeRequestKey = null;
  });

  activeRequestPromise = requestPromise;
  activeRequestKey = requestKey;
  return requestPromise;
}
