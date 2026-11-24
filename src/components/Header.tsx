import { motion } from 'framer-motion';
import { Sun, Moon, BookMarked, Heart, RotateCcw, Book } from 'lucide-react';
import { useMatchBook } from '../hooks/useMatchBook';

interface HeaderProps {
  showSwapBooks?: boolean;
  onSwapBooks?: () => void;
  onOpenLibrary?: () => void;
}

export function Header({
  showSwapBooks = false,
  onSwapBooks,
  onOpenLibrary,
}: HeaderProps) {
  const { theme, toggleTheme, matches } = useMatchBook();
  const isDark = theme === 'dark';
  const matchCount = matches.length;

  return (
    <motion.header
      className="sticky top-0 z-40 backdrop-blur-md border-b"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5" aria-label="MatchBook">
          <Book className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
          <span className="font-display italic text-xl sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
            Match<span style={{ color: 'var(--accent-primary)' }}>Book</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showSwapBooks && onSwapBooks && (
            <motion.button
              onClick={onSwapBooks}
              className="btn-secondary hidden sm:flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Trocar 3 livros base"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="font-mono text-xs">Trocar 3 Livros</span>
            </motion.button>
          )}

          <motion.button
            onClick={toggleTheme}
            className="btn-ghost p-2 rounded-xl focus-ring"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          >
            {isDark ? (
              <Sun className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            ) : (
              <Moon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            )}
          </motion.button>

          {onOpenLibrary && (
            <motion.button
              onClick={onOpenLibrary}
              className="btn-secondary flex items-center gap-2 relative focus-ring"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label={`Minha Biblioteca (${matchCount} livros salvos)`}
            >
              <BookMarked className="w-4 h-4" />
              <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              {matchCount > 0 && (
                <motion.span
                  key={matchCount}
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                  }}
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 250 }}
                >
                  {matchCount > 99 ? '99+' : matchCount}
                </motion.span>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
