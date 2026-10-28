import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronRight, BookOpen, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { searchBooks } from '../services/googleBooks'
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

export function Onboarding({ onComplete }: { onComplete: (books: SeedBook[]) => void }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 400)
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [seedBooks, setSeedBooks] = useState<SeedBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load saved seed books on mount
  useEffect(() => {
    const saved = getSeedBooks()
    if (saved.length > 0) {
      setSeedBooks(saved)
    }
  }, [])

  // Search effect
  useEffect(() => {
    const trimmedQuery = debouncedQuery?.trim() ?? ''
    if (!trimmedQuery) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const controller = new AbortController()
    setIsSearching(true)

    searchBooks(trimmedQuery, 'pt', 8, 0, true)
      .then(({ books }) => {
        if (!controller.signal.aborted) {
          setSearchResults(books)
          setShowDropdown(books.length > 0)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSearchResults([])
          setShowDropdown(false)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      })

    return () => controller.abort()
  }, [debouncedQuery])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
    inputRef.current?.focus()
  }, [seedBooks])

  const removeFromSeeds = useCallback((slotIndex: number) => {
    const updated = seedBooks
      .filter((_, i) => i !== slotIndex)
      .map((book, i) => ({ ...book, slotIndex: i }))
    setSeedBooks(updated)
    saveSeedBooks(updated)
  }, [seedBooks])

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
      className="min-h-screen bg-slate-50 flex flex-col"
    >
      <main className="flex-1 px-6 py-4 max-w-3xl mx-auto w-full pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 mb-6">
            <Sparkles className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            Escolha seus <span className="text-orange-500"> 3 livros favoritos</span>
          </h1>
          <p className="text-slate-600 text-lg">
            Vamos usar eles para descobrir sua próxima leitura perfeita
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative">
            <Input
              ref={inputRef}
              type="search"
              placeholder="Busque por título, autor ou gênero..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => (debouncedQuery?.trim() ?? '') && setShowDropdown(true)}
              iconLeft={<Search className="w-5 h-5" aria-hidden="true" />}
              clearable
              className="pr-12"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-orange-500" aria-hidden="true" />
            )}
          </div>

          <AnimatePresence>
            {showDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 max-h-96 overflow-y-auto"
                role="listbox"
              >
                {searchResults.map((book, index) => (
                  <motion.button
                    key={book.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => addToSeeds(book)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                    role="option"
                  >
                    <div className="w-12 h-16 flex-shrink-0 relative">
                      {book.thumbnail ? (
                        <img
                          src={book.thumbnail}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-slate-400" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{book.title}</p>
                      <p className="text-sm text-slate-500 truncate">{book.authors.join(', ')}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" aria-hidden="true" />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-center text-slate-500 mb-4">
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
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Remover livro"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-[2/3] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-4 transition-all hover:border-orange-300 hover:bg-orange-50">
                      <BookOpen className="w-10 h-10 text-slate-300 mb-2" aria-hidden="true" />
                      <span className="text-sm text-slate-400 text-center">Slot {i + 1}</span>
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
          >
            {isLoading ? loadingMessage : 'Descobrir Próxima Leitura'}
          </Button>
        </motion.div>
      </main>
    </motion.div>
  )
}