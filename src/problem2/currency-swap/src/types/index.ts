/** Exact shape returned by prices.json */
export interface PriceRecord {
  currency: string
  date: string // ISO 8601
  price: number
}

/** Cleaned token, used everywhere in the app */
export interface Token {
  symbol: string // preserve API casing exactly: "bNEO", "ampLUNA", "wstETH"
  price: number // USD, always > 0
  iconUrl: string
  updatedAt: string // ISO date of the newest record
}

export type TxStatus = 'idle' | 'confirming' | 'pending' | 'success' | 'error'

export type TxErrorCode = 'SLIPPAGE' | 'NETWORK' | 'REJECTED'

export interface TxResult {
  status: 'success' | 'error'
  hash?: string // mock: '0x' + 64 hex chars
  errorCode?: TxErrorCode
  fromToken: Token
  toToken: Token
  amountIn: number
  amountOut: number
  timestamp: number
}

export type FieldSide = 'from' | 'to'
