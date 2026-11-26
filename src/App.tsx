import { useState, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MatchBookProvider } from './context/MatchBookContext';
import { useMatchBook } from './hooks/useMatchBook';
import { Header } from './components/Header';
import { Onboarding } from './components/Onboarding';
import { SwipeArena } from './components/SwipeArena';
import { MatchesLibrary } from './components/MatchesLibrary';
import type { SeedBook } from './types/book';

function MatchBookApp() {
  const { seeds, saveSeeds } = useMatchBook();
  const [view, setView] = useState<'onboarding' | 'arena'>(() =>
    seeds.length === 3 ? 'arena' : 'onboarding'
  );
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const handleOnboardingComplete = useCallback(
    (nextSeeds: SeedBook[]) => {
      saveSeeds(nextSeeds);
      setView('arena');
    },
    [saveSeeds]
  );

  // Clicking the MatchBook logo goes back to the initial screen while keeping the chosen books
  const handleGoHome = useCallback(() => {
    setView('onboarding');
  }, []);

  // Clicking "Trocar 3 Livros" clears the 3 slots so the user starts fresh
  const handleSwapBooks = useCallback(() => {
    saveSeeds([]);
    setView('onboarding');
  }, [saveSeeds]);

  const handleOpenLibrary = useCallback(() => {
    setIsLibraryOpen(true);
  }, []);

  const handleCloseLibrary = useCallback(() => {
    setIsLibraryOpen(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <Header
        showSwapBooks={view === 'arena'}
        onSwapBooks={handleSwapBooks}
        onGoHome={handleGoHome}
        onOpenLibrary={handleOpenLibrary}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'onboarding' && (
          <Onboarding
            key={seeds.length === 0 ? 'empty' : 'filled'}
            initialSeeds={seeds}
            onComplete={handleOnboardingComplete}
          />
        )}

        {view === 'arena' && (
          <SwipeArena
            seedBooks={seeds}
            onBackToOnboarding={handleSwapBooks}
            isModalOpen={isLibraryOpen}
          />
        )}
      </main>

      <MatchesLibrary
        isOpen={isLibraryOpen}
        onClose={handleCloseLibrary}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <MatchBookProvider>
        <MatchBookApp />
      </MatchBookProvider>
    </ErrorBoundary>
  );
}

export default App;
