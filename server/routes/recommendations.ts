import { Hono } from 'hono';

export const recommendationsRoutes = new Hono();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

// Fast flagship-first fallback list; avoids extra /models round-trip on happy path
const PREFERRED_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
] as const;

const NON_CHAT_MODEL_RE = /(whisper|orpheus|guard|safeguard|tts|embed|moderation)/i;
const MODELS_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedChatModels: string[] | null = null;
let cachedModelsAt = 0;

export type CurationFocus = 'balanced' | 'quick' | 'classics' | 'modern' | 'hidden-gems';

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

const FOCUS_DIRECTIVES: Record<CurationFocus, string> = {
  balanced: 'Equilíbrio geral: varie épocas, estilos e tamanhos mantendo conexão genuína com os 3 base.',
  quick: 'FOCO (CURTOS): Priorize obras ágeis até ~260 páginas.',
  classics: 'FOCO (CLÁSSICOS): Priorize clássicos atemporais (antes de 1985).',
  modern: 'FOCO (CONTEMPORÂNEOS): Priorize obras publicadas a partir de 2000.',
  'hidden-gems': 'FOCO (JOIAS OCULTAS): Evite bestsellers óbvios; recomende obras menos óbvias e aclamadas.',
};

function getGroqKey(): string {
  return (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

async function fetchAvailableChatModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedChatModels && now - cachedModelsAt < MODELS_CACHE_TTL_MS) {
    return cachedChatModels;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(GROQ_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      data?: Array<{ id?: string; active?: boolean }>;
    };
    const models = (Array.isArray(data.data) ? data.data : [])
      .filter((m) => m.id && m.active !== false && !NON_CHAT_MODEL_RE.test(m.id))
      .map((m) => m.id as string);

    if (models.length > 0) {
      cachedChatModels = models;
      cachedModelsAt = now;
    }
    return models;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function buildSystemPrompt(
  seedBooks: SeedBookInput[],
  excludeTitles: string[],
  focus: CurationFocus
): string {
  const seedsDescription = seedBooks
    .map((b, i) => {
      const cats =
        Array.isArray(b.categories) && b.categories.length > 0
          ? ` [${b.categories.slice(0, 2).join(', ')}]`
          : '';
      return `#${i + 1}: "${b.title}" — ${b.author} (${b.publishedYear || '?'})${cats}`;
    })
    .join('\n');

  const excludeList =
    excludeTitles.length > 0
      ? `\nEXCLUIR: ${excludeTitles.slice(0, 50).join(', ')}`
      : '';

  const focusDirective = FOCUS_DIRECTIVES[focus] || FOCUS_DIRECTIVES.balanced;

  return `Curador literário sênior do MatchBook. Recomende 10 livros REAIS e publicados com alta afinidade aos livros-base abaixo.

BASE:
${seedsDescription}${excludeList}

REGRAS:
1. EQUILÍBRIO: Se houver 3 livros-base, distribua 3 para o #1, 3 para o #2, 3 para o #3 e 1 ponte (NUNCA foque em só 1 livro).
2. DIVERSIDADE: Máximo 1 livro por autor (10 autores diferentes) e evite autores da base.
3. COERÊNCIA: Respeite o domínio de cada base sem cruzamentos aleatórios.
4. ${focusDirective}

SAÍDA (APENAS JSON: {"recommendations":[...]}):
Campos por item: title (PT se existir), originalTitle (idioma original), author, publishedYear (number), pageCount (number), categories (2-3 gêneros curtos PT), matchPercentage (84-99 desc), synopsis (320-480 chars PT, envolvente, sem spoilers), matchReason (1-2 frases citando 1+ livro base pelo nome), isbn (ISBN-13 ou "").`;
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
    ...excludeTitles.map(normalizeKey),
    ...seedBooks.map((b) => normalizeKey(b.title)),
  ]);
  const seedAuthors = new Set<string>(seedBooks.map((b) => normalizeKey(b.author)));
  const seenTitles = new Set<string>();
  const seenAuthors = new Set<string>();

  const candidates: NormalizedRecommendation[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const author = typeof item.author === 'string' ? item.author.trim() : '';
    if (!title || !author) continue;

    const titleKey = normalizeKey(title);
    const authorKey = normalizeKey(author);
    if (!titleKey || !authorKey) continue;
    if (excludedKeys.has(titleKey) || seenTitles.has(titleKey)) continue;
    if (seenAuthors.has(authorKey)) continue;

    seenTitles.add(titleKey);
    seenAuthors.add(authorKey);

    const parsedYear =
      typeof item.publishedYear === 'number'
        ? item.publishedYear
        : parseInt(String(item.publishedYear ?? ''), 10);
    const parsedPages =
      typeof item.pageCount === 'number'
        ? item.pageCount
        : parseInt(String(item.pageCount ?? ''), 10);
    const parsedMatch =
      typeof item.matchPercentage === 'number'
        ? item.matchPercentage
        : parseInt(String(item.matchPercentage ?? ''), 10);

    const categories = Array.isArray(item.categories)
      ? item.categories
          .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
          .map((c) => c.trim())
          .slice(0, 3)
      : ['Literatura'];

    const synopsis =
      typeof item.synopsis === 'string' && item.synopsis.trim().length > 0
        ? item.synopsis.trim()
        : `Obra de ${author} selecionada pela forte afinidade temática com suas escolhas.`;

    const matchReason =
      typeof item.matchReason === 'string' && item.matchReason.trim().length > 0
        ? item.matchReason.trim()
        : `Dialoga diretamente com os temas e o estilo de "${seedBooks[0]?.title ?? 'suas leituras'}".`;

    const id = `ai-${slugify(title)}-${slugify(author)}`.slice(0, 80);

    candidates.push({
      id,
      title,
      originalTitle:
        typeof item.originalTitle === 'string' && item.originalTitle.trim()
          ? item.originalTitle.trim()
          : undefined,
      author,
      publishedYear: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : 2000,
      pageCount: Number.isFinite(parsedPages) && parsedPages > 20 ? parsedPages : 280,
      categories: categories.length > 0 ? categories : ['Literatura'],
      matchPercentage: Number.isFinite(parsedMatch)
        ? Math.min(99, Math.max(80, Math.round(parsedMatch)))
        : Math.max(84, 98 - candidates.length),
      synopsis,
      matchReason,
      isbn: typeof item.isbn === 'string' && item.isbn.trim().length >= 10 ? item.isbn.trim() : undefined,
    });
  }

  // Prefer authors that are NOT already in seedBooks first, allowing at most 1 seed-author match if needed
  const nonSeedAuthorBooks = candidates.filter((c) => !seedAuthors.has(normalizeKey(c.author)));
  const seedAuthorBooks = candidates.filter((c) => seedAuthors.has(normalizeKey(c.author))).slice(0, 1);

  const finalResults = [...nonSeedAuthorBooks, ...seedAuthorBooks].slice(0, 10);
  return finalResults.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

class GroqHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callGroqModel(
  model: string,
  systemPrompt: string,
  apiKey: string
): Promise<RawRecommendation[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 16000);

  try {
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Gere as 10 recomendações em JSON agora.' },
      ],
      temperature: 0.65,
      max_tokens: 3400,
      response_format: { type: 'json_object' },
    };

    if (model.startsWith('openai/gpt-oss-')) {
      body.reasoning_effort = 'low';
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new GroqHttpError(response.status, `Groq ${model} (${response.status}): ${errorText.slice(0, 200)}`);
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
  let body: { seedBooks?: SeedBookInput[]; excludeTitles?: string[]; focus?: CurationFocus };
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

  const validFocuses: CurationFocus[] = ['balanced', 'quick', 'classics', 'modern', 'hidden-gems'];
  const focus: CurationFocus = body.focus && validFocuses.includes(body.focus) ? body.focus : 'balanced';

  const apiKey = getGroqKey();
  if (!apiKey) {
    return c.json({
      recommendations: [],
      source: 'fallback',
      errorCode: 'MISSING_KEY',
      reason: 'GROQ_API_KEY não configurada no servidor.',
    });
  }

  const systemPrompt = buildSystemPrompt(seedBooks, excludeTitles, focus);
  const candidateModels = PREFERRED_MODELS.slice(0, 2);
  let lastErrorCode = 'GROQ_ERROR';
  let sawModelNotFound = false;

  for (const model of candidateModels) {
    try {
      const raw = await callGroqModel(model, systemPrompt, apiKey);
      const recommendations = normalizeRecommendations(raw, seedBooks, excludeTitles);
      if (recommendations.length >= 5) {
        return c.json({ recommendations, source: 'groq', model });
      }
    } catch (err) {
      if (err instanceof GroqHttpError) {
        if (err.status === 401 || err.status === 403) {
          lastErrorCode = 'GROQ_UNAUTHORIZED';
          break;
        } else if (err.status === 404) {
          lastErrorCode = 'GROQ_MODEL_NOT_FOUND';
          sawModelNotFound = true;
        } else if (err.status === 429) {
          lastErrorCode = 'GROQ_RATE_LIMIT';
        }
      }
      console.warn(`[MatchBook API] Modelo ${model} falhou:`, err instanceof Error ? err.message : err);
    }
  }

  // Only query /models when a preferred model returned 404 (avoids cold-start round-trip on happy path)
  if (sawModelNotFound) {
    cachedChatModels = null;
    const discovered = await fetchAvailableChatModels(apiKey);
    const fallbackDiscovered = discovered.find((m) => !(candidateModels as readonly string[]).includes(m));
    if (fallbackDiscovered) {
      try {
        const raw = await callGroqModel(fallbackDiscovered, systemPrompt, apiKey);
        const recommendations = normalizeRecommendations(raw, seedBooks, excludeTitles);
        if (recommendations.length >= 5) {
          return c.json({ recommendations, source: 'groq', model: fallbackDiscovered });
        }
      } catch (err) {
        console.warn(`[MatchBook API] Descoberto ${fallbackDiscovered} falhou:`, err instanceof Error ? err.message : err);
      }
    }
  }

  return c.json({
    recommendations: [],
    source: 'fallback',
    errorCode: lastErrorCode,
    reason: 'Modelos de IA temporariamente indisponíveis.',
  });
});
