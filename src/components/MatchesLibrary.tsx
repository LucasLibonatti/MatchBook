import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, ExternalLink, BookOpen, Star, Calendar, Trash2, Loader2 } from 'lucide-react'
import { getMatches, removeMatch } from '../utils/storage'
import type { Book } from '../types/book'
import { Button, Badge } from './ui'
import { BookCard } from './BookCard'

export function MatchesLibrary({ onClose }: { onClose: () => void }) {
  const [matches, setMatches] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setMatches(getMatches())
  }, [])

  // Handle ESC key to close
  useEffect(() => {
    if (!isMounted) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMounted, onClose])

  const handleRemove = useCallback((bookId: string) => {
    setRemovingId(bookId)
    removeMatch(bookId)
    setMatches(prev => prev.filter(b => b.id !== bookId))
    setRemovingId(null)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-title"
      >
        {/* Backdrop/Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">Match</span>
              <span className="text-xl font-bold text-orange-500">Book</span>
            </div>
            <h2 id="library-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex-1 text-center">
              Minha Biblioteca ({matches.length})
            </h2>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Fechar biblioteca"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </motion.button>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 overflow-y-auto p-6"
          >
            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/25"
                >
                  <Heart className="w-10 h-10 text-white" aria-hidden="true" />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Nenhum match ainda</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs">
                  Comece a deslizar para descobrir livros incríveis e salvá-los aqui!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((book, index) => (
                  <AnimatePresence key={book.id}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      <BookCard
                        book={book}
                        compact
                        showMatchBadge={true}
                        onClick={() => setSelectedBook(book)}
                      />
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(book.id)
                        }}
                        disabled={removingId === book.id}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        aria-label={`Remover ${book.title} da biblioteca`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {removingId === book.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        )}
                      </motion.button>
                    </motion.div>
                  </AnimatePresence>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Book Detail Modal */}
        <AnimatePresence>
          {selectedBook && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedBook(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="detail-title"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
                onClick={e => e.stopPropagation()}
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  {selectedBook.thumbnail ? (
                    <img
                      src={selectedBook.thumbnail}
                      alt={`Capa do livro ${selectedBook.title}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <BookOpen className="w-20 h-20 text-white/30" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge variant="default" className="shadow-lg bg-orange-500 text-white">
                      {selectedBook.matchPercentage}% Match
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-4">
                      <h3 id="detail-title" className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {selectedBook.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">{selectedBook.authors.join(', ')}</p>
                    </div>
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 flex-shrink-0"
                      aria-label="Fechar"
                    >
                      <X className="w-6 h-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {selectedBook.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        {selectedBook.year}
                      </span>
                    )}
                    {selectedBook.pageCount && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                        {selectedBook.pageCount} págs
                      </span>
                    )}
                    {selectedBook.averageRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                        {selectedBook.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedBook.categories.slice(0, 4).map((cat, i) => (
                      <Badge key={i} variant="outline" size="sm">{cat}</Badge>
                    ))}
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-5">
                    {selectedBook.description}
                  </p>

                  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {selectedBook.previewLink && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(selectedBook.previewLink, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Visualizar
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(selectedBook.infoLink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" aria-hidden="true" />
                      Mais detalhes
                    </Button>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => handleRemove(selectedBook.id)}
                    disabled={removingId === selectedBook.id}
                  >
                    {removingId === selectedBook.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                        Removendo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                        Remover da biblioteca
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}