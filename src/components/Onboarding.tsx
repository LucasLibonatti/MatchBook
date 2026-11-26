import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles, Loader2, Book, Check, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import type { SeedBook, BookSearchResult } from '../types/book';
import { searchCuratedBooks, CURATED_BOOKS } from '../data/curatedBooks';
import { searchBooksForOnboarding } from '../services/bookCoverService';
import { EditorialCover } from './EditorialCover';
import { useMatchBook } from '../hooks/useMatchBook';

interface OnboardingProps {
  initialSeeds?: SeedBook[];
  onComplete: (seeds: SeedBook[]) => void;
}

const QUICK_SUGGESTIONS = [
  { label: 'Clássicos Brasileiros', query: 'Machado de Assis' },
  { label: 'Ficção Científica', query: 'ficção científica' },
  { label: 'Fantasia Épica', query: 'fantasia' },
  { label: 'Filosofia Estoica', query: 'filosofia' },
  { label: 'Distopias', query: 'distopia' },
  { label: 'Bestsellers', query: 'bestseller' },
];

export function Onboarding({ initialSeeds = [], onComplete }: OnboardingProps) {
  const { recentSeeds, recordRecentSeeds, removeRecentSeed } = useMatchBook();
  const [selectedBooks, setSelectedBooks] = useState<SeedBook[]>(initialSeeds);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const triggerSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();

      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults([]);
        setShowDropdown(recentSeeds.length > 0 && document.activeElement === inputRef.current);
        setIsSearching(false);
        setFocusedIndex(-1);
        return;
      }

      const curatedResults: BookSearchResult[] = searchCuratedBooks(trimmed).map((b) => ({
        ...b,
        source: 'curated',
      }));

      setSearchResults(curatedResults);
      setShowDropdown(true);
      setFocusedIndex(-1);
      setIsSearching(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      debounceRef.current = setTimeout(async () => {
        try {
          const apiResults = await searchBooksForOnboarding(trimmed, curatedResults, controller.signal);
          if (!controller.signal.aborted) {
            setSearchResults(apiResults);
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
        } finally {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        }
      }, 320);
    },
    [recentSeeds.length]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      triggerSearch(value);
    },
    [triggerSearch]
  );

  const handleInputFocus = useCallback(() => {
    if (searchResults.length > 0 || searchQuery.trim() || recentSeeds.length > 0) {
      setShowDropdown(true);
    }
  }, [searchResults.length, searchQuery, recentSeeds.length]);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => setShowDropdown(false), 180);
  }, []);

  const isHistoryMode = !searchQuery.trim() && recentSeeds.length > 0;
  const dropdownItems: BookSearchResult[] = isHistoryMode
    ? recentSeeds.map((b) => ({ ...b, source: 'curated' as const }))
    : searchResults;

  const handleSelectBook = useCallback(
    (book: BookSearchResult) => {
      const seedBook: SeedBook = {
        id: book.id,
        title: book.title,
        author: book.author,
        publishedYear: book.publishedYear,
        categories: book.categories,
        coverUrl: book.coverUrl,
        isbn: book.isbn,
      };

      const alreadySelected = selectedBooks.some((b) => b.id === seedBook.id);
      if (alreadySelected) {
        setSelectedBooks((prev) => prev.filter((b) => b.id !== seedBook.id));
      } else if (selectedBooks.length < 3) {
        setSelectedBooks((prev) => [...prev, seedBook]);
        recordRecentSeeds([seedBook]);
      }

      setSearchQuery('');
      setSearchResults([]);
      setShowDropdown(false);
      setFocusedIndex(-1);
      setIsSearching(false);
      inputRef.current?.blur();
    },
    [selectedBooks, recordRecentSeeds]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || dropdownItems.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, dropdownItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && dropdownItems[focusedIndex]) {
            handleSelectBook(dropdownItems[focusedIndex]);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          inputRef.current?.blur();
          break;
      }
    },
    [showDropdown, dropdownItems, focusedIndex, handleSelectBook]
  );

  const handleRemoveBook = useCallback((index: number) => {
    setSelectedBooks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleQuickSuggestion = useCallback(
    (query: string) => {
      setSearchQuery(query);
      triggerSearch(query);
      inputRef.current?.focus();
    },
    [triggerSearch]
  );

  const handleSurpriseMe = useCallback(() => {
    const available = CURATED_BOOKS.filter((b) => !selectedBooks.some((s) => s.id === b.id));
    const needed = 3 - selectedBooks.length;
    if (needed <= 0 || available.length === 0) return;

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, needed);
    setSelectedBooks([...selectedBooks, ...picks]);
    recordRecentSeeds(picks);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  }, [selectedBooks, recordRecentSeeds]);

  const canContinue = selectedBooks.length === 3;
  const showSuggestions = selectedBooks.length < 3 && !searchQuery.trim();
  const shouldRenderDropdown =
    showDropdown && (isHistoryMode || searchResults.length > 0 || Boolean(searchQuery.trim()));

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>
          Três livros que definem
          <br />
          <span className="italic" style={{ color: 'var(--accent-primary)' }}>
            seu gosto
          </span>
        </h1>
        <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Escolha 3 obras que você ama e a IA curará 10 recomendações sob medida para você.
        </p>
      </motion.div>

      <motion.div
        className="relative z-30 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <label htmlFor="book-search" className="sr-only">
            Buscar livro
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              id="book-search"
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Digite o título, autor ou gênero..."
              className="input-editorial with-icon pr-12"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="search-results"
              aria-expanded={shouldRenderDropdown}
            />
            {isSearching ? (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" style={{ color: 'var(--accent-primary)' }} />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                  triggerSearch('');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors focus-ring"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Limpar busca"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>

          <AnimatePresence>
            {shouldRenderDropdown && (
              <motion.div
                ref={dropdownRef}
                id="search-results"
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden max-h-96 overflow-y-auto scrollbar-thin"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  zIndex: 50,
                }}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                role="listbox"
              >
                {isHistoryMode && (
                  <div
                    className="px-4 py-2.5 border-b flex items-center gap-2 text-xs font-mono uppercase tracking-wider"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Últimos livros escolhidos</span>
                  </div>
                )}

                {dropdownItems.map((book, index) => {
                  const isSelected = selectedBooks.some((s) => s.id === book.id);
                  return (
                    <div
                      key={book.id}
                      role="option"
                      aria-selected={focusedIndex === index}
                      className={clsx(
                        'w-full flex items-center transition-colors',
                        focusedIndex === index ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-elevated)]'
                      )}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectBook(book);
                        }}
                        onClick={(e) => e.preventDefault()}
                        className="flex-1 min-w-0 px-4 py-3 text-left flex items-center gap-3 cursor-pointer"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {isHistoryMode ? (
                          <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                        ) : null}
                        <div
                          className={clsx(
                            'relative flex-shrink-0 rounded overflow-hidden flex items-center justify-center',
                            isHistoryMode ? 'w-8 h-12' : 'w-12 h-18'
                          )}
                          style={{ backgroundColor: 'var(--bg-elevated)' }}
                        >
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <Book className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{book.title}</p>
                          <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                            {book.author}
                          </p>
                          {!isHistoryMode && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {book.categories.slice(0, 2).map((cat, catIndex) => (
                                <span key={catIndex} className="editorial-pill text-[0.55rem]">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />}
                      </button>

                      {isHistoryMode && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeRecentSeed(book.id);
                          }}
                          onClick={(e) => e.preventDefault()}
                          className="mr-3 p-2 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10 focus-ring cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                          aria-label={`Remover ${book.title} do histórico`}
                          title="Remover do histórico"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {!isHistoryMode && searchResults.length === 0 && searchQuery.trim() && !isSearching && (
                  <div className="px-4 py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                    <p className="text-sm">Nenhum resultado para &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showSuggestions && (
          <motion.div className="mt-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Acervo Rápido
              </span>
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="ml-auto btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 focus-ring"
                aria-label="Surpreenda-me"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Surpreenda-me
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.label}
                  onClick={() => handleQuickSuggestion(suggestion.query)}
                  className="btn-secondary text-sm focus-ring"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        role="list"
        aria-label="Seus 3 livros favoritos"
      >
        {Array.from({ length: 3 }, (_, index) => {
          const book = selectedBooks[index];
          if (book) {
            return (
              <div
                key={book.id}
                role="listitem"
                className="rounded-2xl border-2 border-transparent flex flex-col overflow-hidden transition-all duration-200 group"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={`Capa de ${book.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <EditorialCover
                      title={book.title}
                      author={book.author}
                      category={book.categories[0]}
                      className="w-full h-full"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveBook(index)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-ring"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(4px)',
                    }}
                    aria-label={`Remover ${book.title}`}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-3 pt-2 pb-3 flex flex-col gap-1 min-h-[60px]">
                  <p className="font-display italic text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                    {book.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {book.author}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <button
              type="button"
              key={`empty-${index}`}
              onClick={() => inputRef.current?.focus()}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center aspect-[2/3] transition-all duration-200 hover:border-[var(--accent-primary)] focus-ring"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
              }}
              aria-label={`Slot ${index + 1}: vazio, clique para escolher`}
              role="listitem"
            >
              <Book className="w-8 sm:w-10 h-8 sm:h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
              <span className="font-mono text-base sm:text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>
                Slot 0{index + 1}
              </span>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Clique para escolher
              </p>
            </button>
          );
        })}
      </motion.div>

      <motion.div
        className="w-full max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {canContinue ? (
          <button
            type="button"
            onClick={() => onComplete(selectedBooks)}
            className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-base focus-ring"
          >
            <Sparkles className="w-5 h-5" />
            <span>Curar 10 Livros com IA</span>
          </button>
        ) : (
          <div
            className="w-full py-4 px-6 rounded-2xl text-center"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Selecione mais{' '}
              <span className="font-mono" style={{ color: 'var(--accent-primary)' }}>
                {3 - selectedBooks.length}
              </span>{' '}
              livro(s) para continuar
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
