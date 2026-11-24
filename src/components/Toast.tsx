import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { BookRecommendation } from '../types/book';

interface ToastProps {
  book: BookRecommendation;
  onClose: () => void;
}

export function Toast({ book, onClose }: ToastProps) {
  return (
    <motion.div
      layout
      className="w-full max-w-sm pointer-events-auto"
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 320 }}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-start gap-3 p-4 rounded-2xl shadow-2xl border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent-primary)',
          }}
        >
          <Check className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            Adicionado à sua biblioteca
          </p>
          <p className="font-display italic text-sm truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {book.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {book.author} · {book.matchPercentage}% MATCH
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg transition-colors focus-ring"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; book: BookRecommendation }>;
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 w-[calc(100vw-3rem)] max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(({ id, book }) => (
          <Toast key={id} book={book} onClose={() => onDismiss(id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
