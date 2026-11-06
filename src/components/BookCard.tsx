import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Star, Calendar, ExternalLink } from 'lucide-react'
import type { Book } from '../types/book'
import { Badge } from './ui'
import { sanitizeHtml } from '../utils/helpers'

interface BookCardProps {
  book: Book
  showMatchBadge?: boolean
  compact?: boolean
  onClick?: () => void
}

export function BookCard({
  book,
  showMatchBadge = true,
  compact = false,
  onClick,
}: BookCardProps) {
  const authors = book.authors.join(', ')
  const year = book.year
  const [imageError, setImageError] = useState(false)

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
      transition={{ duration: 0.2 }}
      className={`group rounded-3xl overflow-hidden bg-white dark:bg-slate-900 cursor-pointer ${compact ? 'max-w-xs' : ''}`}
      onClick={onClick}
      style={{ willChange: 'transform, box-shadow' }}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {!imageError && book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={`Capa do livro ${book.title}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center relative">
            <BookOpen className="w-16 h-16 text-white/30" aria-hidden="true" />
            {book.title && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-white/20">
                <p className="text-center text-sm font-medium leading-tight">
                  {book.title.length > 20 ? book.title.slice(0, 20) + '...' : book.title}
                </p>
              </div>
            )}
          </div>
        )}

        {showMatchBadge && book.matchPercentage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3"
            style={{ willChange: 'transform, opacity' }}
          >
            <Badge variant="default" size="md" className="shadow-lg bg-orange-500 text-white">
              {book.matchPercentage}% Match
            </Badge>
          </motion.div>
        )}

        {compact && book.matchPercentage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3"
            style={{ willChange: 'transform, opacity' }}
          >
            <Badge variant="default" size="sm" className="shadow-lg bg-orange-500 text-white w-fit">
              {book.matchPercentage}% Match
            </Badge>
          </motion.div>
        )}
      </div>

      <div className={`p-5 ${compact ? 'pb-4' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-3"
        >
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight line-clamp-2">
            {book.title}
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-1"
        >
          {authors}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-3"
        >
          {year && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              {year}
            </span>
          )}
          {book.pageCount && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              {book.pageCount} págs
            </span>
          )}
          {book.averageRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              {book.averageRating.toFixed(1)}
            </span>
          )}
        </motion.div>

        {book.categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap gap-1.5 mb-4"
          >
            {book.categories.slice(0, 3).map((cat, i) => (
              <Badge key={i} variant="outline" size="sm">{cat}</Badge>
            ))}
          </motion.div>
        )}

        {!compact && book.shortDescription && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4"
          >
            {sanitizeHtml(book.shortDescription)}
          </motion.p>
        )}

        {!compact && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            {book.previewLink && (
              <a
                href={book.previewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Visualizar
              </a>
            )}
            <a
              href={book.infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Mais detalhes
            </a>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}