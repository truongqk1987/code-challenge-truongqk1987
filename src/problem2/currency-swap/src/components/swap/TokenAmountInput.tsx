import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { formatAmount, formatUsd, groupRawAmount } from '../../lib/format'
import type { FieldSide, Token } from '../../types'
import { TokenIcon } from '../token/TokenIcon'
import { RollingNumber } from '../ui/RollingNumber'
import { Skeleton } from '../ui/Skeleton'

export interface TokenAmountInputProps {
  label: string // "You pay" | "You receive"
  side: FieldSide
  token: Token | null
  value: string // display string
  onValueChange: (v: string) => void
  onSelectToken: () => void
  balance: number
  showQuickAmounts?: boolean // "from" field only
  onQuickAmount?: (pct: 0.5 | 1) => void
  usdValue: number | null
  disabled?: boolean
  error?: string
  /** A blocking error reads danger; the high-impact notice reads warning. */
  errorTone?: 'danger' | 'warning'
  isLoading?: boolean // skeleton on the derived field while computing
  /** True when this field owns the raw input; false when it is derived. */
  isEditing: boolean
  onFocusField: () => void
  /** True for the upper field, whose bottom edge the switch button overhangs. */
  hasButtonBelow?: boolean
  onSubmit?: () => void
}

/** Long numbers step down a size rather than overflowing the card. */
function amountSizeClass(text: string): string {
  if (text.length > 18) return 'text-base sm:text-lg'
  if (text.length > 12) return 'text-lg sm:text-xl'
  return 'text-[1.75rem] sm:text-[2rem]'
}

export function TokenAmountInput({
  label,
  side,
  token,
  value,
  onValueChange,
  onSelectToken,
  balance,
  showQuickAmounts,
  onQuickAmount,
  usdValue,
  disabled,
  error,
  errorTone = 'danger',
  isLoading,
  isEditing,
  onFocusField,
  hasButtonBelow,
  onSubmit,
}: TokenAmountInputProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const takingOver = useRef(false)

  // The focused field shows the raw string so the caret never jumps; any other
  // field shows grouped digits.
  const display = focused ? value : groupRawAmount(value)

  // Clicking or tabbing into a derived field hands it the raw value and makes
  // it the source of truth — then we move the caret into the real input.
  const takeOver = () => {
    if (disabled) return
    takingOver.current = true
    onFocusField()
  }

  useEffect(() => {
    if (isEditing && takingOver.current) {
      takingOver.current = false
      inputRef.current?.focus()
    }
  }, [isEditing])

  return (
    <div
      className={cn(
        'rounded-2xl border bg-surface px-4 py-3.5 transition-colors',
        // The switch button overhangs the lower field edge, so an error line
        // there needs room below it to stay readable.
        error && hasButtonBelow && 'pb-9',
        error
          ? errorTone === 'warning'
            ? 'border-warning'
            : 'border-danger'
          : 'border-border focus-within:border-accent',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-xs font-medium text-muted">
          {label}
        </label>
        {token ? (
          <span className="num text-xs text-muted">
            Balance: <span className="text-text">{formatAmount(balance)}</span>
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          {isLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : isEditing ? (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              placeholder="0"
              value={display}
              disabled={disabled}
              aria-label={`${label} amount`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(event) => onValueChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onSubmit?.()
                }
              }}
              className={cn(
                'num w-full bg-transparent font-medium outline-none placeholder:text-muted',
                amountSizeClass(display || '0'),
              )}
            />
          ) : (
            <button
              type="button"
              id={inputId}
              disabled={disabled}
              onClick={takeOver}
              onFocus={takeOver}
              aria-label={`${label} amount, ${value || '0'}. Activate to edit.`}
              className={cn(
                'num block w-full truncate text-left font-medium',
                value ? 'text-text' : 'text-muted',
                amountSizeClass(value || '0'),
              )}
            >
              <RollingNumber value={value || '0'} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onSelectToken}
          disabled={disabled}
          aria-label={token ? `Change ${side} token, currently ${token.symbol}` : 'Select a token'}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-raised py-2 pr-2.5 pl-2 text-sm font-medium transition-colors',
            'hover:border-accent disabled:cursor-not-allowed disabled:hover:border-border',
          )}
        >
          {token ? (
            <>
              <TokenIcon symbol={token.symbol} size={24} />
              <span className="max-w-[7ch] truncate">{token.symbol}</span>
            </>
          ) : (
            <span className="pl-1">Select token</span>
          )}
          <ChevronDown className="size-4 text-muted" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-1.5 flex min-h-6 items-center justify-between gap-3">
        <span className="num text-xs text-muted">
          {usdValue === null ? '' : `≈ ${formatUsd(usdValue)}`}
        </span>

        {showQuickAmounts && token && balance > 0 ? (
          <span className="flex gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onQuickAmount?.(0.5)}
              className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted transition-colors hover:border-accent hover:text-accent-fg disabled:cursor-not-allowed"
            >
              50%
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onQuickAmount?.(1)}
              className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted transition-colors hover:border-accent hover:text-accent-fg disabled:cursor-not-allowed"
            >
              MAX
            </button>
          </span>
        ) : null}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className={cn('mt-1 text-xs', errorTone === 'warning' ? 'text-warning-fg' : 'text-danger')}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
