import type { Book, SeedBook, RecommendationParams } from '../types/book'
import { fetchRecommendations, fetchMoreRecommendations } from '../services/googleBooks'

export function extractRecommendationParams(seedBooks: SeedBook[]): RecommendationParams {
  const categories = new Set<string>()
  const authors = new Set<string>()
  const keywords = new Set<string>()
  const excludeIds = new Set<string>()

  seedBooks.forEach(book => {
    // Collect categories
    book.categories.forEach(cat => {
      const normalized = cat.trim().toLowerCase()
      if (normalized && normalized !== 'fiction' && normalized !== 'nonfiction') {
        categories.add(cat)
      }
    })

    // Collect authors
    book.authors.forEach(author => {
      authors.add(author)
    })

    // Extract keywords from title
    const titleWords = book.title
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3 && !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'over', 'under'].includes(w))
    titleWords.slice(0, 3).forEach(w => keywords.add(w))

    // Extract keywords from description
    const descWords = book.shortDescription
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 5)
    descWords.forEach(w => keywords.add(w))

    // Exclude this book
    excludeIds.add(book.id)
  })

  return {
    categories: Array.from(categories).slice(0, 5),
    authors: Array.from(authors).slice(0, 5),
    keywords: Array.from(keywords).slice(0, 10),
    excludeIds: Array.from(excludeIds),
    language: 'pt',
  }
}

export async function buildInitialDeck(
  seedBooks: SeedBook[]
): Promise<Book[]> {
  const params = extractRecommendationParams(seedBooks)
  return fetchRecommendations(params)
}

export async function loadMoreCards(
  seedBooks: SeedBook[],
  currentDeck: Book[],
  swipedIds: string[]
): Promise<Book[]> {
  const params = extractRecommendationParams(seedBooks)
  params.excludeIds = [...params.excludeIds, ...currentDeck.map(b => b.id), ...swipedIds]
  const startIndex = currentDeck.length
  return fetchMoreRecommendations(params, startIndex)
}

export function getTopCategories(books: Book[], limit = 3): string[] {
  const categoryCount = new Map<string, number>()

  books.forEach(book => {
    book.categories.forEach(cat => {
      const count = categoryCount.get(cat) || 0
      categoryCount.set(cat, count + 1)
    })
  })

  return Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cat]) => cat)
}