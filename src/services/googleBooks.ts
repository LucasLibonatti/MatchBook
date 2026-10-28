import type { Book, GoogleBookItem, GoogleBooksResponse, SearchResult, RecommendationParams } from '../types/book'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'
const DEFAULT_LANGUAGE = 'pt'
const MAX_RESULTS = 40

// Fallback books for when API fails
const FALLBACK_BOOKS: Book[] = [
  {
    id: 'fallback-1',
    title: 'Dom Casmurro',
    authors: ['Machado de Assis'],
    publisher: 'Editora Ática',
    publishedDate: '1899',
    year: 1899,
    description: 'Clássico da literatura brasileira sobre ciúme e traição, narrado por Bentinho.',
    shortDescription: 'Clássico da literatura brasileira sobre ciúme e traição, narrado por Bentinho.',
    pageCount: 256,
    categories: ['Romance', 'Literatura Brasileira', 'Clássicos'],
    averageRating: 4.5,
    ratingsCount: 15000,
    thumbnail: '',
    previewLink: '',
    infoLink: 'https://books.google.com/books?id=dom-casmurro',
    language: 'pt',
  },
  {
    id: 'fallback-2',
    title: 'O Alquimista',
    authors: ['Paulo Coelho'],
    publisher: 'HarperCollins',
    publishedDate: '1988',
    year: 1988,
    description: 'Uma jornada de autodescoberta seguindo um pastor andaluz em busca de seu tesouro.',
    shortDescription: 'Uma jornada de autodescoberta seguindo um pastor andaluz em busca de seu tesouro.',
    pageCount: 208,
    categories: ['Ficção', 'Autoajuda', 'Filosofia'],
    averageRating: 4.3,
    ratingsCount: 25000,
    thumbnail: '',
    previewLink: '',
    infoLink: 'https://books.google.com/books?id=o-alquimista',
    language: 'pt',
  },
  {
    id: 'fallback-3',
    title: 'Cem Anos de Solidão',
    authors: ['Gabriel García Márquez'],
    publisher: 'Record',
    publishedDate: '1967',
    year: 1967,
    description: 'A saga da família Buendía em Macondo, misturando realismo mágico e história latino-americana.',
    shortDescription: 'A saga da família Buendía em Macondo, misturando realismo mágico e história.',
    pageCount: 417,
    categories: ['Realismo Mágico', 'Literatura Latino-Americana', 'Clássicos'],
    averageRating: 4.6,
    ratingsCount: 30000,
    thumbnail: '',
    previewLink: '',
    infoLink: 'https://books.google.com/books?id=cem-anos-solidao',
    language: 'pt',
  },
]

function sanitizeDescription(description: string, maxLength = 320): string {
  if (!description) return ''

  const clean = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length <= maxLength) return clean

  const truncated = clean.slice(0, maxLength)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  )

  if (lastSentenceEnd > maxLength * 0.6) {
    return truncated.slice(0, lastSentenceEnd + 1)
  }

  return truncated + '...'
}

function fixImageUrl(url: string): string {
  if (!url) return ''

  let fixed = url.replace(/^http:/, 'https:')
  fixed = fixed.replace(/[?&]edge=curl/, '')

  if (fixed.includes('zoom=')) {
    fixed = fixed.replace(/zoom=\d+/, 'zoom=1')
  }

  return fixed
}

function extractYear(dateString?: string): number {
  if (!dateString) return new Date().getFullYear()
  const match = dateString.match(/(\d{4})/)
  return match ? parseInt(match[1], 10) : new Date().getFullYear()
}

function mapGoogleBookToBook(item: GoogleBookItem): Book {
  const info = item.volumeInfo
  const thumbnail: string = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || ''

  const hasDescription = info.description && info.description.length > 20
  const hasThumbnail = !!thumbnail

  return {
    id: item.id,
    title: info.title || 'Título Desconhecido',
    authors: info.authors || ['Autor Desconhecido'],
    publisher: info.publisher || 'Editora Desconhecida',
    publishedDate: info.publishedDate || '',
    year: extractYear(info.publishedDate),
    description: info.description || 'Sem descrição disponível.',
    shortDescription: hasDescription ? sanitizeDescription(info.description || '') : 'Sinopse não disponível para este livro.',
    pageCount: info.pageCount || 0,
    categories: info.categories || ['Literatura'],
    averageRating: info.averageRating || 0,
    ratingsCount: info.ratingsCount || 0,
    thumbnail: hasThumbnail ? fixImageUrl(thumbnail) : '',
    previewLink: info.previewLink || '',
    infoLink: info.infoLink || `https://books.google.com/books?id=${item.id}`,
    language: info.language || DEFAULT_LANGUAGE,
  }
}

// Strict filter for recommendations (requires image AND description)
function filterQualityBooks(items: GoogleBookItem[]): GoogleBookItem[] {
  return items.filter(item => {
    const info = item.volumeInfo
    return !!(
      info.title &&
      info.imageLinks?.thumbnail &&
      info.description &&
      info.description.length > 50 &&
      info.authors?.length
    )
  })
}

// Loose filter for autocomplete - only requires title and author
function filterAutocompleteBooks(items: GoogleBookItem[]): GoogleBookItem[] {
  return items.filter(item => {
    const info = item.volumeInfo
    return !!(
      info.title &&
      info.authors?.length
    )
  })
}

export async function searchBooks(
  query: string,
  language: 'pt' | 'en' = DEFAULT_LANGUAGE,
  maxResults = 10,
  startIndex = 0,
  forAutocomplete = false
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    langRestrict: language,
    maxResults: String(maxResults),
    startIndex: String(startIndex),
    orderBy: 'relevance',
    printType: 'books',
    projection: 'full',
  })

  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}?${params}`)
    if (!response.ok) throw new Error(`Erro na busca: ${response.status}`)

    const data: GoogleBooksResponse = await response.json()
    const items = data.items || []

    if (items.length === 0) {
      return { books: [], totalItems: 0 }
    }

    // Use loose filter for autocomplete, strict for recommendations
    const qualityItems = forAutocomplete ? filterAutocompleteBooks(items) : filterQualityBooks(items)
    const books = qualityItems.map(mapGoogleBookToBook)

    // If no results after filtering, return fallback for autocomplete
    if (books.length === 0 && forAutocomplete) {
      return { books: FALLBACK_BOOKS.slice(0, maxResults), totalItems: FALLBACK_BOOKS.length }
    }

    return {
      books,
      totalItems: data.totalItems || 0,
    }
  } catch (error) {
    console.error('Erro ao buscar livros:', error)
    // Return fallback books for autocomplete so UI never breaks
    if (forAutocomplete) {
      return { books: FALLBACK_BOOKS.slice(0, maxResults), totalItems: FALLBACK_BOOKS.length }
    }
    return { books: [], totalItems: 0 }
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}/${id}`)
    if (!response.ok) return null

    const data = await response.json()
    return mapGoogleBookToBook(data)
  } catch (error) {
    console.error('Erro ao buscar livro por ID:', error)
    return null
  }
}

export async function fetchRecommendations(
  params: RecommendationParams
): Promise<Book[]> {
  const queries: string[] = []

  params.categories.forEach(cat => {
    queries.push(`subject:${cat}`)
  })

  params.authors.forEach(author => {
    queries.push(`inauthor:"${author}"`)
  })

  params.keywords.slice(0, 5).forEach(keyword => {
    if (keyword.length > 2) {
      queries.push(`${keyword}`)
    }
  })

  const uniqueQueries = [...new Set(queries)].slice(0, 8)

  const results = await Promise.allSettled(
    uniqueQueries.map(query =>
      searchBooks(query, params.language, MAX_RESULTS, 0, false)
    )
  )

  const allBooks: Book[] = []
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allBooks.push(...result.value.books)
    }
  })

  const seen = new Set<string>()
  const uniqueBooks = allBooks.filter(book => {
    const key = `${book.title.toLowerCase()}|${book.authors.join(',').toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const excludeSet = new Set(params.excludeIds)
  const filteredBooks = uniqueBooks.filter(book => !excludeSet.has(book.id))

  const booksWithMatch = filteredBooks.map(book => ({
    ...book,
    matchPercentage: calculateMatchPercentage(book, params),
  }))

  booksWithMatch.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))

  const topCount = Math.min(20, booksWithMatch.length)
  const topBooks = booksWithMatch.slice(0, topCount)
  const remainingBooks = booksWithMatch.slice(topCount)

  for (let i = topBooks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[topBooks[i], topBooks[j]] = [topBooks[j], topBooks[i]]
  }

  return [...topBooks, ...remainingBooks]
}

function calculateMatchPercentage(book: Book, params: RecommendationParams): number {
  let score = 75

  const bookCategories = book.categories.map(c => c.toLowerCase())
  const paramCategories = params.categories.map(c => c.toLowerCase())
  const categoryMatches = bookCategories.filter(c => paramCategories.includes(c)).length
  score += Math.min(categoryMatches * 15, 30)

  const bookAuthors = book.authors.map(a => a.toLowerCase())
  const paramAuthors = params.authors.map(a => a.toLowerCase())
  const authorMatches = bookAuthors.filter(a => paramAuthors.includes(a)).length
  score += Math.min(authorMatches * 20, 40)

  if (book.averageRating >= 4.5) score += 5
  else if (book.averageRating >= 4.0) score += 3
  else if (book.averageRating >= 3.5) score += 1

  if (book.ratingsCount > 10000) score += 3
  else if (book.ratingsCount > 1000) score += 2
  else if (book.ratingsCount > 100) score += 1

  const text = `${book.title} ${book.shortDescription}`.toLowerCase()
  const keywordMatches = params.keywords.filter(k =>
    text.includes(k.toLowerCase())
  ).length
  score += Math.min(keywordMatches * 2, 10)

  return Math.min(score, 99)
}

export async function fetchMoreRecommendations(
  params: RecommendationParams,
  startIndex: number
): Promise<Book[]> {
  const queries = params.categories
    .slice(0, 3)
    .map(cat => `subject:${cat}`)

  const results = await Promise.allSettled(
    queries.map(query =>
      searchBooks(query, params.language, MAX_RESULTS, startIndex, false)
    )
  )

  const allBooks: Book[] = []
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allBooks.push(...result.value.books)
    }
  })

  const seen = new Set<string>()
  const uniqueBooks = allBooks.filter(book => {
    const key = `${book.title.toLowerCase()}|${book.authors.join(',').toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const excludeSet = new Set(params.excludeIds)
  const filteredBooks = uniqueBooks.filter(book => !excludeSet.has(book.id))

  return filteredBooks.map(book => ({
    ...book,
    matchPercentage: calculateMatchPercentage(book, params),
  }))
}