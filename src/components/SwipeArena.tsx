import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Sparkles, BookOpen, Heart, X, Undo2, RefreshCw } from 'lucide-react';
import type { BookRecommendation, SeedBook, CurationFocus } from '../types/book';
import { BookCard, type SwipeTransition } from './BookCard';
import { ToastContainer } from './Toast';
import { hydrateRecommendationCovers } from '../services/bookCoverService';
import { getRecommendations } from '../services/groqService';
import { useMatchBook } from '../hooks/useMatchBook';
import type { UndoableSwipe } from '../context/matchBookStore';

interface SwipeArenaProps {
  seedBooks: SeedBook[];
  onBackToOnboarding: () => void;
  isModalOpen?: boolean;
}

const SWIPE_THROTTLE_MS = 260;

const FOCUS_OPTIONS: Array<{ value: CurationFocus; label: string }> = [
  { value: 'balanced', label: 'Equilibrado' },
  { value: 'quick', label: 'Curtos' },
  { value: 'classics', label: 'Clássicos' },
  { value: 'modern', label: 'Modernos' },
  { value: 'hidden-gems', label: 'Joias Ocultas' },
];

export function SwipeArena({ seedBooks, onBackToOnboarding, isModalOpen = false }: SwipeArenaProps) {
  const { likeBook, passBook, undoSwipe, excludedTitles } = useMatchBook();

  const [books, setBooks] = useState<BookRecommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focus, setFocus] = useState<CurationFocus>('balanced');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Lendo a essência dos seus 3 livros...');
  const [error, setError] = useState<string | null>(null);
  const [batchSource, setBatchSource] = useState<'groq' | 'fallback'>('groq');
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [lastAction, setLastAction] = useState<UndoableSwipe | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; book: BookRecommendation }>>([]);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [transitionState, setTransitionState] = useState<SwipeTransition>({
    direction: 'right',
    mode: 'swipe',
  });

  const lastSwipeAtRef = useRef(0);
  const excludedTitlesRef = useRef(excludedTitles);
  useEffect(() => {
    excludedTitlesRef.current = excludedTitles;
  }, [excludedTitles]);

  const visibleBooks = books.slice(currentIndex, currentIndex + 3);
  const activeBook = books[currentIndex] ?? null;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function fetchBatch() {
      setIsLoading(true);
      setError(null);
      setErrorCode(undefined);
      setIsSynopsisExpanded(false);
      setLastAction(null);

      try {
        setLoadingStage('Curando primeiros 5 livros com IA...');
        const seedTitles = seedBooks.map((b) => b.title);
        const allExcluded = [...excludedTitlesRef.current, ...seedTitles];

        // 1. Fetch first 5 books for ultra-fast initial load
        const batch = await getRecommendations(seedBooks, allExcluded, focus, 5);
        if (cancelled) return;

        setBatchSource(batch.source);
        setErrorCode(batch.errorCode);
        setLoadingStage('Buscando capas em alta definição...');
        setBooks(batch.recommendations);

        const initialHydrated = await hydrateRecommendationCovers(
          batch.recommendations,
          (index, updatedBook) => {
            if (cancelled) return;
            setBooks((prev) => {
              if (index < 0 || index >= prev.length) return prev;
              const next = [...prev];
              next[index] = updatedBook;
              return next;
            });
          },
          controller.signal
        );

        if (cancelled) return;
        setBooks((prev) =>
          prev.length === initialHydrated.length
            ? prev.map((b, i) => (b.coverUrl ? b : initialHydrated[i]))
            : initialHydrated
        );
        setCurrentIndex(0);
        setIsLoading(false);

        // 2. Background prefetch: fetch +5 more books silently while the user reads/swipes
        void (async () => {
          const firstTitles = initialHydrated.map((b) => b.title);
          const nextExcluded = [...allExcluded, ...firstTitles];
          const secondBatch = await getRecommendations(seedBooks, nextExcluded, focus, 5);
          if (cancelled || controller.signal.aborted || secondBatch.recommendations.length === 0) return;

          const baseOffset = initialHydrated.length;
          setBooks((prev) => {
            const existingKeys = new Set(prev.map((b) => b.title.toLowerCase().trim()));
            const uniqueAdditions = secondBatch.recommendations.filter(
              (b) => !existingKeys.has(b.title.toLowerCase().trim())
            );
            return [...prev, ...uniqueAdditions];
          });

          await hydrateRecommendationCovers(
            secondBatch.recommendations,
            (subIndex, updatedBook) => {
              if (cancelled || controller.signal.aborted) return;
              setBooks((prev) => {
                const targetIdx = baseOffset + subIndex;
                if (targetIdx < 0 || targetIdx >= prev.length) return prev;
                if (prev[targetIdx]?.id !== updatedBook.id) return prev;
                const next = [...prev];
                next[targetIdx] = updatedBook;
                return next;
              });
            },
            controller.signal
          );
        })();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar recomendações');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchBatch();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [seedBooks, focus, reloadNonce]);

  const performSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const targetBook = books[currentIndex];
      if (!targetBook) return;

      const now = Date.now();
      if (now - lastSwipeAtRef.current < SWIPE_THROTTLE_MS) return;
      lastSwipeAtRef.current = now;

      const action: UndoableSwipe = {
        type: direction === 'right' ? 'like' : 'pass',
        book: targetBook,
        direction,
      };

      if (direction === 'right') {
        likeBook(targetBook);
        const toastId = `${targetBook.id}-${now}`;
        setToasts((prev) => [...prev, { id: toastId, book: targetBook }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 3800);
      } else {
        passBook(targetBook);
      }

      setIsSynopsisExpanded(false);
      setLastAction(action);
      setTransitionState({ direction, mode: 'swipe' });
      setCurrentIndex((prev) => prev + 1);
    },
    [books, currentIndex, likeBook, passBook]
  );

  const handleUndo = useCallback(() => {
    if (!lastAction || currentIndex === 0) return;

    undoSwipe(lastAction);
    setIsSynopsisExpanded(false);
    setTransitionState({ direction: lastAction.direction, mode: 'undo' });
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setLastAction(null);
  }, [lastAction, currentIndex, undoSwipe]);

  const toggleSynopsis = useCallback(() => {
    if (!books[currentIndex]) return;
    setIsSynopsisExpanded((prev) => !prev);
  }, [books, currentIndex]);

  // Global keyboard shortcuts for the swipe arena
  useEffect(() => {
    if (isLoading || isModalOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      switch (e.key) {
        case 'ArrowRight':
          if (!isSynopsisExpanded) {
            e.preventDefault();
            performSwipe('right');
          }
          break;
        case 'ArrowLeft':
          if (!isSynopsisExpanded) {
            e.preventDefault();
            performSwipe('left');
          }
          break;
        case 'z':
        case 'Z':
        case 'Backspace':
          if (!isSynopsisExpanded) {
            e.preventDefault();
            handleUndo();
          }
          break;
        case ' ':
          e.preventDefault();
          toggleSynopsis();
          break;
        case 'Escape':
          if (isSynopsisExpanded) {
            e.preventDefault();
            setIsSynopsisExpanded(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isLoading, isModalOpen, isSynopsisExpanded, performSwipe, handleUndo, toggleSynopsis]);

  const handleGenerateMore = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] px-4" role="status" aria-live="polite">
        <motion.div
          className="w-16 h-16 border-4 border-current border-t-transparent rounded-full animate-spin"
          style={{ color: 'var(--accent-primary)' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        />
        <p className="mt-6 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {loadingStage}
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          Isso pode levar alguns segundos
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] px-4 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent-soft)' }}>
          <X className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h3 className="font-display italic text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
          Não foi possível carregar
        </h3>
        <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          {error}
        </p>
        <button
          type="button"
          onClick={handleGenerateMore}
          className="btn-primary flex items-center justify-center gap-2 focus-ring"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tentar novamente</span>
        </button>
      </div>
    );
  }

  if (books.length === 0 || currentIndex >= books.length) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--accent-soft)' }}>
          <Sparkles className="w-10 h-10" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h2 className="font-display italic text-2xl sm:text-3xl mb-3" style={{ color: 'var(--text-primary)' }}>
          Você avaliou todos os {books.length || 10} livros
        </h2>
        <p className="text-sm sm:text-base mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          Quer continuar descobrindo? Gere mais recomendações baseadas no seu gosto ou troque seus 3 livros base para uma nova jornada.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={handleGenerateMore}
            className="btn-primary flex items-center justify-center gap-2 focus-ring"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar +10 Recomendações</span>
          </button>
          <button
            type="button"
            onClick={onBackToOnboarding}
            className="btn-secondary flex items-center justify-center gap-2 focus-ring"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Trocar 3 Livros Base</span>
          </button>
        </div>
      </motion.div>
    );
  }

  const canUndo = Boolean(lastAction && currentIndex > 0);
  const fallbackTitle = errorCode
    ? `Acervo curado local ativo (IA indisponível: ${errorCode})`
    : 'Acervo curado local ativo';

  return (
    <div
      className="h-[calc(100dvh-4rem)] overflow-hidden flex flex-col justify-between items-center px-4 sm:px-6 py-3 select-none"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Top Bar: Seed pills + Focus filters + Counter */}
      <div className="shrink-0 w-full max-w-[420px] lg:max-w-[820px] flex flex-col gap-2 mb-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
              Baseado em:
            </span>
            {seedBooks.map((seed) => (
              <span
                key={seed.id}
                className="editorial-pill text-[0.68rem] font-mono truncate max-w-[140px] sm:max-w-[200px]"
                title={seed.title}
              >
                {seed.title}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {batchSource === 'fallback' && (
              <span
                className="editorial-pill text-[0.65rem] font-mono"
                title={fallbackTitle}
                style={{
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  backgroundColor: 'var(--accent-soft)',
                }}
              >
                Local
              </span>
            )}
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {Math.min(currentIndex + 1, books.length)} / {books.length}
            </span>
            <button
              type="button"
              onClick={onBackToOnboarding}
              className="btn-ghost flex items-center gap-1 p-1.5 focus-ring"
              aria-label="Trocar 3 livros base"
              title="Trocar 3 livros base"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Curation focus filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5" role="group" aria-label="Filtro de curadoria">
          <span className="text-[0.68rem] font-mono shrink-0 mr-1" style={{ color: 'var(--text-muted)' }}>
            Estilo:
          </span>
          {FOCUS_OPTIONS.map((opt) => {
            const active = focus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFocus(opt.value)}
                aria-pressed={active}
                className="px-2.5 py-1 rounded-full text-[0.7rem] font-mono transition-colors shrink-0 cursor-pointer focus-ring"
                style={{
                  backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Card Stack */}
      <div className="relative w-full max-w-[420px] lg:max-w-[820px] flex-1 min-h-0 max-h-[560px] lg:max-h-[480px] flex items-center justify-center my-1">
        <AnimatePresence initial={false} custom={transitionState}>
          {visibleBooks.map((book, i) => (
            <BookCard
              key={book.id}
              book={book}
              index={i}
              isActive={i === 0}
              isSynopsisExpanded={i === 0 && isSynopsisExpanded}
              onToggleSynopsis={toggleSynopsis}
              onSwipe={performSwipe}
              swipeTransition={transitionState}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="shrink-0 flex flex-col items-center gap-2 pt-2 w-full max-w-[420px] lg:max-w-[820px]">
        <div className="flex items-center justify-center gap-3">
          <motion.button
            type="button"
            onClick={() => performSwipe('left')}
            disabled={!activeBook}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 border focus-ring disabled:opacity-40 cursor-pointer"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--accent-primary)',
            }}
            aria-label="Passar (Seta Esquerda)"
            whileHover={{ scale: 1.08, boxShadow: '0 8px 28px rgba(239, 68, 68, 0.28)', borderColor: 'var(--accent-primary)' }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-6 h-6" />
          </motion.button>

          <motion.button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="px-5 h-11 rounded-full flex items-center justify-center gap-2 transition-all duration-200 border font-mono text-xs focus-ring disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
            }}
            aria-label="Desfazer (Z ou Backspace)"
            whileHover={canUndo ? { scale: 1.05, borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' } : undefined}
            whileTap={canUndo ? { scale: 0.95 } : undefined}
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Desfazer</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => performSwipe('right')}
            disabled={!activeBook}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus-ring disabled:opacity-40 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(234, 88, 12, 0.4)',
            }}
            aria-label="Quero Ler (Seta Direita)"
            whileHover={{ scale: 1.08, boxShadow: '0 12px 40px rgba(234, 88, 12, 0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={toggleSynopsis}
            disabled={!activeBook}
            className="btn-secondary flex items-center gap-2 px-4 focus-ring disabled:opacity-40 cursor-pointer"
            aria-label="Detalhes (Espaço)"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-mono text-xs">{isSynopsisExpanded ? 'Fechar Sinopse' : 'Sinopse'}</span>
          </button>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Atalhos: ← Passar • → Quero Ler • Z Desfazer • Espaço Sinopse
        </p>
      </div>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
