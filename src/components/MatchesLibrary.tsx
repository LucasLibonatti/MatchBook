import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, BookOpen, Search, ChevronDown, ExternalLink, Trash2 } from 'lucide-react';
import type { MatchBook } from '../types/book';
import { EditorialCover } from './EditorialCover';
import { useMatchBook } from '../hooks/useMatchBook';

interface MatchesLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

const SORT_OPTIONS = [
  { value: 'match', label: 'Maior % Match' },
  { value: 'recent', label: 'Mais Recentes' },
] as const;

export function MatchesLibrary({ isOpen, onClose }: MatchesLibraryProps) {
  const { matches, deleteMatch } = useMatchBook();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'recent'>('match');
  const [selectedBook, setSelectedBook] = useState<MatchBook | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Global Escape & basic focus trap when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedBook) {
          setSelectedBook(null);
        } else {
          onClose();
        }
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, selectedBook, onClose]);

  const filteredMatches = useMemo(() => {
    let result = [...matches];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.categories.some((c) => c.toLowerCase().includes(query))
      );
    }

    if (sortBy === 'match') {
      result.sort((a, b) => b.matchPercentage - a.matchPercentage);
    } else {
      result.sort((a, b) => b.matchedAt - a.matchedAt);
    }

    return result;
  }, [matches, searchQuery, sortBy]);

  const handleRemove = useCallback(
    (bookId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteMatch(bookId);
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
      }
    },
    [deleteMatch, selectedBook]
  );

  const handleOpenAmazon = useCallback((book: MatchBook) => {
    const query = encodeURIComponent(`${book.title} ${book.author}`);
    window.open(`https://www.amazon.com.br/s?k=${query}`, '_blank', 'noopener,noreferrer');
  }, []);

  const handleOpenGoogleBooks = useCallback((book: MatchBook) => {
    const query = encodeURIComponent(`${book.title} ${book.author}`);
    window.open(`https://www.google.com/search?tbm=bks&q=${query}`, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-title"
          >
            <motion.div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              className="relative w-full max-w-4xl max-h-[86vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <h2 id="library-title" className="font-display italic text-xl sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
                    Minha Biblioteca
                  </h2>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--accent-primary)',
                    }}
                  >
                    {matches.length}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="btn-ghost p-2 rounded-xl flex items-center justify-center focus-ring"
                  aria-label="Fechar (Esc)"
                  style={{ width: 44, height: 44 }}
                >
                  <X className="w-5 h-5" />
                  <span className="sr-only">Fechar</span>
                </button>
              </header>

              <div className="px-6 py-4 border-b flex flex-col sm:flex-row gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por título, autor ou gênero..."
                    className="input-editorial with-icon pr-4"
                    aria-label="Buscar na biblioteca"
                  />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'match' | 'recent')}
                    className="input-editorial pr-10 appearance-none cursor-pointer"
                    aria-label="Ordenar por"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {filteredMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent-soft)' }}>
                      <Heart className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <h3 className="font-display italic text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                      {searchQuery ? 'Nenhum livro encontrado' : 'Sua biblioteca está vazia'}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {searchQuery
                        ? 'Tente outro termo de busca'
                        : 'Dê match em livros na arena para salvá-los aqui'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto scrollbar-thin max-h-[60vh]">
                    {filteredMatches.map((book, index) => (
                      <motion.button
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className="group relative flex flex-col h-full p-3 rounded-2xl transition-all duration-200 text-left focus-ring"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                        }}
                        whileHover={{ y: -2, boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.15)' }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.025, duration: 0.2 }}
                        aria-label={`Ver detalhes de ${book.title}`}
                      >
                        <div className="relative aspect-[2/3] w-full mx-auto max-w-xs mb-3 overflow-hidden rounded-xl">
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={`Capa de ${book.title}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <EditorialCover
                              title={book.title}
                              author={book.author}
                              category={book.categories[0]}
                              className="w-full h-full"
                            />
                          )}
                          <div className="absolute top-2 left-2 z-10">
                            <span className="editorial-badge flex items-center gap-1">
                              <span className="font-mono">{book.matchPercentage}%</span>
                              <span>MATCH</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                          <h4 className="font-display italic text-base leading-tight mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                            {book.title}
                          </h4>
                          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                            {book.author}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-auto">
                            {book.categories.slice(0, 2).map((cat, i) => (
                              <span key={i} className="editorial-pill text-[0.6rem]">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBook && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBook(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <motion.div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)' }}
            />

            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <h3 id="detail-title" className="font-display italic text-lg" style={{ color: 'var(--text-primary)' }}>
                  Detalhes do Livro
                </h3>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="btn-ghost p-2 rounded-xl focus-ring"
                  aria-label="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0 w-full sm:w-48 mx-auto sm:mx-0">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden relative">
                      {selectedBook.coverUrl ? (
                        <img
                          src={selectedBook.coverUrl}
                          alt={`Capa de ${selectedBook.title}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <EditorialCover
                          title={selectedBook.title}
                          author={selectedBook.author}
                          category={selectedBook.categories[0]}
                          className="w-full h-full"
                        />
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="editorial-badge flex items-center gap-1">
                          <span className="font-mono">{selectedBook.matchPercentage}%</span>
                          <span>MATCH</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h4 className="font-display italic text-xl sm:text-2xl leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                      {selectedBook.title}
                    </h4>

                    {selectedBook.originalTitle && selectedBook.originalTitle !== selectedBook.title && (
                      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                        <em>{selectedBook.originalTitle}</em>
                      </p>
                    )}

                    <p className="text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {selectedBook.author}
                      {selectedBook.publishedYear && (
                        <span className="font-mono text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                          • {selectedBook.publishedYear}
                        </span>
                      )}
                      {selectedBook.pageCount && (
                        <span className="font-mono text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                          • {selectedBook.pageCount} págs
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {selectedBook.categories.map((cat, i) => (
                        <span key={i} className="editorial-pill text-sm">
                          {cat}
                        </span>
                      ))}
                    </div>

                    <div
                      className="mb-6 p-4 rounded-2xl flex flex-col gap-2"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        border: '1px solid var(--accent-primary)',
                      }}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                        <Heart className="w-4 h-4 flex-shrink-0" />
                        <span>Por que deu match</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {selectedBook.matchReason}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h5 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                        Sinopse
                      </h5>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {selectedBook.synopsis}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <button
                        onClick={() => handleOpenAmazon(selectedBook)}
                        className="btn-secondary flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Amazon</span>
                      </button>
                      <button
                        onClick={() => handleOpenGoogleBooks(selectedBook)}
                        className="btn-secondary flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Google Books</span>
                      </button>
                      <button
                        onClick={(e) => handleRemove(selectedBook.id, e)}
                        className="btn-ghost flex items-center gap-2 text-red-500 hover:text-red-400 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Remover</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
