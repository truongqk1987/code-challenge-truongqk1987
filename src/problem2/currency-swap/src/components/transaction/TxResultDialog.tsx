import confetti from 'canvas-confetti'
import { AlertTriangle, Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { formatAmount, truncateHash } from '../../lib/format'
import type { TxErrorCode, TxResult } from '../../types'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface TxResultDialogProps {
  open: boolean
  result: TxResult | null
  slippage: number
  onRetry: () => void
  onClose: () => void
}

/** Auto-return to idle five seconds after a success (§8). */
const SUCCESS_AUTO_CLOSE_MS = 5000

function errorMessage(code: TxErrorCode | undefined, slippage: number): string {
  switch (code) {
    case 'SLIPPAGE':
      return `Price moved beyond your ${slippage}% slippage limit. Raise the limit and try again.`
    case 'NETWORK':
      return 'The network didn’t respond. Your transaction was never sent.'
    case 'REJECTED':
      return 'Transaction rejected. You weren’t charged.'
    default:
      return 'The swap didn’t go through.'
  }
}

function fireConfetti() {
  const styles = getComputedStyle(document.documentElement)
  const accent = styles.getPropertyValue('--accent').trim() || '#FFB454'
  const positive = styles.getPropertyValue('--positive').trim() || '#7BD1C0'

  void confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.35 },
    colors: [accent, positive],
    disableForReducedMotion: true,
  })
}

export function TxResultDialog({ open, result, slippage, onRetry, onClose }: TxResultDialogProps) {
  const [copied, setCopied] = useState(false)
  const celebrated = useRef<number | null>(null)

  const isSuccess = result?.status === 'success'

  // Exactly one burst per successful transaction, keyed on its timestamp.
  useEffect(() => {
    if (!open || !result || result.status !== 'success') return
    if (celebrated.current === result.timestamp) return
    celebrated.current = result.timestamp
    fireConfetti()
  }, [open, result])

  useEffect(() => {
    if (!open || !isSuccess) return
    const timer = window.setTimeout(onClose, SUCCESS_AUTO_CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [open, isSuccess, onClose])

  if (!result) return null

  const { fromToken, toToken, amountIn, amountOut, hash } = result

  const copyHash = async () => {
    if (!hash) return
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — the full hash is still selectable in the title */
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isSuccess ? 'Swap complete' : 'Swap failed'}>
      <div className="px-5 py-6 text-center">
        <span
          className={cn(
            'inline-flex size-14 items-center justify-center rounded-full border',
            isSuccess ? 'border-positive text-positive' : 'border-danger text-danger',
          )}
        >
          {isSuccess ? (
            <Check className="size-7" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-6" aria-hidden="true" />
          )}
        </span>

        {isSuccess ? (
          <>
            <p className="num mt-4 text-lg font-medium">
              {formatAmount(amountIn)} {fromToken.symbol} → {formatAmount(amountOut)}{' '}
              {toToken.symbol}
            </p>
            <p className="mt-1 text-xs text-muted">Balances updated.</p>

            {hash ? (
              <button
                type="button"
                onClick={copyHash}
                title={hash}
                className="num mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted transition-colors hover:border-accent hover:text-text"
              >
                {truncateHash(hash)}
                {copied ? (
                  <Check className="size-3.5 text-positive" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
                <span className="sr-only">{copied ? 'Hash copied' : 'Copy transaction hash'}</span>
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-text">
            {errorMessage(result.errorCode, slippage)}
          </p>
        )}
      </div>

      <footer className="flex shrink-0 gap-2 border-t border-border px-5 py-4">
        {isSuccess ? (
          <Button size="lg" fullWidth onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
              Close
            </Button>
            <Button size="lg" fullWidth onClick={onRetry}>
              Try again
            </Button>
          </>
        )}
      </footer>
    </Dialog>
  )
}
