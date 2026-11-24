import { Hono } from 'hono';

export const booksRoutes = new Hono();

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_BASE = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVERS = 'https://covers.openlibrary.org/b/id';

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
          coverUrl: doc.cover_i ? `${OPEN_LIBRARY_COVERS}/${doc.cover_i}-L.jpg` : undefined,
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
  const author = (c.req.query('author') || '').trim();
  const isbn = (c.req.query('isbn') || '').trim();

  if (!title) {
    return c.json({ coverUrl: null });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const query = isbn ? `isbn:${isbn}` : `${title} ${author}`.trim();
    const params = new URLSearchParams({
      q: query,
      maxResults: '1',
      printType: 'books',
    });

    try {
      const data = await fetchGoogleVolumes(params.toString(), controller.signal);
      const first = (data.items?.[0] as { volumeInfo?: { imageLinks?: { thumbnail?: string } } }) || null;
      if (first?.volumeInfo?.imageLinks?.thumbnail) {
        return c.json({ coverUrl: upgradeGoogleBookCover(first.volumeInfo.imageLinks.thumbnail) });
      }
    } catch {
      // Fallback to Open Library
    }

    try {
      const olParams = new URLSearchParams({ title, author, limit: '1', fields: 'cover_i' });
      const res = await fetch(`${OPEN_LIBRARY_BASE}?${olParams}`, { signal: controller.signal });
      if (res.ok) {
        const data = (await res.json()) as { docs?: Array<{ cover_i?: number }> };
        const coverId = data.docs?.[0]?.cover_i;
        if (coverId) {
          return c.json({ coverUrl: `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg` });
        }
      }
    } catch {
      // Ignore
    }

    return c.json({ coverUrl: null });
  } finally {
    clearTimeout(timeout);
  }
});
