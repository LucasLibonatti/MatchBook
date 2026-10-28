import { HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className = '', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-orange-100 text-orange-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-amber-100 text-amber-700',
      danger: 'bg-red-100 text-red-700',
      outline: 'bg-transparent border-2 border-slate-200 text-slate-600 hover:border-slate-300',
    }

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    }

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center font-medium rounded-full
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'