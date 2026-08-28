import { ArrowDown } from 'lucide-react'
import { formatAmount, formatPercent, formatUsd } from '../../lib/format'
import { getPriceImpactTone, toUsd } from '../../lib/swap'
import type { SwapIntent } from '../../hooks/useMockSwap'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { TokenIcon } from '../token/TokenIcon'
import { cn } from '../../lib/cn'

const IMPACT_CLASS = {
  normal: 'text-text',
  warning: 'text-warning-fg',
  danger: 'text-danger',
} as const

interface ConfirmDialogProps {
  open: boolean
  intent: SwapIntent | null
  rate: number
  fee: number
  feeUsd: number
  minReceived: number
  priceImpact: number
  slippage: number
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

function Leg({
  label,
  symbol,
  amount,
  usd,
}: {
  label: string
  symbol: string
  amount: number
  usd: number
}) {
  return (
    <div className="rounded-2xl border border-border bg-raised px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span className="num min-w-0 truncate text-lg font-medium">{formatAmount(amount)}</span>
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium">
          <TokenIcon symbol={symbol} size={24} />
          {symbol}
        </span>
      </div>
      <p className="num mt-0.5 text-xs text-muted">≈ {formatUsd(usd)}</p>
    </div>
  )
}

export function ConfirmDialog({
  open,
  intent,
  rate,
  fee,
  feeUsd,
  minReceived,
  priceImpact,
  slippage,
  isPending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!intent) return null

  const { fromToken, toToken, amountIn, amountOut } = intent

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Confirm swap"
      dismissible={!isPending}
      className="sm:max-w-[420px]"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="relative">
          <Leg
            label="You pay"
            symbol={fromToken.symbol}
            amount={amountIn}
            usd={toUsd(amountIn, fromToken.price)}
          />
          <div className="flex justify-center py-1.5">
            <span className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-surface">
              <ArrowDown className="size-3.5 text-muted" aria-hidden="true" />
            </span>
          </div>
          <Leg
            label="You receive"
            symbol={toToken.symbol}
            amount={amountOut}
            usd={toUsd(amountOut, toToken.price)}
          />
        </div>

        <dl className="mt-4 space-y-1.5 rounded-2xl border border-border px-4 py-3">
          <div className="flex justify-between gap-4">
            <dt className="text-xs text-muted">Rate</dt>
            <dd className="num text-xs">
              1 {fromToken.symbol} = {formatAmount(rate)} {toToken.symbol}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-xs text-muted">Network fee (0.3%)</dt>
            <dd className="num text-xs">
              {formatAmount(fee)} {toToken.symbol} · {formatUsd(feeUsd)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-xs text-muted">Price impact</dt>
            <dd className={cn('num text-xs', IMPACT_CLASS[getPriceImpactTone(priceImpact)])}>
              {formatPercent(priceImpact)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-xs text-muted">Minimum received ({slippage}% slippage)</dt>
            <dd className="num text-xs">
              {formatAmount(minReceived)} {toToken.symbol}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          You receive at least {formatAmount(minReceived)} {toToken.symbol}, or the swap reverts.
        </p>
      </div>

      <footer className="flex shrink-0 gap-2 border-t border-border px-5 py-4">
        <Button variant="secondary" size="lg" fullWidth onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button size="lg" fullWidth onClick={onConfirm} isLoading={isPending}>
          {isPending ? 'Processing transaction…' : 'Confirm swap'}
        </Button>
      </footer>
    </Dialog>
  )
}
