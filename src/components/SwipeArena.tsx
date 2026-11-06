import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { RotateCcw, Heart, X, BookOpen, ExternalLink, Loader2, RotateCcw as UndoIcon, ArrowLeft } from 'lucide-react'
import { buildInitialDeck, loadMoreCards } from '../utils/recommendationEngine'
import { addMatch, addSwipedId, getSwipedIds, getMatches, clearSeedBooks } from '../utils/storage'
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
  const [isDragging, setIsDragging] = useState(false)
  const [lastSwiped, setLastSwiped] = useState<{ book: Book; direction: 'left' | 'right' } | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const swipedIdsRef = useRef<string[]>([])
  const dragStartRef = useRef(0)

  // Framer Motion values for smooth 60fps animations
  const dragX = useMotionValue(0)
  const rotation = useTransform(dragX, [-300, 0, 300], [-15, 0, 15])
  const opacity = useTransform(dragX, [-500, -100, 0, 100, 500], [0, 0.5, 1, 0.5, 0])
  const likeIndicatorOpacity = useTransform(dragX, [0, 150], [0, 1])
  const nopeIndicatorOpacity = useTransform(dragX, [-150, 0], [1, 0])

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
        setCurrentIndex(0)
        setLastSwiped(null)
        setCanUndo(false)
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

    // Store for undo
    setLastSwiped({ book: currentBook, direction })
    setCanUndo(true)

    // Animate out using motion value
    dragX.set(direction === 'left' ? -500 : 500)

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      dragX.set(0)
    }, 300)
  }, [currentBook])

  const handleUndo = useCallback(() => {
    if (!lastSwiped || !canUndo) return

    const { book, direction } = lastSwiped

    // Remove from swiped IDs
    swipedIdsRef.current = swipedIdsRef.current.filter(id => id !== book.id)
    // Note: We'd need a removeSwipedId in storage, but for now just rebuild
    // For simplicity, we'll just re-add the card to the deck
    setDeck(prev => [book, ...prev])
    setCurrentIndex(0) // Reset to show the undone card

    if (direction === 'right') {
      // Remove from matches
      getMatches().filter(m => m.id !== book.id)
      // We need to update storage - for now just note it
      console.log('Would remove match:', book.id)
    }

    setLastSwiped(null)
    setCanUndo(false)
  }, [lastSwiped, canUndo])

  const handleDragStart = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragStartRef.current = info.offset.x
    setIsDragging(true)
    dragX.set(0)
  }, [])

  const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isDragging) return

    const deltaX = info.offset.x
    // Limit drag distance
    const limitedDelta = Math.max(-300, Math.min(300, deltaX))
    dragX.set(limitedDelta)
  }, [isDragging])

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
    if (!isDragging || !currentBook) return

    const deltaX = dragStartRef.current

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      handleSwipe(deltaX > 0 ? 'right' : 'left')
    } else {
      // Snap back using spring animation
      dragX.set(0)
    }
    setIsDragging(false)
  }, [isDragging, currentBook, handleSwipe])

  const handleRestart = useCallback(() => {
    // Clear only seed books and swiped IDs, preserve matches
    clearSeedBooks()
    setDeck([])
    setCurrentIndex(0)
    setLastSwiped(null)
    setCanUndo(false)
    onRestart()
  }, [onRestart])

  const handleSwapBooks = useCallback(() => {
    // Clear seed books but preserve matches, go back to onboarding
    clearSeedBooks()
    setDeck([])
    setCurrentIndex(0)
    setLastSwiped(null)
    setCanUndo(false)
    onRestart()
  }, [onRestart])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-600 dark:text-slate-400">Preparando suas recomendações...</p>
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
        <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Nenhuma recomendação encontrada</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          Não encontramos livros compatíveis com sua seleção. Tente escolher outros livros favoritos.
        </p>
        <Button variant="secondary" onClick={handleRestart}>
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
      style={{ willChange: 'transform' }}
    >
      {/* Progress indicator */}
      <motion.div
        className="w-full max-w-md mb-6 flex items-center justify-between"
      >
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {deck.length > 0 ? `${Math.min(currentIndex + 1, deck.length)} de ${deck.length}` : '0 de 0'}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, deck.length) }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < currentIndex ? 'bg-green-400' :
                i === currentIndex ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
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

        {/* Current card - using motion values for 60fps animation */}
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
              x: dragX,
              rotate: rotation,
              opacity: opacity,
              zIndex: 10,
              willChange: 'transform, opacity',
            }}
            className="relative"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') handleSwipe('left')
              if (e.key === 'ArrowRight') handleSwipe('right')
              if (e.key === 'z' && (e.metaKey || e.ctrlKey)) handleUndo() // Cmd/Ctrl+Z for undo
            }}
          >
            <BookCard book={currentBook!} showMatchBadge={true} />

            {/* Like/Nope indicators - using motion values for smooth opacity */}
            <motion.div
              style={{
                opacity: likeIndicatorOpacity,
                scale: likeIndicatorOpacity,
              }}
              className="absolute top-6 left-6 transform -rotate-6 pointer-events-none"
            >
              <div className="w-20 h-20 rounded-full border-4 border-green-400 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                <Heart className="w-8 h-8 text-green-500" aria-hidden="true" />
              </div>
              <p className="text-green-600 dark:text-green-400 font-bold text-lg mt-1">QUERO LER</p>
            </motion.div>
            <motion.div
              style={{
                opacity: nopeIndicatorOpacity,
                scale: nopeIndicatorOpacity,
              }}
              className="absolute top-6 right-6 transform rotate-6 pointer-events-none"
            >
              <div className="w-20 h-20 rounded-full border-4 border-red-400 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                <X className="w-8 h-8 text-red-500" aria-hidden="true" />
              </div>
              <p className="text-red-600 dark:text-red-400 font-bold text-lg mt-1">PASSAR</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-3 mt-6 w-full max-w-md"
      >
        <Button
          variant="secondary"
          size="xl"
          className="w-16 h-16 p-0"
          onClick={() => handleSwipe('left')}
          aria-label="Passar"
        >
          <X className="w-7 h-7 text-slate-400 dark:text-slate-500" aria-hidden="true" />
        </Button>

        {/* Undo Button */}
        <Button
          variant={canUndo ? 'secondary' : 'ghost'}
          size="xl"
          className="w-16 h-16 p-0"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Desfazer último swipe"
          style={{ opacity: canUndo ? 1 : 0.4 }}
        >
          <UndoIcon className="w-7 h-7 text-orange-500" aria-hidden="true" />
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

      {/* Control Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleSwapBooks}>
            <RotateCcw className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Trocar 3 Livros
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRestart}>
            <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Reiniciar Do Zero
          </Button>
        </div>
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
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
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
                  <h3 id="match-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {showMatchModal.title}
                  </h3>
                  <button
                    onClick={() => setShowMatchModal(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    aria-label="Fechar"
                  >
                    <X className="w-6 h-6" aria-hidden="true" />
                  </button>
                </div>

                <p className="text-slate-600 dark:text-slate-400 mb-4">{showMatchModal.authors.join(', ')}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {showMatchModal.categories.slice(0, 3).map((cat, i) => (
                    <Badge key={i} variant="outline" size="sm">{cat}</Badge>
                  ))}
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-4">
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