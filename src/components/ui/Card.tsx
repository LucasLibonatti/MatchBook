import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'bg-white border border-slate-100',
      outlined: 'bg-white border-2 border-slate-200',
      elevated: 'bg-white shadow-soft border border-slate-100/50',
    }

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    const hoverStyles = hover
      ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
      : ''

    return (
      <div
        ref={ref}
        className={`
          rounded-3xl
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hoverStyles}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'