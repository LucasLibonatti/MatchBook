import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500 shadow-soft-orange',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-7 py-3 text-lg gap-2.5',
      xl: 'px-10 py-4 text-xl gap-3',
    }

    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        ) : (
          <>
            {iconLeft && <span className="flex-shrink-0">{iconLeft}</span>}
            {children}
            {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'