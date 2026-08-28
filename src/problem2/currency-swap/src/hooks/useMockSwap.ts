import { useCallback, useEffect, useRef, useState } from 'react'
import { MOCK_FAILURE_RATE, MOCK_TX_DELAY_MS } from '../constants/config'
import type { Token, TxErrorCode, TxResult, TxStatus } from '../types'

export interface SwapIntent {
  fromToken: Token
  toToken: Token
  amountIn: number
  amountOut: number
}

interface UseMockSwapOptions {
  /** Called once per successful swap, to settle the mock balances. */
  onSuccess: (result: TxResult) => void
}

export interface UseMockSwapResult {
  status: TxStatus
  intent: SwapIntent | null
  result: TxResult | null
  /** idle → confirming. Ignored in any other state, so double-clicks are inert. */
  submit: (intent: SwapIntent) => void
  confirm: () => void
  cancel: () => void
  retry: () => void
  close: () => void
}

const HEX = '0123456789abcdef'

function mockTxHash(): string {
  let hash = '0x'
  for (let i = 0; i < 64; i += 1) {
    hash += HEX[Math.floor(Math.random() * 16)]
  }
  return hash
}

function randomDelay(): number {
  const [min, max] = MOCK_TX_DELAY_MS
  return min + Math.random() * (max - min)
}

/** 50% slippage, 35% network, 15% rejected — every branch stays reachable. */
function rollErrorCode(): TxErrorCode {
  const roll = Math.random()
  if (roll < 0.5) return 'SLIPPAGE'
  if (roll < 0.85) return 'NETWORK'
  return 'REJECTED'
}

/**
 * The mocked transaction lifecycle:
 * idle → confirming → pending → success | error, with retry from error.
 */
export function useMockSwap({ onSuccess }: UseMockSwapOptions): UseMockSwapResult {
  const [status, setStatusState] = useState<TxStatus>('idle')
  const [intent, setIntent] = useState<SwapIntent | null>(null)
  const [result, setResult] = useState<TxResult | null>(null)
  // The ref mirrors `status` so guards read the committed value even when two
  // clicks land inside the same render — that is what blocks a double submit.
  const statusRef = useRef<TxStatus>('idle')
  const timer = useRef<number | null>(null)

  const setStatus = useCallback((next: TxStatus) => {
    statusRef.current = next
    setStatusState(next)
  }, [])
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  })

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const run = useCallback(
    (current: SwapIntent) => {
      clearTimer()
      setStatus('pending')
      setResult(null)

      timer.current = window.setTimeout(() => {
        timer.current = null
        const failed = Math.random() < MOCK_FAILURE_RATE
        const base = {
          fromToken: current.fromToken,
          toToken: current.toToken,
          amountIn: current.amountIn,
          amountOut: current.amountOut,
          timestamp: Date.now(),
        }

        if (failed) {
          setResult({ ...base, status: 'error', errorCode: rollErrorCode() })
          setStatus('error')
          return
        }

        const success: TxResult = { ...base, status: 'success', hash: mockTxHash() }
        setResult(success)
        setStatus('success')
        onSuccessRef.current(success)
      }, randomDelay())
    },
    [clearTimer, setStatus],
  )

  const submit = useCallback(
    (next: SwapIntent) => {
      if (statusRef.current !== 'idle') return
      setIntent(next)
      setResult(null)
      setStatus('confirming')
    },
    [setStatus],
  )

  const confirm = useCallback(() => {
    if (statusRef.current !== 'confirming' || !intent) return
    run(intent)
  }, [intent, run])

  const cancel = useCallback(() => {
    if (statusRef.current !== 'confirming') return
    setIntent(null)
    setStatus('idle')
  }, [setStatus])

  const retry = useCallback(() => {
    if (statusRef.current !== 'error' || !intent) return
    run(intent)
  }, [intent, run])

  const close = useCallback(() => {
    if (statusRef.current === 'pending') return
    clearTimer()
    setIntent(null)
    setResult(null)
    setStatus('idle')
  }, [clearTimer, setStatus])

  return { status, intent, result, submit, confirm, cancel, retry, close }
}
