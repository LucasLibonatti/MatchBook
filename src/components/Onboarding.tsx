import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronRight, BookOpen, Sparkles, Loader2, Trash2, Star, Zap } from 'lucide-react'
import { searchBooks, FALLBACK_BOOKS } from '../services/googleBooks'
import { saveSeedBooks, getSeedBooks, setCompletedOnboarding } from '../utils/storage'
import { useDebounce } from '../hooks'
import type { Book, SeedBook } from '../types/book'
import { Button, Input } from './ui'
import { BookCard } from './BookCard'

const LOADING_MESSAGES = [
  'Mapeando gêneros literários...',
  'Filtrando obras sem spoilers...',
  'Calculando compatibilidade...',
  'Preparando seu deck personalizado...',
  'Quase lá...',
]

// Popular book suggestions for quick picks - with real cover URLs
const POPULAR_SUGGESTIONS = [
  { title: '1984', author: 'George Orwell', isbn: '9788535914849' },
  { title: 'Dom Casmurro', author: 'Machado de Assis', isbn: '9788508022351' },
  { title: 'O Hobbit', author: 'J.R.R. Tolkien', isbn: '9788595084742' },
  { title: 'Hábitos Atômicos', author: 'James Clear', isbn: '9788550804612' },
  { title: 'Duna', author: 'Frank Herbert', isbn: '9788576573101' },
  { title: 'O Pequeno Príncipe', author: 'Antoine de Saint-Exupéry', isbn: '9788522031981' },
]

function getCoverUrl(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
}

export function Onboarding({ onComplete }: { onComplete: (books: SeedBook[]) => void }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500) // Increased to 500ms
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [seedBooks, setSeedBooks] = useState<SeedBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load saved seed books on mount
  useEffect(() => {
    const saved = getSeedBooks()
    if (saved.length > 0) {
      setSeedBooks(saved)
    }
  }, [])

  // Search effect - single request with AbortController
  useEffect(() => {
    const trimmedQuery = debouncedQuery?.trim() ?? ''

    // Require minimum 3 characters for search
    if (!trimmedQuery || trimmedQuery.length < 3) {
      setSearchResults([])
      setShowDropdown(false)
      setIsSearching(false)
      setShowSuggestions(trimmedQuery.length === 0)
      return
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setIsSearching(true)
    setShowSuggestions(false)

    // Single request - no language restriction for autocomplete (broader results)
    searchBooks(trimmedQuery, 'pt', 8, 0, true, controller.signal)
      .then(({ books }) => {
        if (!controller.signal.aborted) {
          setSearchResults(books)
          setShowDropdown(books.length > 0)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error('[Onboarding] Search failed:', error)
          setSearchResults([])
          setShowDropdown(false)
        }
        // Ignore AbortError
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [debouncedQuery])

  // Click outside to close dropdown/suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const addToSeeds = useCallback((book: Book) => {
    if (seedBooks.length >= 3) return
    if (seedBooks.some(s => s.id === book.id)) return

    const newSeed: SeedBook = {
      ...book,
      slotIndex: seedBooks.length,
    }

    const updated = [...seedBooks, newSeed]
    setSeedBooks(updated)
    saveSeedBooks(updated)
    setQuery('')
    setSearchResults([])
    setShowDropdown(false)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [seedBooks])

  const removeFromSeeds = useCallback((slotIndex: number) => {
    const updated = seedBooks
      .filter((_, i) => i !== slotIndex)
      .map((book, i) => ({ ...book, slotIndex: i }))
    setSeedBooks(updated)
    saveSeedBooks(updated)
  }, [seedBooks])

  const handleSuggestionClick = useCallback(async (suggestion: { title: string; author: string; isbn: string }) => {
    setIsSearching(true)
    const searchQuery = `${suggestion.title} ${suggestion.author}`
    setQuery(searchQuery)

    try {
      // Use AbortController for suggestion search too
      const controller = new AbortController()
      const { books } = await searchBooks(searchQuery, 'pt', 5, 0, true, controller.signal)
      if (books.length > 0) {
        // Find the best match
        const exactMatch = books.find(b =>
          b.title.toLowerCase().includes(suggestion.title.toLowerCase()) &&
          b.authors.some(a => a.toLowerCase().includes(suggestion.author.toLowerCase()))
        )
        addToSeeds(exactMatch || books[0])
      }
    } catch (error) {
      console.error('[Onboarding] Suggestion search failed:', error)
      // Try to add fallback with cover
      const fallbackBook = FALLBACK_BOOKS.find((b: Book) =>
        b.title.toLowerCase().includes(suggestion.title.toLowerCase())
      )
      if (fallbackBook) {
        addToSeeds(fallbackBook)
      }
    } finally {
      setIsSearching(false)
    }
  }, [addToSeeds])

  const handleStart = useCallback(async () => {
    if (seedBooks.length !== 3) return

    setIsLoading(true)
    let messageIndex = 0

    const messageInterval = setInterval(() => {
      if (messageIndex < LOADING_MESSAGES.length - 1) {
        messageIndex++
        setLoadingMessage(LOADING_MESSAGES[messageIndex])
      }
    }, 800)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      clearInterval(messageInterval)
      setCompletedOnboarding(true)
      onComplete(seedBooks)
    } catch {
      clearInterval(messageInterval)
      setIsLoading(false)
    }
  }, [seedBooks, onComplete])

  const isComplete = seedBooks.length === 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col"
    >
      <main className="flex-1 px-6 py-4 max-w-3xl mx-auto w-full pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 mb-6 shadow-lg shadow-orange-500/25">
            <Sparkles className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">
            Escolha seus <span className="text-orange-500"> 3 livros favoritos</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Vamos usar eles para descobrir sua próxima leitura perfeita
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative" ref={suggestionsRef}>
            <div className="relative">
              <Input
                ref={inputRef}
                type="search"
                placeholder="Busque por título, autor ou gênero (mín. 3 letras)..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => {
                  const trimmed = debouncedQuery?.trim() ?? ''
                  if (trimmed.length >= 3) {
                    setShowDropdown(true)
                  } else if (trimmed.length === 0) {
                    setShowSuggestions(true)
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow clicks on suggestions/dropdown
                  setTimeout(() => {
                    setShowDropdown(false)
                    setShowSuggestions(false)
                  }, 200)
                }}
                iconLeft={<Search className="w-5 h-5" aria-hidden="true" />}
                clearable
                className="pr-12"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-orange-500" aria-hidden="true" />
              )}
            </div>

            {/* Quick Picks Suggestions - with real covers */}
            <AnimatePresence>
              {showSuggestions && query.trim() === '' && seedBooks.length < 3 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50"
                  role="listbox"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" aria-hidden="true" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sugestões populares:</span>
                  </div>
                  <div className="p-2 gap-2" style={{ maxHeight: '280px' }}>
                    {POPULAR_SUGGESTIONS.map((suggestion, index) => (
                      <motion.button
                        key={suggestion.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors text-left group"
                        role="option"
                      >
                        <div className="w-8 h-10 flex-shrink-0 relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={getCoverUrl(suggestion.isbn)}
                            alt=""
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{suggestion.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{suggestion.author}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" aria-hidden="true" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showDropdown && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 max-h-96 overflow-y-auto"
                  role="listbox"
                >
                  {searchResults.map((book, index) => (
                    <motion.button
                      key={book.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => addToSeeds(book)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                      role="option"
                    >
                      <div className="w-12 h-16 flex-shrink-0 relative">
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-200 dark:from-slate-700 to-slate-300 dark:to-slate-800 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{book.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{book.authors.join(', ')}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" aria-hidden="true" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-center text-slate-500 dark:text-slate-400 mb-4">
            {seedBooks.length}/3 livros selecionados
          </p>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => {
              const book = seedBooks[i]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  {book ? (
                    <div className="relative group">
                      <BookCard book={book} compact showMatchBadge={false} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromSeeds(i)
                        }}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={`Remover ${book.title}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-[2/3] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-4 transition-all hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer group"
                      onClick={() => inputRef.current?.focus()}
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-7 h-7 text-orange-400" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">Livro {i + 1}</span>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Clique ou busque acima</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            size="xl"
            fullWidth
            onClick={handleStart}
            disabled={!isComplete || isLoading}
            loading={isLoading}
            className={!isComplete && !isLoading
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 shadow-none relative overflow-hidden shimmer'
              : ''
            }
          >
            {isLoading ? loadingMessage : isComplete ? (
              <>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Descobrir Próxima Leitura
                  <Star className="w-5 h-5 animate-pulse" aria-hidden="true" />
                </span>
              </>
            ) : (
              <>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Selecione mais {3 - seedBooks.length} livro{3 - seedBooks.length > 1 ? 's' : ''} para continuar
                </span>
              </>
            )}
          </Button>

          {/* Progress indicator when incomplete */}
          {!isComplete && !isLoading && (
            <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(seedBooks.length / 3) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
              />
            </div>
          )}
        </motion.div>
      </main>
    </motion.div>
  )
}