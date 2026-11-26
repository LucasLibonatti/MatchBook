export type CurationFocus = 'balanced' | 'quick' | 'classics' | 'modern' | 'hidden-gems';

export interface SeedBook {
  id: string;
  title: string;
  originalTitle?: string;
  author: string;
  publishedYear?: string | number;
  categories: string[];
  coverUrl?: string;
  isbn?: string;
  pageCount?: number;
  fallbackSynopsis?: string;
  fallbackMatchReason?: string;
}

export interface BookRecommendation {
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
  coverUrl?: string;
  previewLink?: string;
  infoLink?: string;
  isbn?: string;
}

export interface MatchBook extends BookRecommendation {
  matchedAt: number;
}

export interface SwipeAction {
  type: 'like' | 'pass';
  bookId: string;
  timestamp: number;
}

export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  publishedYear?: string | number;
  categories: string[];
  coverUrl?: string;
  isbn?: string;
  source: 'google' | 'openlibrary' | 'curated';
}
