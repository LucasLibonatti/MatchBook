import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sun, Moon } from 'lucide-react'
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
  const [isDark, setIsDark] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Initialize theme from localStorage
  useEffect(() => {
    setIsMounted(true)
    const savedTheme = localStorage.getItem('matchbook_theme')
    if (savedTheme) {
      const dark = savedTheme === 'dark'
      setIsDark(dark)
      document.documentElement.classList.toggle('dark', dark)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Persist theme changes
  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('matchbook_theme', isDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark, isMounted])

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

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Subtle radial gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-orange-500/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-40 sticky top-0 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">Match</span>
            <span className="text-xl font-bold text-orange-500">Book</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-5 h-5" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-5 h-5" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Library Button with Counter */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                size="sm"
                className="relative gap-2 px-4"
                onClick={openLibrary}
                aria-label={`Ver biblioteca de matches (${matchesCount})`}
              >
                <Heart className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-300">Biblioteca</span>
                {matchesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {matchesCount > 99 ? '99+' : matchesCount}
                  </span>
                )}
              </Button>
            </motion.div>
          </div>
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