import { FEE_RATE, MOCK_LIQUIDITY_USD, PRICE_IMPACT_DANGER, PRICE_IMPACT_WARNING } from '../constants/config'
import type { Token } from '../types'

const MAX_PRICE_IMPACT = 15

/** amountOut = amountIn * priceIn / priceOut */
export function convert(amountIn: number, priceIn: number, priceOut: number): number {
  if (!Number.isFinite(amountIn) || !Number.isFinite(priceIn) || !Number.isFinite(priceOut)) return 0
  if (priceOut <= 0 || priceIn <= 0 || amountIn <= 0) return 0
  return (amountIn * priceIn) / priceOut
}

/** Rate: 1 from = ? to */
export function getRate(from: Token, to: Token): number {
  return convert(1, from.price, to.price)
}

/** Simulated fee, applied to amountOut */
export function getFee(amountOut: number): number {
  if (!Number.isFinite(amountOut) || amountOut <= 0) return 0
  return amountOut * FEE_RATE
}

/** Minimum received after fee and slippage */
export function getMinReceived(amountOut: number, slippagePct: number): number {
  if (!Number.isFinite(amountOut) || amountOut <= 0) return 0
  const slippage = Number.isFinite(slippagePct) ? Math.max(0, slippagePct) : 0
  return amountOut * (1 - FEE_RATE) * (1 - slippage / 100)
}

/** Simulated price impact, scaling with order size vs assumed liquidity */
export function getPriceImpact(amountInUsd: number): number {
  if (!Number.isFinite(amountInUsd) || amountInUsd <= 0) return 0
  const impact = (amountInUsd / (amountInUsd + MOCK_LIQUIDITY_USD)) * 100
  return Math.min(impact, MAX_PRICE_IMPACT)
}

/** USD value of an amount of a token. */
export function toUsd(amount: number, price: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(price) || amount <= 0 || price <= 0) return 0
  return amount * price
}

export type PriceImpactTone = 'normal' | 'warning' | 'danger'

/** How alarmed the interface should look about a given price impact. */
export function getPriceImpactTone(impact: number): PriceImpactTone {
  if (impact > PRICE_IMPACT_DANGER) return 'danger'
  if (impact > PRICE_IMPACT_WARNING) return 'warning'
  return 'normal'
}
