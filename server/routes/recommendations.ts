import { Hono } from 'hono';

export const recommendationsRoutes = new Hono();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PREFERRED_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const;

interface SeedBookInput {
  id?: string;
  title: string;
  author: string;
  publishedYear?: string | number;
  categories?: string[];
}

interface RawRecommendation {
  title?: unknown;
  originalTitle?: unknown;
  author?: unknown;
  publishedYear?: unknown;
  pageCount?: unknown;
  categories?: unknown;
  matchPercentage?: unknown;
  synopsis?: unknown;
  matchReason?: unknown;
  isbn?: unknown;
}

export interface NormalizedRecommendation {
  id: string;
  title: string;
  originalTitle?: string;
  author: string;
  publishedYear: number | string;
  pageCount: number;
  categories: string[];
  matchPercentage: number;
  synopsis: string;
  matchReason: string;
  isbn?: string;
}

function getGroqKey(): string {
  return (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeTitleKey(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function buildSystemPrompt(seedBooks: SeedBookInput[], excludeTitles: string[]): string {
  const seedsDescription = seedBooks
    .map((b, i) => {
      const cats = Array.isArray(b.categories) && b.categories.length > 0
        ? ` [${b.categories.slice(0, 3).join(', ')}]`
        : '';
      return `${i + 1}. "${b.title}" — ${b.author} (${b.publishedYear || '?'})${cats}`;
    })
    .join('\n');

  const excludeList = excludeTitles.length > 0
    ? `\nEXCLUIR OBRIGATORIAMENTE (não recomende nenhum destes): ${excludeTitles.slice(0, 60).join(', ')}`
    : '';

  return `Você é um curador literário sênior do MatchBook. Recomende 10 livros REAIS e publicados com alta afinidade aos 3 livros-base abaixo.

LIVROS-BASE DO LEITOR:
${seedsDescription}${excludeList}

REGRAS DE COERÊNCIA TEMÁTICA (CRÍTICO):
- Analise primeiro o eixo/domínio dos 3 livros-base (ex.: ficção literária, sci-fi/fantasia, não-ficção técnica/engenharia de software, filosofia, negócios/hábitos).
- NUNCA misture domínios sem relação (ex.: não recomende ficção clássica para quem escolheu livros técnicos de programação, nem manuais técnicos para quem escolheu romances clássicos).
- Se os 3 livros-base pertencerem a domínios diferentes, distribua as recomendações respeitando os gêneros escolhidos e explique claramente em "matchReason" a ponte específica com o(s) livro(s)-base correspondente(s).

FORMATO DE SAÍDA (APENAS JSON VÁLIDO: {"recommendations": [...]}):
Cada item deve conter:
- "title": string (título em português se existir edição conhecida, senão original)
- "originalTitle": string (título original da obra)
- "author": string (nome completo do autor)
- "publishedYear": number (ano de publicação original)
- "pageCount": number (número aproximado de páginas)
- "categories": string[] (2 a 3 gêneros curtos em português)
- "matchPercentage": number (inteiro entre 84 e 99, ordenado do maior para o menor)
- "synopsis": string (200 a 340 caracteres em português, envolvente, sem spoilers)
- "matchReason": string (1 frase direta em português citando explicitamente pelo menos 1 dos livros-base e o motivo real da conexão)
- "isbn": string (ISBN-13 se souber com segurança, senão string vazia)

Garanta 10 obras reais distintas, diversidade de autores, e zero repetição dos livros-base ou excluídos.`;
}

function extractJson(content: string): { recommendations?: RawRecommendation[] } | null {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export function normalizeRecommendations(
  rawList: RawRecommendation[],
  seedBooks: SeedBookInput[],
  excludeTitles: string[]
): NormalizedRecommendation[] {
  const excludedKeys = new Set<string>([
    ...excludeTitles.map(normalizeTitleKey),
    ...seedBooks.map((b) => normalizeTitleKey(b.title)),
  ]);
  const seenKeys = new Set<string>();
  const normalized: NormalizedRecommendation[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const author = typeof item.author === 'string' ? item.author.trim() : '';
    if (!title || !author) continue;

    const titleKey = normalizeTitleKey(title);
    if (!titleKey || excludedKeys.has(titleKey) || seenKeys.has(titleKey)) continue;
    seenKeys.add(titleKey);

    const parsedYear = typeof item.publishedYear === 'number'
      ? item.publishedYear
      : parseInt(String(item.publishedYear ?? ''), 10);
    const parsedPages = typeof item.pageCount === 'number'
      ? item.pageCount
      : parseInt(String(item.pageCount ?? ''), 10);
    const parsedMatch = typeof item.matchPercentage === 'number'
      ? item.matchPercentage
      : parseInt(String(item.matchPercentage ?? ''), 10);

    const categories = Array.isArray(item.categories)
      ? item.categories
          .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
          .map((c) => c.trim())
          .slice(0, 3)
      : ['Literatura'];

    const synopsis = typeof item.synopsis === 'string' && item.synopsis.trim().length > 0
      ? item.synopsis.trim()
      : `Obra de ${author} selecionada pela forte afinidade temática com suas escolhas.`;

    const matchReason = typeof item.matchReason === 'string' && item.matchReason.trim().length > 0
      ? item.matchReason.trim()
      : `Dialoga diretamente com os temas e o estilo de "${seedBooks[0]?.title ?? 'suas leituras'}".`;

    const id = `ai-${slugify(title)}-${slugify(author)}`.slice(0, 80);

    normalized.push({
      id,
      title,
      originalTitle: typeof item.originalTitle === 'string' && item.originalTitle.trim()
        ? item.originalTitle.trim()
        : undefined,
      author,
      publishedYear: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : 2000,
      pageCount: Number.isFinite(parsedPages) && parsedPages > 20 ? parsedPages : 280,
      categories: categories.length > 0 ? categories : ['Literatura'],
      matchPercentage: Number.isFinite(parsedMatch)
        ? Math.min(99, Math.max(80, Math.round(parsedMatch)))
        : Math.max(84, 98 - normalized.length),
      synopsis,
      matchReason,
      isbn: typeof item.isbn === 'string' && item.isbn.trim().length >= 10 ? item.isbn.trim() : undefined,
    });

    if (normalized.length >= 10) break;
  }

  return normalized.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

async function callGroqModel(
  model: string,
  systemPrompt: string,
  apiKey: string
): Promise<RawRecommendation[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Gere as 10 recomendações em JSON agora.' },
        ],
        temperature: 0.6,
        max_tokens: 2800,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Groq ${model} (${response.status}): ${errorText.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Resposta vazia da Groq');

    const parsed = extractJson(content);
    if (!parsed || !Array.isArray(parsed.recommendations)) {
      throw new Error('JSON inválido retornado pela Groq');
    }

    return parsed.recommendations;
  } finally {
    clearTimeout(timeout);
  }
}

recommendationsRoutes.post('/', async (c) => {
  let body: { seedBooks?: SeedBookInput[]; excludeTitles?: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Payload JSON inválido.' }, 400);
  }

  const seedBooks = Array.isArray(body.seedBooks)
    ? body.seedBooks
        .filter((b) => b && typeof b.title === 'string' && b.title.trim().length > 0)
        .slice(0, 3)
    : [];

  if (seedBooks.length === 0) {
    return c.json({ error: 'Selecione pelo menos 1 livro-base.' }, 400);
  }

  const excludeTitles = Array.isArray(body.excludeTitles)
    ? body.excludeTitles
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .slice(0, 100)
    : [];

  const apiKey = getGroqKey();
  if (!apiKey) {
    return c.json({
      recommendations: [],
      source: 'fallback',
      reason: 'GROQ_API_KEY não configurada no servidor.',
    });
  }

  const systemPrompt = buildSystemPrompt(seedBooks, excludeTitles);

  for (const model of PREFERRED_MODELS) {
    try {
      const raw = await callGroqModel(model, systemPrompt, apiKey);
      const recommendations = normalizeRecommendations(raw, seedBooks, excludeTitles);
      if (recommendations.length >= 5) {
        return c.json({ recommendations, source: 'groq', model });
      }
    } catch (err) {
      console.warn(`[MatchBook API] Modelo ${model} falhou:`, err instanceof Error ? err.message : err);
    }
  }

  return c.json({
    recommendations: [],
    source: 'fallback',
    reason: 'Modelos de IA temporariamente indisponíveis.',
  });
});
