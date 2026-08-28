import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Fragment, useCallback, useState } from 'react'
import { useMockSwap } from '../../hooks/useMockSwap'
import { useSwapForm } from '../../hooks/useSwapForm'
import { useTokenPrices } from '../../hooks/useTokenPrices'
import { cn } from '../../lib/cn'
import { formatTime } from '../../lib/format'
import type { FieldSide, Token } from '../../types'
import { TokenSelectDialog } from '../token/TokenSelectDialog'
import { ConfirmDialog } from '../transaction/ConfirmDialog'
import { TxResultDialog } from '../transaction/TxResultDialog'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { SlippageSettings } from './SlippageSettings'
import { SwapButton } from './SwapButton'
import { SwapDetails } from './SwapDetails'
import { SwitchDirectionButton } from './SwitchDirectionButton'
import { TokenAmountInput } from './TokenAmountInput'

function CardShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'glass-card w-full max-w-[480px] rounded-3xl p-4 shadow-2xl sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SwapCard() {
  const { tokens, tokenMap, isLoading, error, refetch, lastUpdated } = useTokenPrices()
  const form = useSwapForm({ tokens, tokenMap })
  const [pickerSide, setPickerSide] = useState<FieldSide | null>(null)
  const [turns, setTurns] = useState(0)
  const reduceMotion = useReducedMotion()

  const handleSuccess = useCallback(
    (result: Parameters<Parameters<typeof useMockSwap>[0]['onSuccess']>[0]) => {
      form.settleSwap({
        fromSymbol: result.fromToken.symbol,
        toSymbol: result.toToken.symbol,
        amountIn: result.amountIn,
        amountOut: result.amountOut,
      })
    },
    [form],
  )

  const tx = useMockSwap({ onSuccess: handleSuccess })
  const isPending = tx.status === 'pending'
  const isLocked = isPending

  const {
    fromToken,
    toToken,
    activeSide,
    amountFrom,
    amountTo,
    fromValue,
    toValue,
    fromBalance,
    toBalance,
    balanceOf,
    fromUsd,
    toUsd,
    rate,
    fee,
    feeUsd,
    minReceived,
    priceImpact,
    slippage,
    validation,
  } = form

  const handleSubmit = () => {
    if (!validation.canSubmit || !fromToken || !toToken || tx.status !== 'idle') return
    tx.submit({ fromToken, toToken, amountIn: amountFrom, amountOut: amountTo })
  }

  const handleSelectToken = (token: Token) => {
    if (!pickerSide) return
    form.selectToken(pickerSide, token)
  }

  const handleSwitch = () => {
    setTurns((value) => value + 1)
    form.switchDirection()
  }

  // ---- Loading / error / empty states -------------------------------------

  if (isLoading && tokens.length === 0) {
    return (
      <CardShell>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-4 h-[104px] w-full rounded-2xl" />
        <Skeleton className="mx-auto my-2 size-10 rounded-full" />
        <Skeleton className="h-[104px] w-full rounded-2xl" />
        <Skeleton className="mt-3 h-11 w-full rounded-2xl" />
        <Skeleton className="mt-3 h-14 w-full rounded-2xl" />
        <span className="sr-only" role="status">
          Loading token prices
        </span>
      </CardShell>
    )
  }

  if (error && tokens.length === 0) {
    return (
      <CardShell className="text-center">
        <AlertCircle className="mx-auto size-8 text-danger" aria-hidden="true" />
        <h2 className="font-display mt-3 text-lg">Couldn’t load token prices</h2>
        <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
        <Button className="mt-4" onClick={refetch}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      </CardShell>
    )
  }

  if (tokens.length === 0) {
    return (
      <CardShell className="text-center">
        <h2 className="font-display text-lg">No tradable tokens</h2>
        <p className="mt-1 text-sm text-muted">
          The price feed returned nothing with a usable price. Try again in a moment.
        </p>
        <Button className="mt-4" onClick={refetch}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh prices
        </Button>
      </CardShell>
    )
  }

  // ---- The form ------------------------------------------------------------

  const renderFields = (isFirst: (side: FieldSide) => boolean) => [
    {
      key: 'from' as const,
      node: (
        <TokenAmountInput
          label="You pay"
          side="from"
          token={fromToken}
          value={fromValue}
          isEditing={activeSide === 'from'}
          onFocusField={() => form.focusField('from')}
          onValueChange={(next) => form.setAmount('from', next)}
          onSelectToken={() => setPickerSide('from')}
          balance={fromBalance}
          showQuickAmounts
          onQuickAmount={form.applyQuickAmount}
          usdValue={fromUsd}
          disabled={isLocked}
          error={validation.messageSide === 'from' ? validation.message : undefined}
          errorTone={validation.tone === 'warning' ? 'warning' : 'danger'}
          hasButtonBelow={isFirst('from')}
          onSubmit={handleSubmit}
        />
      ),
    },
    {
      key: 'to' as const,
      node: (
        <TokenAmountInput
          label="You receive"
          side="to"
          token={toToken}
          value={toValue}
          isEditing={activeSide === 'to'}
          onFocusField={() => form.focusField('to')}
          onValueChange={(next) => form.setAmount('to', next)}
          onSelectToken={() => setPickerSide('to')}
          balance={toBalance}
          usdValue={toUsd}
          disabled={isLocked}
          error={validation.messageSide === 'to' ? validation.message : undefined}
          errorTone={validation.tone === 'warning' ? 'warning' : 'danger'}
          hasButtonBelow={isFirst('to')}
          onSubmit={handleSubmit}
        />
      ),
    },
  ]

  // The switch button reverses the render order, so the blocks visibly trade
  // places instead of their contents blinking over.
  const payIsFirst = turns % 2 === 0
  const fields = renderFields((side) => (side === 'from') === payIsFirst)
  const ordered = payIsFirst ? fields : [fields[1]!, fields[0]!]

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
        className="w-full max-w-[480px]"
      >
        <CardShell>
          <header className="flex items-center justify-between gap-3 px-1 pb-3">
            <h2 className="font-display text-lg leading-none">Swap</h2>
            <SlippageSettings
              slippage={slippage}
              onChange={form.setSlippage}
              disabled={isLocked}
            />
          </header>

          {/* §10.3 — the hairline swap axis running between the two fields. */}
          <div className="swap-axis relative">
            <div className="flex flex-col gap-2">
              {ordered.map((field, index) => (
                <Fragment key={field.key}>
                  {index === 1 ? (
                    // A zero-height row keeps the button on the true boundary
                    // between the fields, whatever height either one grows to.
                    <div className="relative z-30 flex h-0 items-center justify-center">
                      <span className="absolute -translate-y-1/2 rounded-full bg-surface p-1">
                        <SwitchDirectionButton
                          onClick={handleSwitch}
                          disabled={isLocked}
                          turns={turns}
                        />
                      </span>
                    </div>
                  ) : null}
                  <motion.div
                    layout={reduceMotion ? false : 'position'}
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  >
                    {field.node}
                  </motion.div>
                </Fragment>
              ))}
            </div>
          </div>

          {fromToken && toToken ? (
            <div className="mt-3">
              <SwapDetails
                fromToken={fromToken}
                toToken={toToken}
                rate={rate}
                fee={fee}
                feeUsd={feeUsd}
                priceImpact={priceImpact}
                minReceived={minReceived}
                slippage={slippage}
                hasAmount={amountTo > 0}
              />
            </div>
          ) : null}

          <div className="mt-3">
            <SwapButton
              label={validation.label}
              disabled={!validation.canSubmit}
              tone={validation.tone}
              isPending={isPending}
              onClick={handleSubmit}
            />
          </div>
        </CardShell>

        {lastUpdated ? (
          <p className="mt-3 text-center text-[11px] text-muted">
            <span className="num">Updated {formatTime(lastUpdated)}</span>
            {isLoading ? ' · refreshing' : ''}
            {' · '}
            <button
              type="button"
              onClick={refetch}
              className="underline underline-offset-2 hover:text-text"
            >
              Refresh
            </button>
          </p>
        ) : null}
      </form>

      <TokenSelectDialog
        open={pickerSide !== null}
        onClose={() => setPickerSide(null)}
        tokens={tokens}
        otherSymbol={
          pickerSide === 'from' ? (toToken?.symbol ?? null) : (fromToken?.symbol ?? null)
        }
        selectedSymbol={
          pickerSide === 'from' ? (fromToken?.symbol ?? null) : (toToken?.symbol ?? null)
        }
        balanceOf={balanceOf}
        onSelect={handleSelectToken}
      />

      {/* Mounted only for its own phases: two Headless UI dialogs alive at
          once leaves the lower one stuck open. */}
      {tx.status === 'confirming' || tx.status === 'pending' ? (
        <ConfirmDialog
          open
          intent={tx.intent}
          rate={rate}
          fee={fee}
          feeUsd={feeUsd}
          minReceived={minReceived}
          priceImpact={priceImpact}
          slippage={slippage}
          isPending={isPending}
          onConfirm={tx.confirm}
          onCancel={tx.cancel}
        />
      ) : null}

      {tx.status === 'success' || tx.status === 'error' ? (
        <TxResultDialog
          open
          result={tx.result}
          slippage={slippage}
          onRetry={tx.retry}
          onClose={tx.close}
        />
      ) : null}
    </>
  )
}
