import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RotateCcw, Sparkles, BookOpen, Heart, X, Undo2, RefreshCw } from 'lucide-react';
import type { BookRecommendation, SeedBook } from '../types/book';
import { BookCard } from './BookCard';
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

export function SwipeArena({ seedBooks, onBackToOnboarding, isModalOpen = false }: SwipeArenaProps) {
  const { likeBook, passBook, undoSwipe, excludedTitles } = useMatchBook();

  const [books, setBooks] = useState<BookRecommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Lendo a essência dos seus 3 livros...');
  const [error, setError] = useState<string | null>(null);
  const [batchSource, setBatchSource] = useState<'groq' | 'fallback'>('groq');
  const [lastAction, setLastAction] = useState<UndoableSwipe | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; book: BookRecommendation }>>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const excludedTitlesRef = useRef(excludedTitles);
  useEffect(() => {
    excludedTitlesRef.current = excludedTitles;
  }, [excludedTitles]);

  const x = useMotionValue<number>(0);
  const y = useMotionValue<number>(0);
  const cardOpacity = useMotionValue<number>(1);
  const cardRotate = useMotionValue<number>(0);

  const likeOpacity = useTransform<number, number>(x, [20, 120], [0, 1]);
  const passOpacity = useTransform<number, number>(x, [-20, -120], [0, 1]);
  const likeScale = useTransform<number, number>(x, [20, 120], [0.8, 1]);
  const passScale = useTransform<number, number>(x, [-20, -120], [0.8, 1]);

  const nextCardScale = useTransform<number, number>(x, [-150, 0, 150], [1, 0.94, 1]);
  const nextCardY = useTransform<number, number>(x, [-150, 0, 150], [0, 14, 0]);
  const nextCardOpacity = useTransform<number, number>(x, [-150, 0, 150], [1, 0.65, 1]);

  const thirdCardScale = useTransform<number, number>(x, [-150, 0, 150], [0.9, 0.88, 0.9]);
  const thirdCardY = useTransform<number, number>(x, [-150, 0, 150], [24, 28, 24]);
  const thirdCardOpacity = useTransform<number, number>(x, [-150, 0, 150], [0.5, 0.35, 0.5]);

  const thirdCardScaleStable = useTransform<number, number>(x, () => 0.82);
  const thirdCardYStable = useTransform<number, number>(x, () => 40);
  const thirdCardOpacityStable = useTransform<number, number>(x, () => 0.2);

  const visibleBooks = books.slice(currentIndex, currentIndex + 3);
  const activeBook = books[currentIndex] ?? null;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function fetchBatch() {
      setIsLoading(true);
      setError(null);
      setIsSynopsisExpanded(false);
      setLastAction(null);
      x.set(0);
      y.set(0);
      cardRotate.set(0);
      cardOpacity.set(1);

      try {
        setLoadingStage('Consultando curadoria de IA...');
        const seedTitles = seedBooks.map((b) => b.title);
        const allExcluded = [...excludedTitlesRef.current, ...seedTitles];

        const batch = await getRecommendations(seedBooks, allExcluded);
        if (cancelled) return;

        setBatchSource(batch.source);
        setLoadingStage('Preparando capas em alta definição...');

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
        setBooks(initialHydrated);
        setCurrentIndex(0);
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
  }, [seedBooks, reloadNonce, x, y, cardRotate, cardOpacity]);

  const performSwipe = useCallback(
    (
      direction: 'left' | 'right',
      book: BookRecommendation,
      options?: { velocityX?: number; fromDrag?: boolean }
    ) => {
      if (isAnimating) return;

      const { velocityX = 0, fromDrag = false } = options || {};
      const action: UndoableSwipe = {
        type: direction === 'right' ? 'like' : 'pass',
        book,
        direction,
      };

      if (direction === 'right') {
        likeBook(book);
        const toastId = `${book.id}-${Date.now()}`;
        setToasts((prev) => [...prev, { id: toastId, book }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 3800);
      } else {
        passBook(book);
      }

      setIsSynopsisExpanded(false);
      setIsAnimating(true);

      const throwDistance = (typeof window !== 'undefined' ? window.innerWidth : 1400) + 400;
      const targetX = direction === 'right' ? throwDistance : -throwDistance;
      const targetY = y.get() + (direction === 'right' ? 30 : -30);
      const targetRotate = direction === 'right' ? 25 : -25;

      const animConfig =
        fromDrag && Math.abs(velocityX) > 800
          ? { type: 'spring' as const, stiffness: 350, damping: 18, mass: 0.6 }
          : { type: 'spring' as const, stiffness: 280, damping: 22, mass: 0.8 };

      animate(x, targetX, animConfig);
      animate(y, targetY, animConfig);
      animate(cardRotate, targetRotate, animConfig);
      animate(cardOpacity, 0, { duration: 0.18, ease: 'easeOut' }).then(() => {
        setCurrentIndex((prev) => prev + 1);
        setLastAction(action);
        x.set(0);
        y.set(0);
        cardRotate.set(0);
        cardOpacity.set(1);
        setIsAnimating(false);
      });
    },
    [isAnimating, likeBook, passBook, x, y, cardRotate, cardOpacity]
  );

  const triggerSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!activeBook || isAnimating) return;
      performSwipe(direction, activeBook, { fromDrag: false });
    },
    [activeBook, isAnimating, performSwipe]
  );

  const handleUndo = useCallback(() => {
    if (!lastAction || isAnimating || currentIndex === 0) return;

    undoSwipe(lastAction);
    setIsSynopsisExpanded(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));

    const returnFromX = lastAction.direction === 'right' ? 420 : -420;
    const returnFromRotate = lastAction.direction === 'right' ? 16 : -16;
    x.set(returnFromX);
    cardRotate.set(returnFromRotate);
    y.set(24);
    animate(x, 0, { type: 'spring', stiffness: 420, damping: 28 });
    animate(cardRotate, 0, { type: 'spring', stiffness: 420, damping: 28 });
    animate(y, 0, { type: 'spring', stiffness: 420, damping: 28 });

    setLastAction(null);
  }, [lastAction, isAnimating, currentIndex, undoSwipe, x, y, cardRotate]);

  const handleDragEnd = useCallback(
    (offsetX: number, _offsetY: number, velocityX: number) => {
      if (!activeBook) return;
      const shouldSwipe = Math.abs(offsetX) > 100 || Math.abs(velocityX) > 400;

      if (shouldSwipe) {
        const direction = offsetX > 0 ? 'right' : 'left';
        performSwipe(direction, activeBook, { velocityX, fromDrag: true });
      } else {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
        animate(cardRotate, 0, { type: 'spring', stiffness: 500, damping: 30 });
      }
    },
    [activeBook, performSwipe, x, y, cardRotate]
  );

  const toggleSynopsis = useCallback(() => {
    if (!activeBook || isAnimating) return;
    setIsSynopsisExpanded((prev) => !prev);
  }, [activeBook, isAnimating]);

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
            triggerSwipe('right');
          }
          break;
        case 'ArrowLeft':
          if (!isSynopsisExpanded) {
            e.preventDefault();
            triggerSwipe('left');
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
  }, [isLoading, isModalOpen, isSynopsisExpanded, triggerSwipe, handleUndo, toggleSynopsis]);

  const handleGenerateMore = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4" role="status" aria-live="polite">
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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4 text-center">
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
        className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4 text-center"
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

  const canUndo = Boolean(lastAction && currentIndex > 0 && !isAnimating);

  return (
    <div
      className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col justify-between items-center px-4 py-3 select-none"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      <div className="shrink-0 w-full max-w-[420px] flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            Baseado em:
          </span>
          {seedBooks.map((seed) => (
            <span key={seed.id} className="editorial-pill text-[0.65rem] font-mono truncate max-w-[110px]">
              {seed.title}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {batchSource === 'fallback' && (
            <span className="editorial-pill text-[0.6rem] font-mono" title="Acervo curado local">
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
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-[420px] aspect-[3/4] flex items-center justify-center my-auto">
        {visibleBooks.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            index={i}
            isActive={i === 0}
            isSynopsisExpanded={i === 0 && isSynopsisExpanded}
            onToggleSynopsis={toggleSynopsis}
            x={x}
            y={y}
            rotate={cardRotate}
            cardOpacity={cardOpacity}
            likeOpacity={likeOpacity}
            passOpacity={passOpacity}
            likeScale={likeScale}
            passScale={passScale}
            nextCardScale={nextCardScale}
            nextCardY={nextCardY}
            nextCardOpacity={nextCardOpacity}
            thirdCardScale={i === 1 ? thirdCardScale : thirdCardScaleStable}
            thirdCardY={i === 1 ? thirdCardY : thirdCardYStable}
            thirdCardOpacity={i === 1 ? thirdCardOpacity : thirdCardOpacityStable}
            dragEnd={handleDragEnd}
          />
        ))}
      </div>

      <div className="shrink-0 flex flex-col items-center gap-2 pt-2 w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-3">
          <motion.button
            type="button"
            onClick={() => triggerSwipe('left')}
            disabled={!activeBook || isAnimating}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 border focus-ring disabled:opacity-40"
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
            className="px-5 h-11 rounded-full flex items-center justify-center gap-2 transition-all duration-200 border font-mono text-xs focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
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
            onClick={() => triggerSwipe('right')}
            disabled={!activeBook || isAnimating}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus-ring disabled:opacity-40"
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
            disabled={!activeBook || isAnimating}
            className="btn-secondary flex items-center gap-2 px-4 focus-ring disabled:opacity-40"
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
