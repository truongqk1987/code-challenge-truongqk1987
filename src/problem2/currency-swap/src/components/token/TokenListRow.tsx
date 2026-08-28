import { forwardRef } from 'react'
import { formatAmount, formatUsd } from '../../lib/format'
import { cn } from '../../lib/cn'
import type { Token } from '../../types'
import { TokenIcon } from './TokenIcon'

interface TokenListRowProps {
  token: Token
  balance: number
  /** Already selected on the other side — dimmed, but still clickable. */
  inUse?: boolean
  isSelected?: boolean
  isActive?: boolean
  onSelect: (token: Token) => void
  onHover?: () => void
}

export const TokenListRow = forwardRef<HTMLButtonElement, TokenListRowProps>(function TokenListRow(
  { token, balance, inUse, isSelected, isActive, onSelect, onHover },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isSelected ?? false}
      onClick={() => onSelect(token)}
      onMouseMove={onHover}
      className={cn(
        'flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors',
        isActive ? 'bg-raised' : 'hover:bg-raised',
        inUse && 'opacity-55',
      )}
    >
      <TokenIcon symbol={token.symbol} size={32} />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{token.symbol}</span>
          {inUse ? (
            <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] tracking-wide text-muted uppercase">
              In use
            </span>
          ) : null}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="num block text-sm">{formatUsd(token.price)}</span>
        {balance > 0 ? (
          <span className="num block text-xs text-muted">
            {formatAmount(balance)} {token.symbol}
          </span>
        ) : null}
      </span>
    </button>
  )
})
