import { ICON_BASE_URL } from '../constants/config'
import type { PriceRecord, Token } from '../types'

/** Icon filenames are case-sensitive, so the symbol is passed through verbatim. */
export function getIconUrl(symbol: string): string {
  return `${ICON_BASE_URL}/${symbol}.svg`
}

function isPriceRecord(value: unknown): value is PriceRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Partial<PriceRecord>
  return typeof record.currency === 'string' && typeof record.price === 'number'
}

/**
 * The API returns a flat array with duplicate currencies at different
 * timestamps, and some records carry no usable price. Clean it in this order:
 *
 *   1. drop non-finite or non-positive prices
 *   2. drop blank currencies
 *   3. dedupe by currency, keeping the newest date (ties: later in the array)
 *   4. keep the currency casing verbatim — icon filenames depend on it
 *   5. sort by symbol, case-insensitively
 */
export function normalizeTokens(records: PriceRecord[]): Token[] {
  const newest = new Map<string, PriceRecord>()

  for (const record of records) {
    if (!isPriceRecord(record)) continue

    const { price } = record
    if (!Number.isFinite(price) || price <= 0) continue

    const currency = record.currency.trim()
    if (!currency) continue

    const cleaned: PriceRecord = { currency, date: record.date ?? '', price }
    const existing = newest.get(currency)
    if (!existing) {
      newest.set(currency, cleaned)
      continue
    }

    const existingTime = Date.parse(existing.date)
    const nextTime = Date.parse(cleaned.date)
    const existingValid = Number.isFinite(existingTime)
    const nextValid = Number.isFinite(nextTime)

    // Unparseable dates lose to real ones; on a tie the later record wins.
    if (!nextValid && existingValid) continue
    if (!existingValid || nextTime >= existingTime) newest.set(currency, cleaned)
  }

  return [...newest.values()]
    .map(
      (record): Token => ({
        symbol: record.currency,
        price: record.price,
        iconUrl: getIconUrl(record.currency),
        updatedAt: record.date,
      }),
    )
    .sort((a, b) => a.symbol.localeCompare(b.symbol, 'en', { sensitivity: 'base' }))
}

/** Symbol → token, for O(1) lookups by the form state. */
export function toTokenMap(tokens: Token[]): Record<string, Token> {
  return Object.fromEntries(tokens.map((token) => [token.symbol, token]))
}

/**
 * Filter by symbol, ranking prefix matches above substring matches so typing
 * "et" surfaces ETH before wstETH.
 */
export function filterTokens(tokens: Token[], query: string): Token[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return tokens

  const prefix: Token[] = []
  const substring: Token[] = []

  for (const token of tokens) {
    const symbol = token.symbol.toLowerCase()
    if (symbol.startsWith(needle)) prefix.push(token)
    else if (symbol.includes(needle)) substring.push(token)
  }

  return [...prefix, ...substring]
}
