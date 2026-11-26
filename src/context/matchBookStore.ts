import { createContext } from 'react';
import type { SeedBook, BookRecommendation, MatchBook } from '../types/book';

export interface UndoableSwipe {
  type: 'like' | 'pass';
  book: BookRecommendation;
  direction: 'left' | 'right';
}

export interface MatchBookContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  seeds: SeedBook[];
  saveSeeds: (nextSeeds: SeedBook[]) => void;
  recentSeeds: SeedBook[];
  recordRecentSeeds: (books: SeedBook[]) => void;
  removeRecentSeed: (bookId: string) => void;
  matches: MatchBook[];
  excludedTitles: string[];
  likeBook: (book: BookRecommendation) => void;
  passBook: (book: BookRecommendation) => void;
  undoSwipe: (action: UndoableSwipe) => void;
  deleteMatch: (bookId: string) => void;
}

export const MatchBookContext = createContext<MatchBookContextValue | null>(null);
