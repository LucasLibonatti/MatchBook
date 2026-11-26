import { useState, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type PanInfo,
  type Variants,
} from 'framer-motion';
import { X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { BookRecommendation } from '../types/book';
import { EditorialCover } from './EditorialCover';

export interface SwipeTransition {
  direction: 'left' | 'right';
  mode: 'swipe' | 'undo';
}

interface BookCardProps {
  book: BookRecommendation;
  index: number;
  isActive: boolean;
  isSynopsisExpanded: boolean;
  onToggleSynopsis: () => void;
  onSwipe: (direction: 'left' | 'right') => void;
  swipeTransition: SwipeTransition;
}

const CARD_VARIANTS: Variants = {
  initialActive: (custom: SwipeTransition) =>
    custom.mode === 'undo'
      ? {
          x: custom.direction === 'right' ? 380 : -380,
          y: 20,
          scale: 1,
          opacity: 0,
        }
      : {
          x: 0,
          y: 12,
          scale: 0.96,
          opacity: 0,
        },
  initialBack: {
    x: 0,
    y: 36,
    scale: 0.84,
    opacity: 0,
  },
  active: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
  },
  next: {
    x: 0,
    y: 14,
    scale: 0.94,
    opacity: 0.72,
  },
  third: {
    x: 0,
    y: 28,
    scale: 0.88,
    opacity: 0.42,
  },
  exit: (custom: SwipeTransition) =>
    custom.mode === 'undo'
      ? {
          scale: 0.82,
          y: 40,
          opacity: 0,
          transition: { duration: 0.26 },
        }
      : {
          x: custom.direction === 'right' ? 620 : -620,
          y: 40,
          opacity: 0,
          transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
        },
};

export function BookCard({
  book,
  index,
  isActive,
  isSynopsisExpanded,
  onToggleSynopsis,
  onSwipe,
  swipeTransition,
}: BookCardProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  const imageError = !book.coverUrl || failedUrl === book.coverUrl;
  const imageLoading = Boolean(book.coverUrl && !imageError && loadedUrl !== book.coverUrl);

  // Isolated MotionValues per card instance so exiting cards never interfere with incoming cards
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [24, 120], [0, 1]);
  const passOpacity = useTransform(x, [-24, -120], [0, 1]);
  const likeScale = useTransform(x, [24, 120], [0.82, 1]);
  const passScale = useTransform(x, [-24, -120], [0.82, 1]);
  const boxShadowGlow = useTransform(
    x,
    [-220, 0, 220],
    [
      '0 0 0 2px rgba(239, 68, 68, 0.7)',
      '0 0 0 0px rgba(0, 0, 0, 0)',
      '0 0 0 2px rgba(16, 185, 129, 0.7)',
    ]
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldSwipe = Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 450;
      if (!shouldSwipe) return;

      const direction =
        info.offset.x > 0 || (info.offset.x === 0 && info.velocity.x > 0) ? 'right' : 'left';
      onSwipe(direction);
    },
    [onSwipe]
  );

  const handleExpandClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onToggleSynopsis();
    },
    [onToggleSynopsis]
  );

  const zIndex = isActive ? 30 : index === 1 ? 20 : 10;
  const animateVariant = isActive ? 'active' : index === 1 ? 'next' : 'third';

  return (
    <motion.div
      className={`absolute inset-0 w-full h-full max-w-[420px] lg:max-w-[820px] mx-auto rounded-3xl overflow-hidden select-none shadow-2xl ${
        isActive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
      variants={CARD_VARIANTS}
      custom={swipeTransition}
      initial={index === 0 ? 'initialActive' : 'initialBack'}
      animate={animateVariant}
      exit="exit"
      transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }}
      style={{
        transformOrigin: 'center center',
        x,
        y,
        rotate,
        zIndex,
        boxShadow: isActive ? boxShadowGlow : 'none',
      }}
      drag={isActive && !isSynopsisExpanded}
      dragSnapToOrigin
      dragElastic={0.85}
      onDragEnd={isActive ? handleDragEnd : undefined}
      aria-label={isActive ? `${book.title} por ${book.author}, ${book.matchPercentage}% match` : undefined}
    >
      <div className="absolute inset-0 bg-white dark:bg-[#141418] border border-black/5 dark:border-white/10" />

      {isActive && (
        <>
          <motion.div
            className="absolute top-4 left-4 z-20 pointer-events-none -rotate-12"
            style={{ opacity: likeOpacity, scale: likeScale }}
          >
            <div
              className="px-4 py-2 rounded-xl font-mono font-bold text-xs tracking-wider border-4 text-white backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.95)',
                borderColor: 'rgba(16, 185, 129, 1)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
              }}
            >
              QUERO LER
            </div>
          </motion.div>

          <motion.div
            className="absolute top-4 right-4 z-20 pointer-events-none rotate-12"
            style={{ opacity: passOpacity, scale: passScale }}
          >
            <div
              className="px-4 py-2 rounded-xl font-mono font-bold text-xs tracking-wider border-4 text-white backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.95)',
                borderColor: 'rgba(239, 68, 68, 1)',
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)',
              }}
            >
              PASSAR
            </div>
          </motion.div>
        </>
      )}

      {/* Responsive Editorial Layout: vertical stack on mobile, split 2-column showcase on desktop */}
      <div className="relative z-10 h-full flex flex-col lg:flex-row">
        <div
          className="relative w-full h-[175px] sm:h-[200px] lg:w-[300px] lg:h-full shrink-0 flex items-center justify-center p-3 lg:p-6 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          {!imageError && book.coverUrl && (
            <div
              className="absolute inset-0 w-full h-full blur-2xl opacity-30 scale-110 pointer-events-none"
              style={{
                backgroundImage: `url(${book.coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}

          <div className="relative z-10 h-full lg:h-auto lg:w-full max-h-full aspect-[2/3] rounded-xl shadow-2xl overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div
                  className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin"
                  style={{ color: 'var(--accent-primary)' }}
                />
              </div>
            )}

            {!imageError && book.coverUrl && (
              <img
                key={book.coverUrl}
                src={book.coverUrl}
                alt={`Capa de ${book.title}`}
                className="w-full h-full object-contain transition-opacity duration-300"
                style={{ opacity: imageLoading ? 0 : 1 }}
                onLoad={(e) => {
                  if (e.currentTarget.naturalWidth < 100 || e.currentTarget.naturalHeight < 120) {
                    setFailedUrl(book.coverUrl ?? null);
                    return;
                  }
                  setLoadedUrl(book.coverUrl ?? null);
                }}
                onError={() => setFailedUrl(book.coverUrl ?? null)}
              />
            )}

            {imageError && (
              <EditorialCover
                title={book.title}
                author={book.author}
                category={book.categories[0]}
                className="w-full h-full"
              />
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 overflow-hidden min-h-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="flex items-start justify-between gap-3 mb-2 lg:mb-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--accent-soft)',
                border: '1px solid var(--accent-primary)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-mono text-xs sm:text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {book.matchPercentage}% MATCH
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0" style={{ color: 'var(--text-muted)' }}>
              {book.publishedYear && (
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                  {book.publishedYear}
                </span>
              )}
              {book.pageCount && (
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                  {book.pageCount} págs
                </span>
              )}
            </div>
          </div>

          <h2 className="font-display italic text-xl sm:text-2xl lg:text-3xl leading-tight line-clamp-2 mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {book.title}
          </h2>

          {book.originalTitle && book.originalTitle !== book.title && (
            <p className="text-xs lg:text-sm line-clamp-1 mb-0.5" style={{ color: 'var(--text-muted)' }}>
              <em>{book.originalTitle}</em>
            </p>
          )}

          <p className="text-sm lg:text-base font-medium mb-2 lg:mb-3" style={{ color: 'var(--text-secondary)' }}>
            {book.author}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2 lg:mb-3" role="list" aria-label="Categorias">
            {book.categories.slice(0, 3).map((cat, i) => (
              <span key={i} className="editorial-pill text-[0.65rem] lg:text-xs shrink-0">
                {cat}
              </span>
            ))}
          </div>

          <div
            className="p-2.5 lg:p-3.5 rounded-xl flex flex-col gap-1 mb-2.5 lg:mb-3"
            style={{
              backgroundColor: 'var(--accent-soft)',
              border: '1px solid var(--accent-primary)',
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Por que combina com você</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed line-clamp-2 lg:line-clamp-3" style={{ color: 'var(--text-primary)' }}>
              {book.matchReason}
            </p>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-xs sm:text-sm leading-relaxed line-clamp-3 lg:line-clamp-5" style={{ color: 'var(--text-secondary)' }}>
              {book.synopsis}
            </p>
            <button
              type="button"
              onClick={handleExpandClick}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-auto pt-2 text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors self-start shrink-0 focus-ring"
              style={{ color: 'var(--accent-primary)' }}
              aria-label={`Expandir sinopse de ${book.title}`}
            >
              <span>{isSynopsisExpanded ? 'Recolher sinopse' : 'Ler sinopse completa'}</span>
              {isSynopsisExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSynopsisExpanded && isActive && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-3xl"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="synopsis-title"
          >
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b sticky top-0 z-10"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h3 id="synopsis-title" className="font-display italic text-lg" style={{ color: 'var(--text-primary)' }}>
                Sinopse Completa — {book.title}
              </h3>
              <button
                type="button"
                onClick={handleExpandClick}
                className="btn-ghost p-2 rounded-xl focus-ring"
                aria-label="Fechar sinopse"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5 sm:p-6">
              <div className="space-y-4 max-w-2xl">
                <div className="p-3.5 rounded-xl" style={{ backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-primary)' }}>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--accent-primary)' }}>
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>Por que combina com você</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {book.matchReason}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    Sinopse
                  </h4>
                  <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {book.synopsis}
                  </p>
                </div>
                <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    Detalhes da Obra
                  </h4>
                  <dl className="space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex gap-2">
                      <dt className="font-mono text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>
                        Autor
                      </dt>
                      <dd>{book.author}</dd>
                    </div>
                    {book.publishedYear && (
                      <div className="flex gap-2">
                        <dt className="font-mono text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>
                          Ano
                        </dt>
                        <dd>{book.publishedYear}</dd>
                      </div>
                    )}
                    {book.pageCount && (
                      <div className="flex gap-2">
                        <dt className="font-mono text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>
                          Páginas
                        </dt>
                        <dd>{book.pageCount}</dd>
                      </div>
                    )}
                    {book.categories.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="font-mono text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>
                          Gêneros
                        </dt>
                        <dd className="flex flex-wrap gap-1">
                          {book.categories.map((cat, i) => (
                            <span key={i} className="editorial-pill text-[0.65rem]">
                              {cat}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {book.isbn && (
                      <div className="flex gap-2">
                        <dt className="font-mono text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>
                          ISBN
                        </dt>
                        <dd className="font-mono text-xs">{book.isbn}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
