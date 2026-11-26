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

async function fetchCoversBatch(
  books: BookRecommendation[],
  signal?: AbortSignal
): Promise<Record<string, string | null>> {
  if (books.length === 0) return {};

  try {
    const response = await fetch('/api/books/covers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        books: books.map((b) => ({
          id: b.id,
          title: b.title,
          originalTitle: b.originalTitle,
          author: b.author,
          isbn: b.isbn,
        })),
      }),
      signal,
    });
    if (!response.ok) return {};
    const data = (await response.json()) as { covers?: Record<string, string | null> };
    return data.covers || {};
  } catch {
    return {};
  }
}

/**
 * Resolves cached/curated covers synchronously, then fetches missing covers in parallel
 * via two batch requests (priority 0..2 capped at 1100ms wait, background 3..9 non-blocking).
 */
export async function hydrateRecommendationCovers(
  recommendations: BookRecommendation[],
  onProgress?: (index: number, book: BookRecommendation) => void,
  signal?: AbortSignal
): Promise<BookRecommendation[]> {
  const results = [...recommendations];
  const priorityMissing: Array<{ index: number; book: BookRecommendation }> = [];
  const backgroundMissing: Array<{ index: number; book: BookRecommendation }> = [];

  for (let i = 0; i < results.length; i++) {
    const book = results[i];
    const cacheKey = getCoverCacheKey(book.title, book.author);
    let coverUrl = getCachedCover(cacheKey);

    if (!coverUrl && book.coverUrl) {
      coverUrl = upgradeGoogleBookCover(book.coverUrl);
      setCachedCover(cacheKey, coverUrl);
    }

    if (coverUrl) {
      preloadCover(coverUrl);
      results[i] = { ...book, coverUrl };
      onProgress?.(i, results[i]);
    } else if (i < 3) {
      priorityMissing.push({ index: i, book });
    } else {
      backgroundMissing.push({ index: i, book });
    }
  }

  const applyBatch = async (batch: Array<{ index: number; book: BookRecommendation }>) => {
    if (batch.length === 0 || signal?.aborted) return;
    const coversMap = await fetchCoversBatch(
      batch.map((entry) => entry.book),
      signal
    );
    if (signal?.aborted) return;

    for (const { index, book } of batch) {
      const url = coversMap[book.id];
      if (!url) continue;
      setCachedCover(getCoverCacheKey(book.title, book.author), url);
      preloadCover(url);
      results[index] = { ...book, coverUrl: url };
      onProgress?.(index, results[index]);
    }
  };

  // Start background batch (cards 4..10) immediately in parallel
  if (backgroundMissing.length > 0 && !signal?.aborted) {
    void applyBatch(backgroundMissing);
  }

  // Wait at most 1100ms for the first 3 cards so the UI never hangs on a slow network
  if (priorityMissing.length > 0 && !signal?.aborted) {
    const priorityPromise = applyBatch(priorityMissing);
    const maxWaitPromise = new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 1100);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    await Promise.race([priorityPromise, maxWaitPromise]);
  }

  return results;
}

export function preloadCover(url: string): void {
  if (typeof Image === 'undefined') return;
  const img = new Image();
  img.src = url;
}
