import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDown, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatAmount, formatPercent, formatUsd } from '../../lib/format'
import { getPriceImpactTone } from '../../lib/swap'
import type { Token } from '../../types'

interface SwapDetailsProps {
  fromToken: Token
  toToken: Token
  rate: number
  fee: number
  feeUsd: number
  priceImpact: number
  minReceived: number
  slippage: number
  hasAmount: boolean
}

const IMPACT_CLASS = {
  normal: 'text-text',
  warning: 'text-warning-fg',
  danger: 'text-danger',
} as const

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn('num text-xs', valueClass ?? 'text-text')}>{value}</dd>
    </div>
  )
}

export function SwapDetails({
  fromToken,
  toToken,
  rate,
  fee,
  feeUsd,
  priceImpact,
  minReceived,
  slippage,
  hasAmount,
}: SwapDetailsProps) {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="rounded-2xl border border-border bg-surface px-4">
          <DisclosureButton className="flex w-full items-center justify-between gap-3 py-3 text-left">
            <span className="num flex items-center gap-2 text-xs text-text">
              <RefreshCw className="size-3 text-muted" aria-hidden="true" />
              1 {fromToken.symbol} = {formatAmount(rate)} {toToken.symbol}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
            />
          </DisclosureButton>

          <DisclosurePanel
            transition
            className="overflow-hidden transition-[max-height,opacity] duration-[180ms] ease-out data-closed:max-h-0 data-closed:opacity-0"
          >
            <dl className="border-t border-border py-2">
              <Row
                label="Network fee (0.3%)"
                value={hasAmount ? `${formatAmount(fee)} ${toToken.symbol} · ${formatUsd(feeUsd)}` : '—'}
              />
              <Row
                label="Price impact"
                value={hasAmount ? formatPercent(priceImpact) : '—'}
                valueClass={hasAmount ? IMPACT_CLASS[getPriceImpactTone(priceImpact)] : undefined}
              />
              <Row
                label={`Minimum received (${slippage}% slippage)`}
                value={hasAmount ? `${formatAmount(minReceived)} ${toToken.symbol}` : '—'}
              />
            </dl>
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  )
}
