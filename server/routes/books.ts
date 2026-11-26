import { Hono } from 'hono';

export const booksRoutes = new Hono();

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_BASE = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVERS = 'https://covers.openlibrary.org/b/id';
const OPEN_LIBRARY_ISBN = 'https://covers.openlibrary.org/b/isbn';
const ITUNES_SEARCH_BASE = 'https://itunes.apple.com/search';

const COVER_CACHE_TTL_MS = 15 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

interface SearchItem {
  id: string;
  title: string;
  author: string;
  publishedYear?: string | number;
  categories: string[];
  coverUrl?: string;
  isbn?: string;
  source: 'apple' | 'google' | 'openlibrary';
}

const coverCache = new Map<string, { url: string | null; at: number }>();
const searchCache = new Map<string, { items: SearchItem[]; at: number }>();

function getGoogleBooksKey(): string {
  return (process.env.GOOGLE_BOOKS_API_KEY || process.env.VITE_GOOGLE_BOOKS_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function upgradeGoogleBookCover(rawUrl: string): string {
  let url = rawUrl.replace(/^http:\/\//i, 'https://').replace('&edge=curl', '');
  if (url.includes('books.google.com/books/content') && !url.includes('fife=')) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}fife=w800-h1200`;
  }
  return url;
}

function normalizeWords(value: string): string[] {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function normalizeIdentity(title: string, author: string): string {
  return `${title}-${author}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function setBoundedCache<K, V>(cache: Map<K, V>, key: K, value: V, maxSize: number): void {
  if (cache.size >= maxSize) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, value);
}

/**
 * Validates Google/OpenLibrary cover URLs (> 4KB) so placeholder images are filtered out.
 */
async function isValidCoverUrl(url: string, parentSignal?: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  const onParentAbort = () => controller.abort();
  parentSignal?.addEventListener('abort', onParentAbort);

  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (!res.ok) return false;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return false;

    const lengthHeader = res.headers.get('content-length');
    if (lengthHeader !== null) {
      const size = Number(lengthHeader);
      if (Number.isFinite(size) && size < 4000) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener('abort', onParentAbort);
  }
}

async function fetchGoogleVolumes(queryParams: string, signal?: AbortSignal): Promise<{ items?: unknown[] }> {
  const apiKey = getGoogleBooksKey();
  const urlWithKey = apiKey
    ? `${GOOGLE_BOOKS_BASE}?${queryParams}&key=${encodeURIComponent(apiKey)}`
    : `${GOOGLE_BOOKS_BASE}?${queryParams}`;

  const response = await fetch(urlWithKey, { signal });
  if (response.ok) {
    return (await response.json()) as { items?: unknown[] };
  }

  if (apiKey && (response.status === 403 || response.status === 400)) {
    const fallbackResponse = await fetch(`${GOOGLE_BOOKS_BASE}?${queryParams}`, { signal });
    if (fallbackResponse.ok) {
      return (await fallbackResponse.json()) as { items?: unknown[] };
    }
  }

  throw new Error(`Google Books HTTP ${response.status}`);
}

interface AppleEbookResult {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  genres?: string[];
}

async function searchAppleBooks(
  term: string,
  limit: number,
  country?: string,
  signal?: AbortSignal
): Promise<AppleEbookResult[]> {
  try {
    const params = new URLSearchParams({
      term: term.trim(),
      media: 'ebook',
      limit: String(limit),
    });
    if (country) {
      params.set('country', country);
    }

    const res = await fetch(`${ITUNES_SEARCH_BASE}?${params}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: AppleEbookResult[] };
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

/**
 * Apple Books CDN (mzstatic.com) always returns official publisher covers (no placeholders),
 * so we skip the extra HEAD round-trip for near-instant resolution.
 */
async function findAppleBooksCover(
  titleQuery: string,
  authorQuery: string,
  country?: string,
  signal?: AbortSignal
): Promise<string | null> {
  const results = await searchAppleBooks(`${titleQuery} ${authorQuery}`, 5, country, signal);
  if (results.length === 0) return null;

  const titleWords = normalizeWords(titleQuery);
  const authorWords = normalizeWords(authorQuery);

  const scored = results
    .map((item) => {
      const trackNorm = normalizeWords(item.trackName || '');
      const artistNorm = normalizeWords(item.artistName || '');
      const titleMatches = titleWords.filter((w) => trackNorm.includes(w)).length;
      const authorMatches = authorWords.filter((w) => artistNorm.includes(w)).length;
      return {
        item,
        titleMatches,
        authorMatches,
        score: titleMatches * 2 + authorMatches * 3,
      };
    })
    .filter((entry) => entry.item.artworkUrl100 && (entry.titleMatches > 0 || entry.authorMatches > 0))
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.item.artworkUrl100;
  return best ? best.replace(/\/\d+x\d+bb\./i, '/600x900bb.') : null;
}

async function findGoogleCover(query: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: '4',
      printType: 'books',
    });
    const data = await fetchGoogleVolumes(params.toString(), signal);
    const items = Array.isArray(data.items) ? data.items : [];

    for (const raw of items) {
      const item = raw as { volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } } };
      const thumb = item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail;
      if (!thumb) continue;

      const candidate = upgradeGoogleBookCover(thumb);
      if (await isValidCoverUrl(candidate, signal)) {
        return candidate;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

async function findOpenLibraryCover(
  titleQuery: string,
  authorQuery: string,
  isbn?: string,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const olParams = new URLSearchParams({
      title: titleQuery,
      limit: '4',
      fields: 'cover_i',
    });
    if (authorQuery) {
      olParams.set('author', authorQuery);
    }

    const res = await fetch(`${OPEN_LIBRARY_BASE}?${olParams}`, { signal });
    if (res.ok) {
      const data = (await res.json()) as { docs?: Array<{ cover_i?: number }> };
      const docs = Array.isArray(data.docs) ? data.docs : [];

      for (const doc of docs) {
        if (!doc.cover_i) continue;
        const candidate = `${OPEN_LIBRARY_COVERS}/${doc.cover_i}-L.jpg?default=false`;
        if (await isValidCoverUrl(candidate, signal)) {
          return candidate;
        }
      }
    }

    if (isbn) {
      const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '');
      if (cleanIsbn) {
        const isbnCover = `${OPEN_LIBRARY_ISBN}/${cleanIsbn}-L.jpg?default=false`;
        if (await isValidCoverUrl(isbnCover, signal)) {
          return isbnCover;
        }
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

interface CoverLookupInput {
  title: string;
  originalTitle?: string;
  author: string;
  isbn?: string;
}

async function resolveBookCover(input: CoverLookupInput, parentSignal?: AbortSignal): Promise<string | null> {
  const title = input.title.trim();
  const originalTitle = (input.originalTitle || '').trim();
  const author = input.author.trim();
  const isbn = (input.isbn || '').trim();
  if (!title) return null;

  const cacheKey = `${normalizeIdentity(title, author)}|${originalTitle.toLowerCase()}`;
  const cached = coverCache.get(cacheKey);
  if (cached && Date.now() - cached.at < COVER_CACHE_TTL_MS) {
    return cached.url;
  }

  // Stage 1 (Fast & Parallel): Apple Books BR + Apple Books Global
  const stage1Controller = new AbortController();
  const stage1Timeout = setTimeout(() => stage1Controller.abort(), 2200);
  const onAbort1 = () => stage1Controller.abort();
  parentSignal?.addEventListener('abort', onAbort1);

  try {
    const globalTitle = originalTitle && originalTitle.toLowerCase() !== title.toLowerCase()
      ? originalTitle
      : title;
    const [appleBr, appleGlobal] = await Promise.all([
      findAppleBooksCover(title, author, 'br', stage1Controller.signal),
      findAppleBooksCover(globalTitle, author, undefined, stage1Controller.signal),
    ]);

    const stage1Hit = appleBr || appleGlobal;
    if (stage1Hit) {
      setBoundedCache(coverCache, cacheKey, { url: stage1Hit, at: Date.now() }, 500);
      return stage1Hit;
    }
  } finally {
    clearTimeout(stage1Timeout);
    parentSignal?.removeEventListener('abort', onAbort1);
  }

  if (parentSignal?.aborted) return null;

  // Stage 2 (Fallback & Parallel): Google Books + Open Library
  const stage2Controller = new AbortController();
  const stage2Timeout = setTimeout(() => stage2Controller.abort(), 2500);
  const onAbort2 = () => stage2Controller.abort();
  parentSignal?.addEventListener('abort', onAbort2);

  try {
    const lookupTitle = originalTitle && originalTitle.toLowerCase() !== title.toLowerCase()
      ? originalTitle
      : title;
    const [googleHit, olHit] = await Promise.all([
      findGoogleCover(`${lookupTitle} ${author}`.trim(), stage2Controller.signal),
      findOpenLibraryCover(lookupTitle, author, isbn, stage2Controller.signal),
    ]);

    const finalUrl = googleHit || olHit || null;
    setBoundedCache(coverCache, cacheKey, { url: finalUrl, at: Date.now() }, 500);
    return finalUrl;
  } finally {
    clearTimeout(stage2Timeout);
    parentSignal?.removeEventListener('abort', onAbort2);
  }
}

booksRoutes.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim();
  if (!q || q.length < 2) {
    return c.json({ items: [] });
  }

  const cacheKey = q.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < SEARCH_CACHE_TTL_MS) {
    return c.json({ items: cached.items });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);

  try {
    const googleParams = new URLSearchParams({
      q,
      maxResults: '6',
      printType: 'books',
      projection: 'lite',
    });

    const [appleBrRes, appleGlobalRes, googleRes] = await Promise.allSettled([
      searchAppleBooks(q, 6, 'br', controller.signal),
      searchAppleBooks(q, 5, undefined, controller.signal),
      fetchGoogleVolumes(googleParams.toString(), controller.signal),
    ]);

    const rawItems: SearchItem[] = [];

    const pushApple = (list: AppleEbookResult[]) => {
      for (const item of list) {
        if (!item.trackName) continue;
        rawItems.push({
          id: `apple-${item.trackId || item.trackName}`,
          title: item.trackName,
          author: item.artistName || 'Autor desconhecido',
          publishedYear: item.releaseDate?.slice(0, 4),
          categories: Array.isArray(item.genres)
            ? item.genres.filter((g) => g.toLowerCase() !== 'books' && g.toLowerCase() !== 'ebooks').slice(0, 3)
            : [],
          coverUrl: item.artworkUrl100
            ? item.artworkUrl100.replace(/\/\d+x\d+bb\./i, '/400x600bb.')
            : undefined,
          source: 'apple',
        });
      }
    };

    if (appleBrRes.status === 'fulfilled') pushApple(appleBrRes.value);
    if (appleGlobalRes.status === 'fulfilled') pushApple(appleGlobalRes.value);

    if (googleRes.status === 'fulfilled' && Array.isArray(googleRes.value.items)) {
      for (const raw of googleRes.value.items) {
        const item = raw as {
          id?: string;
          volumeInfo?: {
            title?: string;
            authors?: string[];
            publishedDate?: string;
            categories?: string[];
            imageLinks?: { thumbnail?: string };
            industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
          };
        };
        const info = item.volumeInfo;
        if (!info?.title) continue;

        const isbn =
          info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier ||
          info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier;

        rawItems.push({
          id: `google-${item.id || info.title}`,
          title: info.title,
          author: info.authors?.join(', ') || 'Autor desconhecido',
          publishedYear: info.publishedDate?.split('-')[0],
          categories: info.categories || [],
          coverUrl: info.imageLinks?.thumbnail
            ? upgradeGoogleBookCover(info.imageLinks.thumbnail)
            : undefined,
          isbn,
          source: 'google',
        });
      }
    }

    // Deduplicate preferring entries that have covers
    const dedupMap = new Map<string, SearchItem>();
    for (const item of rawItems) {
      const key = normalizeIdentity(item.title, item.author);
      const existing = dedupMap.get(key);
      if (!existing || (!existing.coverUrl && item.coverUrl)) {
        dedupMap.set(key, item);
      }
    }

    const items = Array.from(dedupMap.values()).slice(0, 12);
    setBoundedCache(searchCache, cacheKey, { items, at: Date.now() }, 200);
    return c.json({ items });
  } finally {
    clearTimeout(timeout);
  }
});

booksRoutes.get('/cover', async (c) => {
  const title = (c.req.query('title') || '').trim();
  const originalTitle = (c.req.query('originalTitle') || '').trim();
  const author = (c.req.query('author') || '').trim();
  const isbn = (c.req.query('isbn') || '').trim();

  if (!title) {
    return c.json({ coverUrl: null });
  }

  const coverUrl = await resolveBookCover({ title, originalTitle, author, isbn });
  return c.json({ coverUrl });
});

booksRoutes.post('/covers', async (c) => {
  let body: { books?: Array<{ id?: string; title?: string; originalTitle?: string; author?: string; isbn?: string }> };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ covers: {} }, 400);
  }

  const list = Array.isArray(body.books) ? body.books.slice(0, 10) : [];
  if (list.length === 0) {
    return c.json({ covers: {} });
  }

  const entries = await Promise.all(
    list.map(async (b) => {
      const id = b.id || '';
      if (!id || !b.title) return [id, null] as const;
      const url = await resolveBookCover({
        title: b.title,
        originalTitle: b.originalTitle,
        author: b.author || '',
        isbn: b.isbn,
      });
      return [id, url] as const;
    })
  );

  const covers: Record<string, string | null> = {};
  for (const [id, url] of entries) {
    if (id) covers[id] = url;
  }

  return c.json({ covers });
});
