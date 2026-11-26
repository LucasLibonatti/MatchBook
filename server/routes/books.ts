import { Hono } from 'hono';

export const booksRoutes = new Hono();

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_BASE = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVERS = 'https://covers.openlibrary.org/b/id';
const OPEN_LIBRARY_ISBN = 'https://covers.openlibrary.org/b/isbn';

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

/**
 * Validates that a cover URL actually returns a real image (> 4KB),
 * filtering out Google Books' 1269-byte "image not available" PNG and 1x1 GIFs.
 */
async function isValidCoverUrl(url: string, parentSignal?: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
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

async function findGoogleCover(query: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: '5',
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
    // Ignore and continue waterfall
  }
  return null;
}

async function findOpenLibraryCover(
  titleQuery: string,
  authorQuery: string,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const olParams = new URLSearchParams({
      title: titleQuery,
      limit: '5',
      fields: 'cover_i',
    });
    if (authorQuery) {
      olParams.set('author', authorQuery);
    }

    const res = await fetch(`${OPEN_LIBRARY_BASE}?${olParams}`, { signal });
    if (!res.ok) return null;

    const data = (await res.json()) as { docs?: Array<{ cover_i?: number }> };
    const docs = Array.isArray(data.docs) ? data.docs : [];

    for (const doc of docs) {
      if (!doc.cover_i) continue;
      const candidate = `${OPEN_LIBRARY_COVERS}/${doc.cover_i}-L.jpg?default=false`;
      if (await isValidCoverUrl(candidate, signal)) {
        return candidate;
      }
    }
  } catch {
    // Ignore and continue waterfall
  }
  return null;
}

booksRoutes.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim();
  if (!q || q.length < 2) {
    return c.json({ items: [] });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const googleParams = new URLSearchParams({
      q,
      maxResults: '8',
      printType: 'books',
      projection: 'lite',
    });

    const olParams = new URLSearchParams({
      q,
      limit: '8',
      fields: 'key,title,author_name,first_publish_year,cover_i,subject,isbn',
    });

    const [googleRes, olRes] = await Promise.allSettled([
      fetchGoogleVolumes(googleParams.toString(), controller.signal),
      fetch(`${OPEN_LIBRARY_BASE}?${olParams}`, { signal: controller.signal }).then((r) =>
        r.ok ? (r.json() as Promise<{ docs?: unknown[] }>) : { docs: [] }
      ),
    ]);

    const items: Array<{
      id: string;
      title: string;
      author: string;
      publishedYear?: string | number;
      categories: string[];
      coverUrl?: string;
      isbn?: string;
      source: 'google' | 'openlibrary';
    }> = [];

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

        items.push({
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

    if (olRes.status === 'fulfilled' && Array.isArray(olRes.value.docs)) {
      for (const raw of olRes.value.docs) {
        const doc = raw as {
          key?: string;
          title?: string;
          author_name?: string[];
          first_publish_year?: number;
          cover_i?: number;
          subject?: string[];
          isbn?: string[];
        };
        if (!doc.title) continue;

        items.push({
          id: `ol-${doc.key?.replace('/works/', '') || doc.title}`,
          title: doc.title,
          author: doc.author_name?.join(', ') || 'Autor desconhecido',
          publishedYear: doc.first_publish_year,
          categories: doc.subject?.slice(0, 3) || [],
          coverUrl: doc.cover_i ? `${OPEN_LIBRARY_COVERS}/${doc.cover_i}-L.jpg?default=false` : undefined,
          isbn: doc.isbn?.[0],
          source: 'openlibrary',
        });
      }
    }

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);

  try {
    // 1. Google Books with localized title + author
    const googlePrimary = await findGoogleCover(`${title} ${author}`.trim(), controller.signal);
    if (googlePrimary) return c.json({ coverUrl: googlePrimary });

    // 2. Open Library with localized title + author
    const olPrimary = await findOpenLibraryCover(title, author, controller.signal);
    if (olPrimary) return c.json({ coverUrl: olPrimary });

    // 3. If originalTitle differs, search both providers in original language (e.g. English/Spanish)
    if (originalTitle && originalTitle.toLowerCase() !== title.toLowerCase()) {
      const googleOriginal = await findGoogleCover(`${originalTitle} ${author}`.trim(), controller.signal);
      if (googleOriginal) return c.json({ coverUrl: googleOriginal });

      const olOriginal = await findOpenLibraryCover(originalTitle, author, controller.signal);
      if (olOriginal) return c.json({ coverUrl: olOriginal });
    }

    // 4. Open Library direct ISBN cover check
    if (isbn) {
      const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '');
      if (cleanIsbn) {
        const isbnCover = `${OPEN_LIBRARY_ISBN}/${cleanIsbn}-L.jpg?default=false`;
        if (await isValidCoverUrl(isbnCover, controller.signal)) {
          return c.json({ coverUrl: isbnCover });
        }
      }
    }

    return c.json({ coverUrl: null });
  } finally {
    clearTimeout(timeout);
  }
});
