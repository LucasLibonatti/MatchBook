import type { Book, GoogleBookItem, GoogleBooksResponse, SearchResult, RecommendationParams } from '../types/book'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json'
const DEFAULT_LANGUAGE = 'pt'
const MAX_RESULTS = 40

// Get API key from Vite env (VITE_ prefix required for client-side exposure)
const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

// In-memory cache + sessionStorage for persistence across reloads
interface CacheEntry {
  data: SearchResult
  timestamp: number
}

const memoryCache = new Map<string, CacheEntry>()
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

function getCacheKey(query: string, language: string, maxResults: number, forAutocomplete: boolean): string {
  return `${query}|${language}|${maxResults}|${forAutocomplete}`
}

function getCachedResult(key: string): SearchResult | null {
  // Check memory cache first
  const memEntry = memoryCache.get(key)
  if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL) {
    return memEntry.data
  }

  // Check sessionStorage
  try {
    const stored = sessionStorage.getItem(`googlebooks_${key}`)
    if (stored) {
      const entry: CacheEntry = JSON.parse(stored)
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        memoryCache.set(key, entry)
        return entry.data
      }
    }
  } catch {
    // Ignore sessionStorage errors
  }

  return null
}

function setCacheResult(key: string, data: SearchResult): void {
  const entry: CacheEntry = { data, timestamp: Date.now() }
  memoryCache.set(key, entry)
  try {
    sessionStorage.setItem(`googlebooks_${key}`, JSON.stringify(entry))
  } catch {
    // Ignore sessionStorage errors
  }
}

// High-quality fallback books with real Open Library cover URLs
export const FALLBACK_BOOKS: Book[] = [
  {
    id: 'fallback-1',
    title: '1984',
    authors: ['George Orwell'],
    publisher: 'Companhia das Letras',
    publishedDate: '1949',
    year: 1949,
    description: 'Um romance distópico que retrata um regime totalitário de vigilância extrema e manipulação da verdade.',
    shortDescription: 'Clássico distópico sobre vigilância totalitária e manipulação da verdade.',
    pageCount: 328,
    categories: ['Ficção Científica', 'Distopia', 'Clássicos'],
    averageRating: 4.7,
    ratingsCount: 50000,
    thumbnail: 'https://covers.openlibrary.org/b/isbn/9788535914849-L.jpg',
    previewLink: 'https://books.google.com/books?id=1984',
    infoLink: 'https://openlibrary.org/works/OL27647W',
    language: 'pt',
  },
  {
    id: 'fallback-2',
    title: 'Dom Casmurro',
    authors: ['Machado de Assis'],
    publisher: 'Editora Ática',
    publishedDate: '1899',
    year: 1899,
    description: 'Clássico da literatura brasileira sobre ciúme e traição, narrado por Bentinho, que questiona se Capitu o traiu com Escobar.',
    shortDescription: 'Clássico brasileiro sobre ciúme, traição e narrador não confiável.',
    pageCount: 256,
    categories: ['Romance', 'Literatura Brasileira', 'Clássicos'],
    averageRating: 4.5,
    ratingsCount: 15000,
    thumbnail: 'https://covers.openlibrary.org/b/isbn/9788508022351-L.jpg',
    previewLink: 'https://books.google.com/books?id=dom-casmurro',
    infoLink: 'https://openlibrary.org/works/OL37168W',
    language: 'pt',
  },
  {
    id: 'fallback-3',
    title: 'O Hobbit',
    authors: ['J.R.R. Tolkien'],
    publisher: 'HarperCollins',
    publishedDate: '1937',
    year: 1937,
    description: 'Bilbo Bolseiro, um hobbit tranquilo, é arrastado para uma aventura épica com anões e o mago Gandalf para recuperar um tesouro guardado por um dragão.',
    shortDescription: 'Aventura fantástica que precede O Senhor dos Anéis.',
    pageCount: 336,
    categories: ['Fantasia', 'Aventura', 'Clássicos'],
    averageRating: 4.8,
    ratingsCount: 40000,
    thumbnail: 'https://covers.openlibrary.org/b/isbn/9788595084742-L.jpg',
    previewLink: 'https://books.google.com/books?id=o-hobbit',
    infoLink: 'https://openlibrary.org/works/OL26332W',
    language: 'pt',
  },
  {
    id: 'fallback-4',
    title: 'Hábitos Atômicos',
    authors: ['James Clear'],
    publisher: 'Alta Books',
    publishedDate: '2018',
    year: 2018,
    description: 'Guia prático para criar bons hábitos e quebrar os ruins, mostrando como pequenas mudanças geram resultados extraordinários.',
    shortDescription: 'Best-seller sobre formação de hábitos e melhoria contínua.',
    pageCount: 320,
    categories: ['Autoajuda', 'Produtividade', 'Psicologia'],
    averageRating: 4.7,
    ratingsCount: 35000,
    thumbnail: 'https://covers.openlibrary.org/b/isbn/9788550804612-L.jpg',
    previewLink: 'https://books.google.com/books?id=habitos-atomicos',
    infoLink: 'https://openlibrary.org/works/OL19845834W',
    language: 'pt',
  },
  {
    id: 'fallback-5',
    title: 'Duna',
    authors: ['Frank Herbert'],
    publisher: 'Aleph',
    publishedDate: '1965',
    year: 1965,
    description: 'No planeta desértico Arrakis, Paul Atreides deve liderar os Fremen em uma batalha pelo controle da especiaria mais valiosa do universo.',
    shortDescription: 'Épico de ficção científica política e ecológica.',
    pageCount: 688,
    categories: ['Ficção Científica', 'Fantasia', 'Clássicos'],
    averageRating: 4.6,
    ratingsCount: 30000,
    thumbnail: 'https://covers.openlibrary.org/b/isbn/9788576573101-L.jpg',
    previewLink: 'https://books.google.com/books?id=duna',
    infoLink: 'https://openlibrary.org/works/OL26335W',
    language: 'pt',
  },
  {
    id: 'fallback-6',
    title: 'O Pequeno Príncipe',
    authors: ['Antoine de Saint-Exupéry'],
    publisher: 'Agir',
    publishedDate: '1943',
    year: 1943,
    description: 'Um piloto perdido no deserto encontra um pequeno príncipe de outro planeta, que lhe ensina sobre o essencial que é invisível aos olhos.',
    shortDescription: 'Fábula poética sobre amizade, amor e o sentido da vida.',
    pageCount: 96,
    categories: ['Infantil', 'Filosofia', 'Clássicos'],
    averageRating: 4.9,
    ratingsCount: 60000,
    thumbnail: 'https://covers.openlibrary.org/b/isbn/9788522031981-L.jpg',
    previewLink: 'https://books.google.com/books?id=pequeno-principe',
    infoLink: 'https://openlibrary.org/works/OL27652W',
    language: 'pt',
  },
]

function sanitizeDescription(description: string, maxLength = 320): string {
  if (!description) return ''

  const clean = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/"/g, '"')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
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

  // For Google Books URLs, add high-quality parameters
  if (fixed.includes('googleusercontent.com') || fixed.includes('books.google.com')) {
    // Remove existing zoom param and add high-quality fife params
    fixed = fixed.replace(/zoom=\d+/, 'zoom=1')
    if (!fixed.includes('fife=')) {
      const separator = fixed.includes('?') ? '&' : '?'
      fixed += `${separator}fife=w600-h900`
    }
  }

  return fixed
}

// Open Library cover URL from cover_id
function getOpenLibraryCoverUrl(coverId: number | undefined): string {
  if (!coverId) return ''
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
}

// Open Library cover URL from ISBN
function getOpenLibraryCoverFromISBN(isbn: string | undefined): string {
  if (!isbn) return ''
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
}

function extractYear(dateString?: string): number {
  if (!dateString) return new Date().getFullYear()
  const match = dateString.match(/(\d{4})/)
  return match ? parseInt(match[1], 10) : new Date().getFullYear()
}

function mapGoogleBookToBook(item: GoogleBookItem): Book {
  const info = item.volumeInfo
  const thumbnail: string = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || ''
  const isbn = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier
            || info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier

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
    thumbnail: hasThumbnail ? fixImageUrl(thumbnail) : (isbn ? getOpenLibraryCoverFromISBN(isbn) : ''),
    previewLink: info.previewLink || '',
    infoLink: info.infoLink || `https://books.google.com/books?id=${item.id}`,
    language: info.language || DEFAULT_LANGUAGE,
  }
}

function mapOpenLibraryDocToBook(doc: Record<string, unknown>): Book {
  const title = (doc.title as string) || 'Título Desconhecido'
  const authors = (doc.author_name as string[]) || ['Autor Desconhecido']
  const firstPublishYear = (doc.first_publish_year as number) || new Date().getFullYear()
  const coverId = doc.cover_i as number
  const isbn = (doc.isbn as string[])?.[0]
  const olid = (doc.olid as string) || (doc.key as string)?.replace('/works/', '')

  return {
    id: `ol-${olid || coverId || title.replace(/\s+/g, '-').toLowerCase()}`,
    title,
    authors,
    publisher: (doc.publisher as string[])?.[0] || 'Editora Desconhecida',
    publishedDate: String(firstPublishYear),
    year: firstPublishYear,
    description: `Livro de ${authors[0]}. Publicado em ${firstPublishYear}.`,
    shortDescription: `Livro de ${authors[0]}. Publicado em ${firstPublishYear}.`,
    pageCount: (doc.number_of_pages_median as number) || 0,
    categories: (doc.subject as string[])?.slice(0, 5) || ['Literatura'],
    averageRating: 0,
    ratingsCount: 0,
    thumbnail: getOpenLibraryCoverUrl(coverId) || (isbn ? getOpenLibraryCoverFromISBN(isbn) : ''),
    previewLink: `https://openlibrary.org${doc.key}`,
    infoLink: `https://openlibrary.org${doc.key}`,
    language: 'pt',
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

async function searchOpenLibrary(query: string, limit = 8): Promise<SearchResult> {
  try {
    const url = `${OPEN_LIBRARY_API}?q=${encodeURIComponent(query)}&limit=${limit}&fields=title,author_name,first_publish_year,cover_i,isbn,key,subject,publisher,number_of_pages_median`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Open Library API error: ${response.status}`)
    }

    const data = await response.json()
    const docs = (data.docs as Record<string, unknown>[]) || []

    if (docs.length === 0) {
      return { books: [], totalItems: 0 }
    }

    const books = docs
      .filter((doc: Record<string, unknown>) => doc.title && (doc.author_name as string[])?.length)
      .map(mapOpenLibraryDocToBook)

    return {
      books,
      totalItems: data.numFound || 0,
    }
  } catch (error) {
    console.error('[OpenLibrary] Search failed:', error)
    return { books: [], totalItems: 0 }
  }
}

export async function searchBooks(
  query: string,
  language: 'pt' | 'en' = DEFAULT_LANGUAGE,
  maxResults = 10,
  startIndex = 0,
  forAutocomplete = false,
  signal?: AbortSignal
): Promise<SearchResult> {
  const trimmedQuery = query.trim()

  if (forAutocomplete && trimmedQuery.length < 3) {
    return { books: [], totalItems: 0 }
  }

  const cacheKey = getCacheKey(trimmedQuery, language, maxResults, forAutocomplete)
  const cached = getCachedResult(cacheKey)
  if (cached) {
    console.log('[GoogleBooks] Cache hit:', { query: trimmedQuery })
    return cached
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    langRestrict: forAutocomplete ? '' : language,
    maxResults: String(maxResults),
    startIndex: String(startIndex),
    orderBy: 'relevance',
    printType: 'books',
    projection: 'full',
  })

  if (!forAutocomplete) {
    params.set('langRestrict', language)
  }

  if (GOOGLE_BOOKS_API_KEY) {
    params.set('key', GOOGLE_BOOKS_API_KEY)
  }

  try {
    const url = `${GOOGLE_BOOKS_API}?${params}`
    console.log('[GoogleBooks] Request:', { query: trimmedQuery, language, maxResults, forAutocomplete, hasKey: !!GOOGLE_BOOKS_API_KEY })

    const response = await fetch(url, { signal })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('[GoogleBooks] API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorBody: errorText,
        query: trimmedQuery,
      })

      // If 429 (rate limit), throw to trigger fallback
      if (response.status === 429) {
        throw new Error(`Rate limited: ${response.status}`)
      }

      throw new Error(`Google Books API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data: GoogleBooksResponse = await response.json()
    const items = data.items || []

    console.log('[GoogleBooks] Response:', { totalItems: data.totalItems, itemsCount: items.length, query: trimmedQuery })

    if (items.length === 0) {
      console.warn('[GoogleBooks] No items returned for query:', trimmedQuery)
      // Try Open Library as fallback
      const olResult = await searchOpenLibrary(trimmedQuery, maxResults)
      if (olResult.books.length > 0) {
        setCacheResult(cacheKey, olResult)
        return olResult
      }
      return { books: [], totalItems: 0 }
    }

    // Use loose filter for autocomplete, strict for recommendations
    const qualityItems = forAutocomplete ? filterAutocompleteBooks(items) : filterQualityBooks(items)
    const books = qualityItems.map(mapGoogleBookToBook)

    console.log('[GoogleBooks] Filtered:', {
      originalCount: items.length,
      filteredCount: books.length,
      forAutocomplete,
      query: trimmedQuery
    })

    // If no results after filtering, return fallback for autocomplete
    if (books.length === 0 && forAutocomplete) {
      console.log('[GoogleBooks] Returning fallback books for autocomplete')
      const fallbackResult = {
        books: FALLBACK_BOOKS.slice(0, maxResults),
        totalItems: FALLBACK_BOOKS.length
      }
      setCacheResult(cacheKey, fallbackResult)
      return fallbackResult
    }

    const result = {
      books,
      totalItems: data.totalItems || 0,
    }

    setCacheResult(cacheKey, result)
    return result
  } catch (error) {
    console.error('[GoogleBooks] Search failed:', {
      error: error instanceof Error ? error.message : String(error),
      query: trimmedQuery,
      forAutocomplete,
    })

    // Try Open Library as fallback
    console.log('[GoogleBooks] Trying Open Library fallback...')
    const olResult = await searchOpenLibrary(trimmedQuery, maxResults)
    if (olResult.books.length > 0) {
      setCacheResult(cacheKey, olResult)
      return olResult
    }

    // Return fallback books for autocomplete so UI never breaks
    if (forAutocomplete) {
      console.log('[GoogleBooks] Returning fallback books due to error')
      const fallbackResult = {
        books: FALLBACK_BOOKS.slice(0, maxResults),
        totalItems: FALLBACK_BOOKS.length
      }
      setCacheResult(cacheKey, fallbackResult)
      return fallbackResult
    }
    return { books: [], totalItems: 0 }
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const params = new URLSearchParams()
    if (GOOGLE_BOOKS_API_KEY) {
      params.set('key', GOOGLE_BOOKS_API_KEY)
    }
    const url = `${GOOGLE_BOOKS_API}/${id}?${params}`

    const response = await fetch(url)
    if (!response.ok) {
      console.error('[GoogleBooks] getBookById error:', {
        status: response.status,
        statusText: response.statusText,
        id,
      })
      return null
    }

    const data = await response.json()
    return mapGoogleBookToBook(data)
  } catch (error) {
    console.error('[GoogleBooks] getBookById failed:', {
      error: error instanceof Error ? error.message : String(error),
      id,
    })
    return null
  }
}

export async function fetchRecommendations(
  params: RecommendationParams
): Promise<Book[]> {
  // Build only 2-3 intelligent combined queries instead of 8 separate ones
  const queries: string[] = []

  // Query 1: Combine top categories
  if (params.categories.length > 0) {
    queries.push(`subject:${params.categories.slice(0, 3).join(' OR subject:')}`)
  }

  // Query 2: Combine top authors
  if (params.authors.length > 0) {
    queries.push(`inauthor:"${params.authors.slice(0, 2).join('" OR inauthor:"')}"`)
  }

  // Query 3: Keywords only if we don't have enough from above
  if (queries.length < 2 && params.keywords.length > 0) {
    queries.push(params.keywords.slice(0, 3).join(' '))
  }

  const uniqueQueries = [...new Set(queries)].slice(0, 3)

  console.log('[Recommendations] Queries:', uniqueQueries)

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
    .slice(0, 2)
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