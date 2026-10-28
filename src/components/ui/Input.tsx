import { forwardRef, InputHTMLAttributes, useId } from 'react'
import { Search, X } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  clearable?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      iconLeft,
      iconRight,
      clearable = false,
      className = '',
      id: providedId,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const errorId = `${id}-error`

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onChange?.({ currentTarget: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
      ref.current?.focus()
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? 'true' : 'false'}
            className={`
              w-full rounded-2xl border transition-all duration-200
              bg-white text-slate-800 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
              ${iconLeft ? 'pl-11' : 'pl-4'}
              ${iconRight || clearable ? 'pr-11' : 'pr-4'}
              py-3 text-base
              ${error ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}
              ${className}
            `}
            {...props}
          />
          {(clearable && value) || iconRight ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {clearable && value ? (
                <button
                  type="button"
                  onMouseDown={handleClear}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label="Limpar"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              ) : (
                <span className="text-slate-400">{iconRight}</span>
              )}
            </div>
          ) : null}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'