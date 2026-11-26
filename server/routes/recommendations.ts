import { Hono } from 'hono';

export const recommendationsRoutes = new Hono();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PREFERRED_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const;

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
  balanced: 'Equilíbrio geral: varie épocas, estilos e tamanhos mantendo conexão genuína com os 3 livros-base.',
  quick: 'FOCO DE CURADORIA (LEITURAS CURTAS): Priorize obras ágeis e concisas (preferencialmente até ~260 páginas), sem perder profundidade.',
  classics: 'FOCO DE CURADORIA (CLÁSSICOS): Priorize grandes clássicos atemporais da literatura brasileira e mundial (publicados antes de 1985).',
  modern: 'FOCO DE CURADORIA (CONTEMPORÂNEOS): Priorize obras modernas e contemporâneas publicadas a partir do ano 2000.',
  'hidden-gems': 'FOCO DE CURADORIA (JOIAS OCULTAS): Evite os bestsellers mais clichês e óbvios; recomende obras aclamadas pela crítica e menos óbvias.',
};

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
          ? ` [${b.categories.slice(0, 3).join(', ')}]`
          : '';
      return `Livro #${i + 1}: "${b.title}" — ${b.author} (${b.publishedYear || '?'})${cats}`;
    })
    .join('\n');

  const excludeList =
    excludeTitles.length > 0
      ? `\nEXCLUIR OBRIGATORIAMENTE (não recomende nenhum destes): ${excludeTitles.slice(0, 60).join(', ')}`
      : '';

  const focusDirective = FOCUS_DIRECTIVES[focus] || FOCUS_DIRECTIVES.balanced;

  return `Você é um curador literário sênior do MatchBook. Recomende 10 livros REAIS e publicados com alta afinidade ao conjunto completo dos livros-base abaixo.

LIVROS-BASE DO LEITOR:
${seedsDescription}${excludeList}

DISTRIBUIÇÃO E DIVERSIDADE (CRÍTICO — SIGA À RISCA):
1. EQUILÍBRIO ENTRE OS 3 LIVROS: NÃO foque em apenas 1 livro-base. Quando houver 3 livros-base, distribua as 10 indicações de forma equilibrada:
   - 3 recomendações inspiradas principalmente no Livro #1
   - 3 recomendações inspiradas principalmente no Livro #2
   - 3 recomendações inspiradas principalmente no Livro #3
   - 1 recomendação "ponte" que sintetize temas de 2 ou 3 livros juntos.
2. MÁXIMO 1 LIVRO POR AUTOR: Os 10 livros recomendados DEVEM ter 10 autores completamente diferentes entre si. Evite repetir qualquer autor dos livros-base (prefira sempre novos autores).
3. COERÊNCIA TEMÁTICA: Analise o domínio de cada livro-base (ficção literária, biografia/memórias, sci-fi/fantasia, não-ficção técnica, filosofia) e nunca faça cruzamentos aleatórios sem conexão real.
4. ${focusDirective}

FORMATO DE SAÍDA (APENAS JSON VÁLIDO: {"recommendations": [...]}):
Cada item deve conter:
- "title": string (título em português se existir edição conhecida, senão original)
- "originalTitle": string (título original da obra no idioma nativo)
- "author": string (nome completo do autor — nunca repetido na lista)
- "publishedYear": number (ano de publicação original)
- "pageCount": number (número aproximado de páginas)
- "categories": string[] (2 a 3 gêneros curtos em português)
- "matchPercentage": number (inteiro entre 84 e 99, ordenado do maior para o menor)
- "synopsis": string (420 a 620 caracteres em português, em 2 a 3 frases envolventes apresentando premissa, conflito central e atmosfera da obra, SEM spoilers)
- "matchReason": string (1 a 2 frases diretas em português citando explicitamente pelo menos 1 dos livros-base pelo nome e o elemento concreto que os conecta)
- "isbn": string (ISBN-13 se souber com segurança, senão string vazia)

Garanta 10 obras reais distintas, 10 autores diferentes, e zero repetição dos livros-base ou excluídos.`;
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
  const timeout = setTimeout(() => controller.abort(), 24000);

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
          { role: 'user', content: 'Gere as 10 recomendações equilibradas e diversificadas em JSON agora.' },
        ],
        temperature: 0.65,
        max_tokens: 3600,
        response_format: { type: 'json_object' },
      }),
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
  let lastErrorCode = 'GROQ_ERROR';

  for (const model of PREFERRED_MODELS) {
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
        } else if (err.status === 429) {
          lastErrorCode = 'GROQ_RATE_LIMIT';
        }
      }
      console.warn(`[MatchBook API] Modelo ${model} falhou:`, err instanceof Error ? err.message : err);
    }
  }

  return c.json({
    recommendations: [],
    source: 'fallback',
    errorCode: lastErrorCode,
    reason: 'Modelos de IA temporariamente indisponíveis.',
  });
});
