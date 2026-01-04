import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-yellow-400 text-amber-900 hover:bg-yellow-500 active:bg-yellow-600 focus:ring-yellow-400': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200': variant === 'secondary',
            'text-gray-600 hover:text-gray-900 hover:bg-gray-100': variant === 'ghost',
            'min-h-11 px-3 py-2 text-sm': size === 'sm',
            'min-h-11 px-4 py-2 text-base': size === 'default',
            'min-h-14 px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
