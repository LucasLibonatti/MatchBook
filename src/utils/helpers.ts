/**
 * Utility functions for data sanitization and formatting
 */

/**
 * Removes HTML tags and decodes common HTML entities from a string
 * Used to clean descriptions from APIs before displaying in UI
 */
export function sanitizeHtml(text: string): string {
  if (!text) return ''

  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Truncates text to a maximum length, preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text

  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...'
  }

  return truncated + '...'
}

/**
 * Formats a number with locale-aware separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num)
}

/**
 * Generates a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}