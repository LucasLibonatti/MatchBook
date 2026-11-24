import { useState, useCallback, useEffect, type ReactNode } from 'react';
import type { SeedBook, BookRecommendation, MatchBook, SwipeAction } from '../types/book';
import { MatchBookContext, type UndoableSwipe } from './matchBookStore';
import {
  getTheme,
  setTheme as persistTheme,
  getSeeds,
  setSeeds as persistSeeds,
  getMatches,
  setMatches as persistMatches,
  getSwipes,
  setSwipes as persistSwipes,
  getExcludedTitles,
  setExcludedTitles as persistExcludedTitles,
} from '../utils/storage';

export function MatchBookProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => getTheme());
  const [seeds, setSeedsState] = useState<SeedBook[]>(() => getSeeds());
  const [matches, setMatchesState] = useState<MatchBook[]>(() => getMatches());
  const [excludedTitles, setExcludedTitlesState] = useState<string[]>(() => getExcludedTitles());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      return next;
    });
  }, []);

  const saveSeeds = useCallback((nextSeeds: SeedBook[]) => {
    setSeedsState(nextSeeds);
    persistSeeds(nextSeeds);
  }, []);

  const addExcluded = useCallback((title: string) => {
    const normalized = title.toLowerCase().trim();
    setExcludedTitlesState((prev) => {
      if (prev.some((t) => t.toLowerCase().trim() === normalized)) return prev;
      const next = [title, ...prev].slice(0, 200);
      persistExcludedTitles(next);
      return next;
    });
  }, []);

  const likeBook = useCallback(
    (book: BookRecommendation) => {
      setMatchesState((prev) => {
        if (prev.some((m) => m.id === book.id)) return prev;
        const matchBook: MatchBook = { ...book, matchedAt: Date.now() };
        const next = [matchBook, ...prev];
        persistMatches(next);
        return next;
      });
      const entry: SwipeAction = { type: 'like', bookId: book.id, timestamp: Date.now() };
      persistSwipes([entry, ...getSwipes()].slice(0, 100));
      addExcluded(book.title);
    },
    [addExcluded]
  );

  const passBook = useCallback(
    (book: BookRecommendation) => {
      const entry: SwipeAction = { type: 'pass', bookId: book.id, timestamp: Date.now() };
      persistSwipes([entry, ...getSwipes()].slice(0, 100));
      addExcluded(book.title);
    },
    [addExcluded]
  );

  const undoSwipe = useCallback((action: UndoableSwipe) => {
    if (action.type === 'like') {
      setMatchesState((prev) => {
        const next = prev.filter((m) => m.id !== action.book.id);
        persistMatches(next);
        return next;
      });
    }

    const swipes = getSwipes().filter((s) => s.bookId !== action.book.id);
    persistSwipes(swipes);

    const normalized = action.book.title.toLowerCase().trim();
    setExcludedTitlesState((prev) => {
      const next = prev.filter((t) => t.toLowerCase().trim() !== normalized);
      persistExcludedTitles(next);
      return next;
    });
  }, []);

  const deleteMatch = useCallback((bookId: string) => {
    setMatchesState((prev) => {
      const next = prev.filter((m) => m.id !== bookId);
      persistMatches(next);
      return next;
    });
  }, []);

  return (
    <MatchBookContext.Provider
      value={{
        theme,
        toggleTheme,
        seeds,
        saveSeeds,
        matches,
        excludedTitles,
        likeBook,
        passBook,
        undoSwipe,
        deleteMatch,
      }}
    >
      {children}
    </MatchBookContext.Provider>
  );
}
