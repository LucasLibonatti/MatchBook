import type { Book, SeedBook } from '../types/book'

const STORAGE_KEYS = {
  MATCHES: 'matchbook_matches',
  SEED_BOOKS: 'matchbook_seed_books',
  SWIPED_IDS: 'matchbook_swiped_ids',
  HAS_COMPLETED_ONBOARDING: 'matchbook_has_completed_onboarding',
} as const

export function getMatches(): Book[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MATCHES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveMatches(matches: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches))
  } catch (error) {
    console.error('Erro ao salvar matches:', error)
  }
}

export function addMatch(book: Book): void {
  const matches = getMatches()
  if (!matches.some(m => m.id === book.id)) {
    matches.unshift(book)
    saveMatches(matches)
  }
}

export function removeMatch(bookId: string): void {
  const matches = getMatches().filter(m => m.id !== bookId)
  saveMatches(matches)
}

export function getSeedBooks(): SeedBook[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SEED_BOOKS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveSeedBooks(seedBooks: SeedBook[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SEED_BOOKS, JSON.stringify(seedBooks))
  } catch (error) {
    console.error('Erro ao salvar seed books:', error)
  }
}

export function getSwipedIds(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SWIPED_IDS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveSwipedIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SWIPED_IDS, JSON.stringify(ids))
  } catch (error) {
    console.error('Erro ao salvar swiped IDs:', error)
  }
}

export function addSwipedId(id: string): void {
  const ids = getSwipedIds()
  if (!ids.includes(id)) {
    ids.push(id)
    saveSwipedIds(ids)
  }
}

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING) === 'true'
  } catch {
    return false
  }
}

export function setCompletedOnboarding(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, String(value))
  } catch (error) {
    console.error('Erro ao salvar status de onboarding:', error)
  }
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}