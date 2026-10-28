import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { RotateCcw, Heart, X, BookOpen, ExternalLink, Loader2 } from 'lucide-react'
import { buildInitialDeck, loadMoreCards } from '../utils/recommendationEngine'
import { addMatch, addSwipedId, getSwipedIds } from '../utils/storage'
import type { Book, SeedBook } from '../types/book'
import { Button, Badge } from './ui'
import { BookCard } from './BookCard'

const SWIPE_THRESHOLD = 100
const CARD_SCALE_STEP = 0.94

interface SwipeArenaProps {
  seedBooks: SeedBook[]
  onRestart: () => void
}

export function SwipeArena({ seedBooks, onRestart }: SwipeArenaProps) {
  const [deck, setDeck] = useState<Book[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState<Book | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const swipedIdsRef = useRef<string[]>([])
  const dragStartRef = useRef(0)

  const currentBook = deck[currentIndex]
  const nextBook = deck[currentIndex + 1]
  const remainingCards = deck.length - currentIndex - 1

  // Load initial deck
  useEffect(() => {
    const initializeDeck = async () => {
      setIsLoading(true)
      const savedSwiped = getSwipedIds()
      swipedIdsRef.current = savedSwiped

      try {
        const initialDeck = await buildInitialDeck(seedBooks)
        const filteredDeck = initialDeck.filter(book => !savedSwiped.includes(book.id))
        setDeck(filteredDeck)
      } catch (error) {
        console.error('Erro ao carregar deck:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeDeck()
  }, [seedBooks])

  // Load more cards when running low
  useEffect(() => {
    if (remainingCards <= 2 && !isLoadingMore && deck.length > 0) {
      loadMoreCardsHandler()
    }
  }, [remainingCards, deck.length, isLoadingMore])

  const loadMoreCardsHandler = useCallback(async () => {
    setIsLoadingMore(true)
    try {
      const moreCards = await loadMoreCards(seedBooks, deck, swipedIdsRef.current)
      const filtered = moreCards.filter(book =>
        !swipedIdsRef.current.includes(book.id) &&
        !deck.some(d => d.id === book.id)
      )
      setDeck(prev => [...prev, ...filtered])
    } catch (error) {
      console.error('Erro ao carregar mais cartas:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [seedBooks, deck])

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!currentBook) return

    const bookId = currentBook.id
    swipedIdsRef.current = [...swipedIdsRef.current, bookId]
    addSwipedId(bookId)

    if (direction === 'right') {
      addMatch(currentBook)
      setShowMatchModal(currentBook)
    }

    // Animate out
    setDragOffset({ x: direction === 'left' ? -500 : 500, y: 0 })

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setDragOffset({ x: 0, y: 0 })
    }, 300)
  }, [currentBook])

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
    if (!isDragging || !currentBook) return

    const deltaX = dragStartRef.current

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      handleSwipe(deltaX > 0 ? 'right' : 'left')
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 })
    }
    setIsDragging(false)
  }, [isDragging, currentBook, handleSwipe])

  const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isDragging) return

    const deltaX = info.offset.x
    // Limit drag distance
    const limitedDelta = Math.max(-300, Math.min(300, deltaX))
    setDragOffset({ x: limitedDelta, y: 0 })
  }, [isDragging])

  const handleDragStart = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragStartRef.current = info.offset.x
    setIsDragging(true)
  }, [])

  const rotation = dragOffset.x / 300 * 15 // Max 15 degrees
  const opacity = 1 - Math.abs(dragOffset.x) / 500

  const likeIndicatorOpacity = dragOffset.x > 0 ? Math.min(dragOffset.x / 150, 1) : 0
  const nopeIndicatorOpacity = dragOffset.x < 0 ? Math.min(Math.abs(dragOffset.x) / 150, 1) : 0

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-600">Preparando suas recomendações...</p>
        </div>
      </div>
    )
  }

  if (deck.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center text-center px-6"
      >
        <BookOpen className="w-16 h-16 text-slate-300 mb-4" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhuma recomendação encontrada</h2>
        <p className="text-slate-500 mb-6 max-w-md">
          Não encontramos livros compatíveis com sua seleção. Tente escolher outros livros favoritos.
        </p>
        <Button variant="secondary" onClick={onRestart}>
          <RotateCcw className="w-5 h-5 mr-2" aria-hidden="true" />
          Refazer seleção
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center px-4 pb-8 relative"
    >
      {/* Progress indicator */}
      <motion.div
        className="w-full max-w-md mb-6 flex items-center justify-between"
      >
        <span className="text-sm text-slate-500">
          {deck.length > 0 ? `${Math.min(currentIndex + 1, deck.length)} de ${deck.length}` : '0 de 0'}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, deck.length) }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < currentIndex ? 'bg-green-400' :
                i === currentIndex ? 'bg-orange-500' : 'bg-slate-200'
              }`}
              style={{ width: i === currentIndex ? '24px' : '8px' }}
            />
          ))}
        </div>
      </motion.div>

      {/* Card Stack */}
      <div className="relative w-full max-w-md" role="region" aria-label="Cartas de recomendação">
        {/* Next card (behind) */}
        {nextBook && (
          <motion.div
            style={{
              transform: `scale(${CARD_SCALE_STEP}) translateY(8px)`,
              zIndex: 0,
            }}
            className="pointer-events-none"
          >
            <BookCard book={nextBook} compact showMatchBadge={true} />
          </motion.div>
        )}

        {/* Current card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBook?.id}
            drag="x"
            dragConstraints={{ left: -300, right: 300 }}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{
              transform: `translateX(${dragOffset.x}px) rotate(${rotation}deg)`,
              opacity: isDragging ? opacity : 1,
              zIndex: 10,
            }}
            className="relative"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') handleSwipe('left')
              if (e.key === 'ArrowRight') handleSwipe('right')
            }}
          >
            <BookCard book={currentBook!} showMatchBadge={true} />

            {/* Like/Nope indicators */}
            <AnimatePresence>
              {dragOffset.x > 20 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: likeIndicatorOpacity, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute top-6 left-6 transform -rotate-6"
                >
                  <div className="w-20 h-20 rounded-full border-4 border-green-400 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <Heart className="w-8 h-8 text-green-500" aria-hidden="true" />
                  </div>
                  <p className="text-green-600 font-bold text-lg mt-1">QUERO LER</p>
                </motion.div>
              )}
              {dragOffset.x < -20 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: nopeIndicatorOpacity, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute top-6 right-6 transform rotate-6"
                >
                  <div className="w-20 h-20 rounded-full border-4 border-red-400 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <X className="w-8 h-8 text-red-500" aria-hidden="true" />
                  </div>
                  <p className="text-red-600 font-bold text-lg mt-1">PASSAR</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-4 mt-6 w-full max-w-md"
      >
        <Button
          variant="secondary"
          size="xl"
          className="w-16 h-16 p-0"
          onClick={() => handleSwipe('left')}
          aria-label="Passar"
        >
          <X className="w-7 h-7 text-slate-400" aria-hidden="true" />
        </Button>

        <Button
          variant="primary"
          size="xl"
          className="w-16 h-16 p-0 shadow-soft-orange"
          onClick={() => handleSwipe('right')}
          aria-label="Quero ler"
        >
          <Heart className="w-7 h-7 text-white" aria-hidden="true" />
        </Button>
      </motion.div>

      {/* Restart button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center"
      >
        <Button variant="ghost" size="sm" onClick={onRestart}>
          <RotateCcw className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Refazer seleção de 3 livros
        </Button>
      </motion.div>

      {/* Match Modal */}
      <AnimatePresence>
        {showMatchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowMatchModal(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                {showMatchModal.thumbnail ? (
                  <img
                    src={showMatchModal.thumbnail}
                    alt={`Capa do livro ${showMatchModal.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-white/30" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge variant="default" className="shadow-lg bg-orange-500 text-white">
                    {showMatchModal.matchPercentage}% Match
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 id="match-title" className="text-xl font-bold text-slate-800">
                    {showMatchModal.title}
                  </h3>
                  <button
                    onClick={() => setShowMatchModal(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Fechar"
                  >
                    <X className="w-6 h-6" aria-hidden="true" />
                  </button>
                </div>

                <p className="text-slate-600 mb-4">{showMatchModal.authors.join(', ')}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {showMatchModal.categories.slice(0, 3).map((cat, i) => (
                    <Badge key={i} variant="outline" size="sm">{cat}</Badge>
                  ))}
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-4">
                  {showMatchModal.shortDescription}
                </p>

                <div className="flex gap-3">
                  {showMatchModal.previewLink && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(showMatchModal.previewLink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" aria-hidden="true" />
                      Visualizar
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(showMatchModal.infoLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Mais detalhes
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}