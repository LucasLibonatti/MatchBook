export interface GoogleBookVolumeInfo {
  title: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  description?: string
  industryIdentifiers?: Array<{ type: string; identifier: string }>
  pageCount?: number
  categories?: string[]
  averageRating?: number
  ratingsCount?: number
  imageLinks?: {
    smallThumbnail?: string
    thumbnail?: string
    small?: string
    medium?: string
    large?: string
    extraLarge?: string
  }
  previewLink?: string
  infoLink?: string
  language?: string
}

export interface GoogleBookItem {
  id: string
  volumeInfo: GoogleBookVolumeInfo
  searchInfo?: { textSnippet: string }
}

export interface GoogleBooksResponse {
  items?: GoogleBookItem[]
  totalItems: number
}

export interface Book {
  id: string
  title: string
  authors: string[]
  publisher: string
  publishedDate: string
  year: number
  description: string
  shortDescription: string
  pageCount: number
  categories: string[]
  averageRating: number
  ratingsCount: number
  thumbnail: string
  previewLink: string
  infoLink: string
  language: string
  matchPercentage?: number
}

export interface SeedBook extends Book {
  slotIndex: number
}

export interface SwipeAction {
  type: 'like' | 'dislike'
  book: Book
}

export interface SearchResult {
  books: Book[]
  totalItems: number
}

export interface RecommendationParams {
  categories: string[]
  authors: string[]
  keywords: string[]
  excludeIds: string[]
  language: 'pt' | 'en'
}