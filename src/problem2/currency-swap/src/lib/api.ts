import { PRICES_URL } from '../constants/config'
import type { PriceRecord } from '../types'

/**
 * Fetch the raw price feed. Shape validation and cleaning live in
 * `normalizeTokens` — this function only guarantees "an array came back".
 */
export async function fetchPrices(signal?: AbortSignal): Promise<PriceRecord[]> {
  const response = await fetch(PRICES_URL, { signal })

  if (!response.ok) {
    throw new Error(`Price feed responded with ${response.status}`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('Price feed returned an unexpected shape')
  }

  return data as PriceRecord[]
}
