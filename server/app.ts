import { Hono } from 'hono';
import { recommendationsRoutes } from './routes/recommendations.js';
import { booksRoutes } from './routes/books.js';

export const app = new Hono().basePath('/api');

app.get('/health', (c) => {
  const hasGroq = Boolean(process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY);
  const hasGoogleBooks = Boolean(process.env.GOOGLE_BOOKS_API_KEY || process.env.VITE_GOOGLE_BOOKS_API_KEY);
  return c.json({ ok: true, groq: hasGroq, googleBooks: hasGoogleBooks });
});

app.route('/recommendations', recommendationsRoutes);
app.route('/books', booksRoutes);

app.onError((err, c) => {
  console.error('[MatchBook API] Unhandled error:', err);
  return c.json({ error: 'Erro interno do servidor. Tente novamente em instantes.' }, 500);
});
