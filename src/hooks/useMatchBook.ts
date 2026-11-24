import { useContext } from 'react';
import { MatchBookContext, type MatchBookContextValue } from '../context/matchBookStore';

export function useMatchBook(): MatchBookContextValue {
  const ctx = useContext(MatchBookContext);
  if (!ctx) {
    throw new Error('useMatchBook deve ser usado dentro de MatchBookProvider');
  }
  return ctx;
}
