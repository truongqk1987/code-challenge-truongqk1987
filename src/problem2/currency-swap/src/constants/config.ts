export const PRICES_URL = 'https://interview.switcheo.com/prices.json'

export const ICON_BASE_URL = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens'

export const MOCK_TX_DELAY_MS = [1400, 2600] as const // random within range
export const MOCK_FAILURE_RATE = 0.15 // 15% failure so the error UI is reachable
export const FEE_RATE = 0.003
export const DEFAULT_SLIPPAGE = 0.5
export const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0] as const
export const MOCK_LIQUIDITY_USD = 2_000_000

/** sessionStorage key + TTL for the price cache. */
export const PRICES_CACHE_KEY = 'swap:prices:v1'
export const PRICES_CACHE_TTL_MS = 5 * 60 * 1000

/** localStorage key for the theme choice. */
export const THEME_STORAGE_KEY = 'swap:theme'

/** Retry backoff for the price fetch: two retries, 500ms then 1500ms. */
export const FETCH_RETRY_DELAYS_MS = [500, 1500] as const

/** Highlighted at the top of the token picker. */
export const POPULAR_TOKENS = ['USDC', 'ETH', 'WBTC', 'ATOM', 'OSMO', 'SWTH'] as const

/** Price-impact thresholds, in percent. */
export const PRICE_IMPACT_WARNING = 2
export const PRICE_IMPACT_DANGER = 5

/** Maximum fractional digits accepted by an amount field. */
export const MAX_DECIMALS = 8

export const DEFAULT_FROM_SYMBOL = 'USDC'
export const DEFAULT_TO_SYMBOL = 'ETH'
