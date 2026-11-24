import { useState, useCallback } from 'react';
import { motion, useSpring, useTransform, AnimatePresence, type MotionValue, type PanInfo } from 'framer-motion';
import { X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { BookRecommendation } from '../types/book';
import { EditorialCover } from './EditorialCover';

interface BookCardProps {
  book: BookRecommendation;
  index: number;
  isActive: boolean;
  isSynopsisExpanded: boolean;
  onToggleSynopsis: () => void;
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  cardOpacity: MotionValue<number>;
  likeOpacity: MotionValue<number>;
  passOpacity: MotionValue<number>;
  likeScale: MotionValue<number>;
  passScale: MotionValue<number>;
  nextCardScale: MotionValue<number>;
  nextCardY: MotionValue<number>;
  nextCardOpacity: MotionValue<number>;
  thirdCardScale: MotionValue<number>;
  thirdCardY: MotionValue<number>;
  thirdCardOpacity: MotionValue<number>;
  dragEnd: (offsetX: number, offsetY: number, velocityX: number) => void;
}

export function BookCard({
  book,
  index,
  isActive,
  isSynopsisExpanded,
  onToggleSynopsis,
  x,
  y,
  rotate,
  cardOpacity,
  likeOpacity,
  passOpacity,
  likeScale,
  passScale,
  nextCardScale,
  nextCardY,
  nextCardOpacity,
  thirdCardScale,
  thirdCardY,
  thirdCardOpacity,
  dragEnd,
}: BookCardProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  const imageError = !book.coverUrl || failedUrl === book.coverUrl;
  const imageLoading = Boolean(book.coverUrl && !imageError && loadedUrl !== book.coverUrl);

  const springX = useSpring(x, { stiffness: 400, damping: 30, mass: 0.7 });
  const springY = useSpring(y, { stiffness: 400, damping: 30, mass: 0.7 });
  const springRotate = useSpring(rotate, { stiffness: 400, damping: 30, mass: 0.7 });
  const springLikeOpacity = useSpring(likeOpacity, { stiffness: 350, damping: 28 });
  const springPassOpacity = useSpring(passOpacity, { stiffness: 350, damping: 28 });
  const springLikeScale = useSpring(likeScale, { stiffness: 350, damping: 28 });
  const springPassScale = useSpring(passScale, { stiffness: 350, damping: 28 });

  // Red on left (Passar), Green on right (Quero Ler) — reactive MotionValue
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
      dragEnd(info.offset.x, info.offset.y, info.velocity.x);
    },
    [dragEnd]
  );

  const handleExpandClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onToggleSynopsis();
    },
    [onToggleSynopsis]
  );

  const zIndex = isActive ? 10 : index === 1 ? 9 : 8;

  const cardStyle = {
    transformOrigin: 'center center' as const,
    x: isActive ? springX : 0,
    y: isActive ? springY : index === 1 ? nextCardY : thirdCardY,
    rotate: isActive ? springRotate : 0,
    scale: isActive ? 1 : index === 1 ? nextCardScale : thirdCardScale,
    opacity: isActive ? cardOpacity : index === 1 ? nextCardOpacity : thirdCardOpacity,
    zIndex,
    boxShadow: isActive ? boxShadowGlow : 'none',
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-full max-w-[420px] rounded-3xl overflow-hidden select-none"
      style={cardStyle}
      drag={isActive && !isSynopsisExpanded}
      dragConstraints={{ left: 0, right: 0, top: -50, bottom: 50 }}
      dragElastic={0.35}
      dragMomentum={true}
      onDragEnd={isActive ? handleDragEnd : undefined}
      aria-label={isActive ? `${book.title} por ${book.author}, ${book.matchPercentage}% match` : undefined}
      whileHover={isActive && !isSynopsisExpanded ? { scale: 1.005, transition: { duration: 0.15 } } : undefined}
    >
      <div className="absolute inset-0 bg-white dark:bg-[#141418] border border-black/5 dark:border-white/10" />

      {isActive && (
        <>
          <motion.div
            className="absolute top-4 left-4 z-20 pointer-events-none -rotate-12"
            style={{ opacity: springLikeOpacity, scale: springLikeScale }}
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
            style={{ opacity: springPassOpacity, scale: springPassScale }}
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

      <div className="relative z-10 h-full flex flex-col">
        <div
          className="relative w-full h-[220px] sm:h-[245px] flex items-center justify-center py-3 overflow-hidden"
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

          <div className="relative z-10 h-full aspect-[2/3] rounded-lg shadow-2xl overflow-hidden">
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
                onLoad={() => setLoadedUrl(book.coverUrl ?? null)}
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

        <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden min-h-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="flex items-start justify-between gap-3 mb-2.5">
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

          <h2 className="font-display italic text-xl sm:text-2xl leading-tight line-clamp-2 mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {book.title}
          </h2>

          {book.originalTitle && book.originalTitle !== book.title && (
            <p className="text-xs line-clamp-1 mb-0.5" style={{ color: 'var(--text-muted)' }}>
              <em>{book.originalTitle}</em>
            </p>
          )}

          <p className="text-sm font-medium mb-2.5" style={{ color: 'var(--text-secondary)' }}>
            {book.author}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2.5" role="list" aria-label="Categorias">
            {book.categories.slice(0, 3).map((cat, i) => (
              <span key={i} className="editorial-pill text-[0.65rem] shrink-0">
                {cat}
              </span>
            ))}
          </div>

          <div
            className="p-2.5 rounded-xl flex flex-col gap-1 mb-3"
            style={{
              backgroundColor: 'var(--accent-soft)',
              border: '1px solid var(--accent-primary)',
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Por que combina com você</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {book.matchReason}
            </p>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-xs sm:text-sm leading-relaxed line-clamp-3 flex-1" style={{ color: 'var(--text-secondary)' }}>
              {book.synopsis}
            </p>
            <button
              type="button"
              onClick={handleExpandClick}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-2 text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors self-start focus-ring"
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
              className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h3 id="synopsis-title" className="font-display italic text-base" style={{ color: 'var(--text-primary)' }}>
                Sinopse Completa
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
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              <div className="space-y-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-primary)' }}>
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
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
