import { HTMLAttributes, forwardRef, useState } from 'react'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square'
  fallback?: React.ReactNode
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = '', size = 'md', shape = 'circle', fallback, className = '', ...props }, ref) => {
    const sizeStyles = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-24 h-24 text-2xl',
    }

    const shapeStyles = {
      circle: 'rounded-full',
      square: 'rounded-2xl',
    }

    const [imageError, setImageError] = useState(false)

    if (!src || imageError) {
      return (
        <div
          ref={ref}
          className={`
            inline-flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white font-medium
            ${sizeStyles[size]}
            ${shapeStyles[shape]}
            ${className}
          `}
          {...props}
        >
          {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
        </div>
      )
    }

    return (
      <img
        ref={ref as React.RefObject<HTMLImageElement>}
        src={src}
        alt={alt}
        onError={() => setImageError(true)}
        className={`
          object-cover
          ${sizeStyles[size]}
          ${shapeStyles[shape]}
          ${className}
        `}
        {...props}
      />
    )
  }
)

Avatar.displayName = 'Avatar'