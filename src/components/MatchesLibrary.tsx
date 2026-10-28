import { useState, useEffect } from 'react'
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

  useEffect(() => {
    setMatches(getMatches())
  }, [])

  const handleRemove = (bookId: string) => {
    setRemovingId(bookId)
    removeMatch(bookId)
    setMatches(prev => prev.filter(b => b.id !== bookId))
    setRemovingId(null)
  }

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onClose}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
        aria-label="Fechar biblioteca"
      >
        <X className="w-6 h-6" aria-hidden="true" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed inset-0 z-40 bg-white flex flex-col max-w-2xl mx-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-800">Match</span>
            <span className="text-xl font-bold text-orange-500">Book</span>
          </div>
          <h2 id="library-title" className="text-lg font-semibold text-slate-800">
            Minha Biblioteca ({matches.length})
          </h2>
          <div className="w-10" />
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
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-6"
              >
                <Heart className="w-10 h-10 text-white" aria-hidden="true" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum match ainda</h3>
              <p className="text-slate-500 max-w-xs">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(book.id)
                      }}
                      disabled={removingId === book.id}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      aria-label="Remover da biblioteca"
                    >
                      {removingId === book.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
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
              className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden"
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
                    <h3 id="detail-title" className="text-xl font-bold text-slate-800 mb-1">
                      {selectedBook.title}
                    </h3>
                    <p className="text-slate-600">{selectedBook.authors.join(', ')}</p>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0"
                    aria-label="Fechar"
                  >
                    <X className="w-6 h-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
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

                <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-5">
                  {selectedBook.description}
                </p>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
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
    </>
  )
}