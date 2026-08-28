import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'warning' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  fullWidth?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink border border-accent hover:brightness-110 disabled:bg-raised disabled:text-muted disabled:border-border',
  warning:
    'bg-warning text-warning-ink border border-warning hover:brightness-110 disabled:bg-raised disabled:text-muted disabled:border-border',
  secondary:
    'bg-raised text-text border border-border hover:border-accent disabled:text-muted',
  ghost: 'bg-transparent text-muted border border-transparent hover:text-text hover:bg-raised',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-14 px-5 text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading, fullWidth, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-[transform,filter,border-color,background-color,color] duration-[120ms] select-none',
        'motion-safe:hover:not-disabled:scale-[1.01] active:not-disabled:scale-[0.99]',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? <Spinner className="size-4" label="" /> : null}
      {children}
    </button>
  )
})
