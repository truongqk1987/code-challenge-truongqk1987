/**
 * Mock balances. They must be identical on every render — a `Math.random()`
 * here would make the number flicker on each keystroke — so the symbol is
 * hashed into a USD notional and divided by the live price. Stablecoins land
 * in the thousands, WBTC in fractions, which reads far more like a real wallet
 * than a flat random range.
 */

const MIN_USD = 50
/**
 * The spec suggests a $25k ceiling, but with MOCK_LIQUIDITY_USD = $2M a $25k
 * order tops out at 1.2% price impact — the "> 5% impact" row of the
 * validation table would be unreachable, because the insufficient-balance rule
 * outranks it. A $250k ceiling keeps balances believable and makes every row
 * reproducible by hand.
 */
const MAX_USD = 250_000

/** Hand-picked balances so the demo opens on clean, familiar numbers. */
const FIXED_BALANCES: Record<string, number> = {
  USDC: 12_500,
  ETH: 3.42,
  WBTC: 0.086,
}

/** djb2 — small, fast, and well spread for short strings. */
export function hashString(value: string): number {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return hash >>> 0
}

/** Deterministic USD notional held in a given token. */
export function getMockBalanceUsd(symbol: string): number {
  const spread = hashString(symbol) % (MAX_USD - MIN_USD)
  return MIN_USD + spread
}

/** Hash a symbol into a simulated balance, deterministically. */
export function getMockBalance(symbol: string, price: number): number {
  const fixed = FIXED_BALANCES[symbol]
  if (fixed !== undefined) return fixed
  if (!Number.isFinite(price) || price <= 0) return 0
  return getMockBalanceUsd(symbol) / price
}
