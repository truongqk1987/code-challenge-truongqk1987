import { useCallback, useMemo, useState } from 'react'
import { getMockBalance } from '../lib/balance'
import { formatAmount, parseAmount, sanitizeAmountInput, toAmountString } from '../lib/format'
import { convert, getFee, getMinReceived, getPriceImpact, getRate, toUsd } from '../lib/swap'
import {
  DEFAULT_FROM_SYMBOL,
  DEFAULT_SLIPPAGE,
  DEFAULT_TO_SYMBOL,
  PRICE_IMPACT_DANGER,
} from '../constants/config'
import type { FieldSide, Token } from '../types'

export type ValidationCode =
  | 'NO_TOKEN'
  | 'NO_AMOUNT'
  | 'NAN'
  | 'NOT_POSITIVE'
  | 'INSUFFICIENT'
  | 'HIGH_IMPACT'
  | 'VALID'

export interface Validation {
  code: ValidationCode
  /** Submit-button label, straight from the §7 table. */
  label: string
  canSubmit: boolean
  /** `warning` renders the amber "Swap anyway" button. */
  tone: 'accent' | 'warning'
  /** Inline message, rendered under `messageSide`'s field. */
  message?: string
  messageSide?: FieldSide
}

interface UseSwapFormOptions {
  tokens: Token[]
  tokenMap: Record<string, Token>
}

export interface UseSwapFormResult {
  fromToken: Token | null
  toToken: Token | null
  activeSide: FieldSide
  rawInput: string
  /** Numeric amount of each side; the inactive one is always derived. */
  amountFrom: number
  amountTo: number
  /** What each field renders. The active side keeps the user's raw string. */
  fromValue: string
  toValue: string
  fromBalance: number
  toBalance: number
  /** Mock balance for any token, including the post-swap overlay. */
  balanceOf: (token: Token) => number
  fromUsd: number
  toUsd: number
  rate: number
  fee: number
  feeUsd: number
  minReceived: number
  priceImpact: number
  slippage: number
  validation: Validation
  setSlippage: (value: number) => void
  setAmount: (side: FieldSide, next: string) => void
  /** Make a field editable: it becomes the source of truth, in raw form. */
  focusField: (side: FieldSide) => void
  selectToken: (side: FieldSide, token: Token) => void
  switchDirection: () => void
  applyQuickAmount: (pct: 0.5 | 1) => void
  reset: () => void
  /** Settle a completed swap into the mock balances. */
  settleSwap: (input: { fromSymbol: string; toSymbol: string; amountIn: number; amountOut: number }) => void
}

/**
 * The form keeps a single source of truth — `{ activeSide, rawInput }` — and
 * derives the other field on every render. Storing both numbers would let them
 * drift apart the moment a price or a token changed.
 */
export function useSwapForm({ tokens, tokenMap }: UseSwapFormOptions): UseSwapFormResult {
  const [fromSymbol, setFromSymbol] = useState<string | null>(null)
  const [toSymbol, setToSymbol] = useState<string | null>(null)
  const [activeSide, setActiveSide] = useState<FieldSide>('from')
  const [rawInput, setRawInput] = useState('')
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE)
  /** Deltas applied on top of the deterministic mock balances after a swap. */
  const [balanceDeltas, setBalanceDeltas] = useState<Record<string, number>>({})

  // Seed the pair once prices arrive, preferring USDC → ETH.
  const seededFrom =
    fromSymbol ?? (tokenMap[DEFAULT_FROM_SYMBOL] ? DEFAULT_FROM_SYMBOL : (tokens[0]?.symbol ?? null))
  const seededTo =
    toSymbol ??
    (tokenMap[DEFAULT_TO_SYMBOL] && DEFAULT_TO_SYMBOL !== seededFrom
      ? DEFAULT_TO_SYMBOL
      : (tokens.find((token) => token.symbol !== seededFrom)?.symbol ?? null))

  const fromToken = seededFrom ? (tokenMap[seededFrom] ?? null) : null
  const toToken = seededTo ? (tokenMap[seededTo] ?? null) : null

  const balanceOf = useCallback(
    (token: Token | null) => {
      if (!token) return 0
      const base = getMockBalance(token.symbol, token.price)
      return Math.max(0, base + (balanceDeltas[token.symbol] ?? 0))
    },
    [balanceDeltas],
  )

  const fromBalance = balanceOf(fromToken)
  const toBalance = balanceOf(toToken)

  const parsed = parseAmount(rawInput)
  const hasAmount = rawInput.trim() !== '' && parsed !== 0
  const isNumber = Number.isFinite(parsed)

  const fromPrice = fromToken?.price ?? 0
  const toPrice = toToken?.price ?? 0

  const amountFrom =
    activeSide === 'from'
      ? isNumber
        ? Math.max(parsed, 0)
        : 0
      : convert(isNumber ? parsed : 0, toPrice, fromPrice)
  const amountTo =
    activeSide === 'to'
      ? isNumber
        ? Math.max(parsed, 0)
        : 0
      : convert(isNumber ? parsed : 0, fromPrice, toPrice)

  const fromUsd = toUsd(amountFrom, fromPrice)
  const toUsdValue = toUsd(amountTo, toPrice)

  const rate = fromToken && toToken ? getRate(fromToken, toToken) : 0
  const fee = getFee(amountTo)
  const feeUsd = toUsd(fee, toPrice)
  const minReceived = getMinReceived(amountTo, slippage)
  const priceImpact = getPriceImpact(fromUsd)

  // Derived fields show a rounded number; the maths always uses the raw value.
  const derivedFrom = amountFrom > 0 ? formatAmount(amountFrom) : ''
  const derivedTo = amountTo > 0 ? formatAmount(amountTo) : ''
  const fromValue = activeSide === 'from' ? rawInput : derivedFrom
  const toValue = activeSide === 'to' ? rawInput : derivedTo

  const validation = useMemo<Validation>(() => {
    if (!fromToken || !toToken) {
      return { code: 'NO_TOKEN', label: 'Select a token', canSubmit: false, tone: 'accent' }
    }
    if (!hasAmount && isNumber) {
      return { code: 'NO_AMOUNT', label: 'Enter an amount', canSubmit: false, tone: 'accent' }
    }
    if (!isNumber) {
      return {
        code: 'NAN',
        label: 'Enter an amount',
        canSubmit: false,
        tone: 'accent',
        message: 'Not a valid number',
        messageSide: activeSide,
      }
    }
    if (parsed <= 0) {
      return {
        code: 'NOT_POSITIVE',
        label: 'Enter an amount',
        canSubmit: false,
        tone: 'accent',
        message: 'Amount must be greater than 0',
        messageSide: activeSide,
      }
    }
    if (amountFrom > fromBalance) {
      return {
        code: 'INSUFFICIENT',
        label: 'Insufficient balance',
        canSubmit: false,
        tone: 'accent',
        message: `Insufficient balance. You have ${formatAmount(fromBalance)} ${fromToken.symbol}.`,
        messageSide: 'from',
      }
    }
    if (priceImpact > PRICE_IMPACT_DANGER) {
      return {
        code: 'HIGH_IMPACT',
        label: 'Swap anyway',
        canSubmit: true,
        tone: 'warning',
        message: `Price impact ${priceImpact.toFixed(2)}%. You'll receive noticeably less.`,
        messageSide: 'from',
      }
    }
    return { code: 'VALID', label: 'Swap', canSubmit: true, tone: 'accent' }
  }, [fromToken, toToken, hasAmount, isNumber, parsed, amountFrom, fromBalance, priceImpact, activeSide])

  const setAmount = useCallback((side: FieldSide, next: string) => {
    const sanitized = sanitizeAmountInput(next)
    if (sanitized === null) return // rejected keystroke — keep what was there
    setActiveSide(side)
    setRawInput(sanitized)
  }, [])

  const focusField = useCallback(
    (side: FieldSide) => {
      if (side === activeSide) return
      // The derived field renders a grouped, rounded string. Hand the user the
      // raw number the moment they take it over, so editing starts from a
      // value the sanitiser accepts.
      setRawInput(toAmountString(side === 'from' ? amountFrom : amountTo))
      setActiveSide(side)
    },
    [activeSide, amountFrom, amountTo],
  )

  const selectToken = useCallback(
    (side: FieldSide, token: Token) => {
      const other = side === 'from' ? seededTo : seededFrom
      if (token.symbol === other) {
        // Picking the token already in use on the other side means "flip" —
        // swapping is what the user meant, and it beats an error message.
        setFromSymbol(seededTo)
        setToSymbol(seededFrom)
        return
      }
      if (side === 'from') setFromSymbol(token.symbol)
      else setToSymbol(token.symbol)
    },
    [seededFrom, seededTo],
  )

  const switchDirection = useCallback(() => {
    setFromSymbol(seededTo)
    setToSymbol(seededFrom)
    // Keep the number sitting in the From field rather than swapping the
    // numbers over — flipping direction is usually about reading the inverse
    // rate, not about restating the trade.
    if (activeSide === 'to') {
      setRawInput(toAmountString(amountFrom))
      setActiveSide('from')
    }
  }, [seededFrom, seededTo, activeSide, amountFrom])

  const applyQuickAmount = useCallback(
    (pct: 0.5 | 1) => {
      setActiveSide('from')
      setRawInput(toAmountString(fromBalance * pct))
    },
    [fromBalance],
  )

  const reset = useCallback(() => {
    setRawInput('')
    setActiveSide('from')
  }, [])

  const settleSwap = useCallback<UseSwapFormResult['settleSwap']>((input) => {
    setBalanceDeltas((current) => ({
      ...current,
      [input.fromSymbol]: (current[input.fromSymbol] ?? 0) - input.amountIn,
      [input.toSymbol]: (current[input.toSymbol] ?? 0) + input.amountOut,
    }))
    setRawInput('')
    setActiveSide('from')
  }, [])

  return {
    fromToken,
    toToken,
    activeSide,
    rawInput,
    amountFrom,
    amountTo,
    fromValue,
    toValue,
    fromBalance,
    toBalance,
    balanceOf,
    fromUsd,
    toUsd: toUsdValue,
    rate,
    fee,
    feeUsd,
    minReceived,
    priceImpact,
    slippage,
    validation,
    setSlippage,
    setAmount,
    focusField,
    selectToken,
    switchDirection,
    applyQuickAmount,
    reset,
    settleSwap,
  }
}
