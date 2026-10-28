import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { hasCompletedOnboarding, getSeedBooks, clearAllData, getMatches } from './utils/storage'
import { Onboarding } from './components/Onboarding'
import { SwipeArena } from './components/SwipeArena'
import { MatchesLibrary } from './components/MatchesLibrary'
import type { SeedBook } from './types/book'
import { Button } from './components/ui'

function App() {
  const [screen, setScreen] = useState<'onboarding' | 'arena'>('onboarding')
  const [seedBooks, setSeedBooks] = useState<SeedBook[]>([])
  const [showLibrary, setShowLibrary] = useState(false)
  const [matchesCount, setMatchesCount] = useState(0)

  useEffect(() => {
    const completed = hasCompletedOnboarding()
    const savedSeeds = getSeedBooks()

    if (completed && savedSeeds.length === 3) {
      setSeedBooks(savedSeeds)
      setScreen('arena')
    } else {
      clearAllData()
      setScreen('onboarding')
    }
    updateMatchesCount()
  }, [])

  const updateMatchesCount = () => {
    setMatchesCount(getMatches().length)
  }

  const handleOnboardingComplete = (books: SeedBook[]) => {
    setSeedBooks(books)
    setScreen('arena')
  }

  const handleRestart = () => {
    clearAllData()
    setSeedBooks([])
    setScreen('onboarding')
    updateMatchesCount()
  }

  const openLibrary = () => {
    setShowLibrary(true)
  }

  const closeLibrary = () => {
    setShowLibrary(false)
    updateMatchesCount()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100"
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-800">Match</span>
            <span className="text-xl font-bold text-orange-500">Book</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={openLibrary}
            aria-label={`Ver biblioteca de matches (${matchesCount})`}
          >
            <Heart className="w-5 h-5 text-slate-600" aria-hidden="true" />
            {matchesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {matchesCount}
              </span>
            )}
          </Button>
        </div>
      </motion.header>

      <main className="pt-16 min-h-screen pb-8">
        {screen === 'onboarding' && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {screen === 'arena' && (
          <SwipeArena seedBooks={seedBooks} onRestart={handleRestart} />
        )}
      </main>

      {showLibrary && <MatchesLibrary onClose={closeLibrary} />}
    </div>
  )
}

export default App