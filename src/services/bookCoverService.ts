import { getCachedCover, setCachedCover, getCoverCacheKey } from '../utils/storage';
import type { BookRecommendation, BookSearchResult } from '../types/book';

export function upgradeGoogleBookCover(rawUrl: string): string {
  let url = rawUrl.replace(/^http:\/\//i, 'https://');
  url = url.replace('&edge=curl', '');
  if (url.includes('books.google.com/books/content') && !url.includes('fife=')) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}fife=w800-h1200`;
  }
  return url;
}

function normalizeKeyPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function deduplicateResults(results: BookSearchResult[]): BookSearchResult[] {
  const seen = new Set<string>();
  return results.filter((book) => {
    const key = `${normalizeKeyPart(book.title)}-${normalizeKeyPart(book.author)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchBooksForOnboarding(
  query: string,
  curatedResults: BookSearchResult[],
  signal?: AbortSignal
): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return curatedResults;

  try {
    const params = new URLSearchParams({ q: trimmed });
    const response = await fetch(`/api/books/search?${params}`, { signal });
    if (!response.ok) return curatedResults;

    const data = (await response.json()) as { items?: BookSearchResult[] };
    const apiResults = Array.isArray(data.items) ? data.items : [];
    const combined = [...curatedResults, ...apiResults];
    return deduplicateResults(combined).slice(0, 12);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return curatedResults;
  }
}

async function fetchCoverFromApi(
  book: BookRecommendation,
  signal?: AbortSignal
): Promise<string | null> {
  const params = new URLSearchParams({
    title: book.title,
    author: book.author,
  });
  if (book.originalTitle && book.originalTitle !== book.title) {
    params.set('originalTitle', book.originalTitle);
  }
  if (book.isbn) {
    params.set('isbn', book.isbn);
  }

  try {
    const response = await fetch(`/api/books/cover?${params}`, { signal });
    if (!response.ok) return null;
    const data = (await response.json()) as { coverUrl?: string | null };
    return data.coverUrl || null;
  } catch {
    return null;
  }
}

export async function hydrateSingleCover(
  book: BookRecommendation,
  signal?: AbortSignal
): Promise<BookRecommendation> {
  const cacheKey = getCoverCacheKey(book.title, book.author);
  let coverUrl = getCachedCover(cacheKey);

  if (!coverUrl && book.coverUrl) {
    coverUrl = upgradeGoogleBookCover(book.coverUrl);
  }

  if (!coverUrl) {
    coverUrl = await fetchCoverFromApi(book, signal);
  }

  if (coverUrl) {
    setCachedCover(cacheKey, coverUrl);
    preloadCover(coverUrl);
  }

  return { ...book, coverUrl: coverUrl ?? undefined };
}

/**
 * Hydrates the first 3 cards synchronously for instant stack display,
 * then continues hydrating cards 4-10 in the background via onProgress.
 */
export async function hydrateRecommendationCovers(
  recommendations: BookRecommendation[],
  onProgress?: (index: number, book: BookRecommendation) => void,
  signal?: AbortSignal
): Promise<BookRecommendation[]> {
  const results = [...recommendations];
  const immediateCount = Math.min(3, results.length);

  for (let i = 0; i < immediateCount; i++) {
    if (signal?.aborted) break;
    results[i] = await hydrateSingleCover(results[i], signal);
    onProgress?.(i, results[i]);
  }

  // Hydrate remaining cards (4-10) in background without blocking initial render
  if (results.length > immediateCount && !signal?.aborted) {
    void (async () => {
      for (let i = immediateCount; i < results.length; i++) {
        if (signal?.aborted) break;
        const hydrated = await hydrateSingleCover(results[i], signal);
        if (!signal?.aborted) {
          onProgress?.(i, hydrated);
        }
      }
    })();
  }

  return results;
}

export function preloadCover(url: string): void {
  if (typeof Image === 'undefined') return;
  const img = new Image();
  img.src = url;
}
