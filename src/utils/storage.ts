import type { SeedBook, BookRecommendation, MatchBook, SwipeAction } from '../types/book';

const STORAGE_KEYS = {
  THEME: 'matchbook_theme',
  SEEDS: 'matchbook_seeds_v2',
  MATCHES: 'matchbook_matches_v2',
  SWIPES: 'matchbook_swipes_v2',
  COVERS_CACHE: 'matchbook_covers_cache_v4',
  EXCLUDED_TITLES: 'matchbook_excluded_titles_v2',
} as const;

export function getTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch {
    // Ignore storage errors
  }
}

export function getSeeds(): SeedBook[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SEEDS);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore
  }
  return [];
}

export function setSeeds(seeds: SeedBook[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SEEDS, JSON.stringify(seeds));
  } catch {
    // Ignore
  }
}

export function getMatches(): MatchBook[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore
  }
  return [];
}

export function setMatches(matches: MatchBook[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  } catch {
    // Ignore
  }
}

export function addMatch(book: BookRecommendation): void {
  const matches = getMatches();
  const exists = matches.some(m => m.id === book.id);
  if (!exists) {
    const matchBook: MatchBook = {
      ...book,
      matchedAt: Date.now(),
    };
    setMatches([matchBook, ...matches]);
  }
}

export function removeMatch(bookId: string): void {
  const matches = getMatches().filter(m => m.id !== bookId);
  setMatches(matches);
}

export function getSwipes(): SwipeAction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SWIPES);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore
  }
  return [];
}

export function setSwipes(swipes: SwipeAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SWIPES, JSON.stringify(swipes));
  } catch {
    // Ignore
  }
}

export function addSwipe(action: SwipeAction): void {
  const swipes = getSwipes();
  setSwipes([action, ...swipes].slice(0, 100));
}

export function getExcludedTitles(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXCLUDED_TITLES);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore
  }
  return [];
}

export function setExcludedTitles(titles: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXCLUDED_TITLES, JSON.stringify(titles));
  } catch {
    // Ignore
  }
}

export function addExcludedTitle(title: string): void {
  const titles = getExcludedTitles();
  const normalized = title.toLowerCase().trim();
  if (!titles.some(t => t.toLowerCase().trim() === normalized)) {
    setExcludedTitles([title, ...titles].slice(0, 200));
  }
}

export function clearExcludedTitles(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.EXCLUDED_TITLES);
  } catch {
    // Ignore
  }
}

export interface CoverCacheEntry {
  url: string;
  timestamp: number;
}

export function getCoverCache(): Record<string, CoverCacheEntry> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COVERS_CACHE);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore
  }
  return {};
}

export function setCoverCache(cache: Record<string, CoverCacheEntry>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COVERS_CACHE, JSON.stringify(cache));
  } catch {
    // Ignore
  }
}

export function getCachedCover(key: string): string | null {
  const cache = getCoverCache();
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < 30 * 24 * 60 * 60 * 1000) {
    return entry.url;
  }
  return null;
}

export function setCachedCover(key: string, url: string): void {
  const cache = getCoverCache();
  cache[key] = { url, timestamp: Date.now() };
  setCoverCache(cache);
}

function slugify(title: string, author: string): string {
  return `${title}-${author}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function getCoverCacheKey(title: string, author: string): string {
  return slugify(title, author);
}

export function clearAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore
  }
}