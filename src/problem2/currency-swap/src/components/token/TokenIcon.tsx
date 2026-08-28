import { useState } from 'react'
import { ICON_BASE_URL } from '../../constants/config'
import { hashString } from '../../lib/balance'
import { cn } from '../../lib/cn'

interface TokenIconProps {
  symbol: string
  size?: 20 | 24 | 32
  className?: string
}

/** Tier 0: exact casing. Tier 1: upper-cased. Tier 2: generated locally. */
type Tier = 0 | 1 | 2

const SIZE_CLASS: Record<20 | 24 | 32, string> = {
  20: 'size-5 text-[9px]',
  24: 'size-6 text-[10px]',
  32: 'size-8 text-xs',
}

function fallbackColor(symbol: string): string {
  // A stable hue per symbol keeps the fallback recognisable between renders.
  return `hsl(${hashString(symbol) % 360} 52% 42%)`
}

/**
 * The icon set is case-sensitive and incomplete, so each tier is attempted
 * exactly once — the attempt counter lives in state, which is what stops
 * `onError` from looping on a permanently missing file.
 */
export function TokenIcon({ symbol, size = 24, className }: TokenIconProps) {
  const [tier, setTier] = useState<Tier>(0)
  const [renderedSymbol, setRenderedSymbol] = useState(symbol)

  // A different token in the same slot starts the ladder over. Adjusting here
  // rather than in an effect avoids rendering one frame with the old tier.
  if (symbol !== renderedSymbol) {
    setRenderedSymbol(symbol)
    setTier(0)
  }

  const shared = cn('shrink-0 rounded-full', SIZE_CLASS[size], className)

  if (tier === 2) {
    const initials = symbol.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) || '?'
    return (
      <span
        role="img"
        aria-label={symbol}
        style={{ backgroundColor: fallbackColor(symbol) }}
        className={cn(shared, 'inline-flex items-center justify-center font-semibold text-white')}
      >
        {initials.toUpperCase()}
      </span>
    )
  }

  const upper = symbol.toUpperCase()
  const src = `${ICON_BASE_URL}/${tier === 0 ? symbol : upper}.svg`

  return (
    <img
      key={src}
      src={src}
      alt={symbol}
      loading="lazy"
      width={size}
      height={size}
      // An already-upper-case symbol would retry the identical URL, so tier 1
      // is skipped for it — otherwise `onError` never fires again and the
      // broken image sticks.
      onError={() => setTier((current) => (current === 0 && symbol !== upper ? 1 : 2))}
      className={cn(shared, 'bg-raised object-contain')}
    />
  )
}
