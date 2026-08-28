import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPrices } from '../lib/api'
import { normalizeTokens, toTokenMap } from '../lib/tokens'
import {
  FETCH_RETRY_DELAYS_MS,
  PRICES_CACHE_KEY,
  PRICES_CACHE_TTL_MS,
} from '../constants/config'
import type { PriceRecord, Token } from '../types'

export interface UseTokenPricesResult {
  tokens: Token[]
  tokenMap: Record<string, Token>
  isLoading: boolean
  error: Error | null
  refetch: () => void
  lastUpdated: number | null
}

interface CacheEntry {
  timestamp: number
  records: PriceRecord[]
}

function readCache(): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(PRICES_CACHE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as CacheEntry).records) ||
      typeof (parsed as CacheEntry).timestamp !== 'number'
    ) {
      return null
    }
    return parsed as CacheEntry
  } catch {
    return null
  }
}

function writeCache(records: PriceRecord[]): number {
  const timestamp = Date.now()
  try {
    sessionStorage.setItem(PRICES_CACHE_KEY, JSON.stringify({ timestamp, records }))
  } catch {
    /* a full or unavailable sessionStorage must not break the app */
  }
  return timestamp
}

const isUsable = (entry: CacheEntry | null): entry is CacheEntry =>
  (entry?.records.length ?? 0) > 0

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/** Fetch once, retry twice with 500ms → 1500ms backoff, then give up. */
async function fetchWithRetry(signal: AbortSignal): Promise<PriceRecord[]> {
  let lastError: unknown

  for (let attempt = 0; attempt <= FETCH_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await fetchPrices(signal)
    } catch (error) {
      if (isAbort(error)) throw error
      lastError = error
      const delay = FETCH_RETRY_DELAYS_MS[attempt]
      if (delay === undefined) break
      await sleep(delay, signal)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Could not load token prices')
}

/**
 * Prices, with a session cache so a reload is instant. A fresh cache renders
 * immediately and still revalidates in the background; a stale one is shown
 * while the network catches up.
 */
export function useTokenPrices(): UseTokenPricesResult {
  // Read the cache exactly once, in a lazy initialiser rather than a ref, so
  // nothing touches storage during a render.
  const [cached] = useState(readCache)

  const [records, setRecords] = useState<PriceRecord[]>(() => cached?.records ?? [])
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => cached?.timestamp ?? null)
  const [isLoading, setIsLoading] = useState(
    () => !isUsable(cached) || Date.now() - (cached?.timestamp ?? 0) >= PRICES_CACHE_TTL_MS,
  )
  const [error, setError] = useState<Error | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const entry = readCache()
    const hasCache = isUsable(entry)

    void (async () => {
      try {
        const next = await fetchWithRetry(controller.signal)
        if (controller.signal.aborted) return
        setRecords(next)
        setLastUpdated(writeCache(next))
        setError(null)
      } catch (caught) {
        if (isAbort(caught) || controller.signal.aborted) return
        // A stale cache is better than an error screen; only surface the
        // failure when there is nothing at all to show.
        if (!hasCache) {
          setError(caught instanceof Error ? caught : new Error('Could not load token prices'))
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [nonce])

  const tokens = useMemo(() => normalizeTokens(records), [records])
  const tokenMap = useMemo(() => toTokenMap(tokens), [tokens])

  const refetch = useCallback(() => {
    setError(null)
    setIsLoading(true)
    setNonce((value) => value + 1)
  }, [])

  return { tokens, tokenMap, isLoading, error, refetch, lastUpdated }
}
