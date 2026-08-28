import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Settings2 } from 'lucide-react'
import { useState } from 'react'
import { SLIPPAGE_PRESETS } from '../../constants/config'
import { cn } from '../../lib/cn'
import { sanitizeAmountInput } from '../../lib/format'

interface SlippageSettingsProps {
  slippage: number
  onChange: (value: number) => void
  disabled?: boolean
}

const MAX_SLIPPAGE = 50

export function SlippageSettings({ slippage, onChange, disabled }: SlippageSettingsProps) {
  const isPreset = (SLIPPAGE_PRESETS as readonly number[]).includes(slippage)
  const [custom, setCustom] = useState(() => (isPreset ? '' : String(slippage)))

  const handleCustom = (next: string) => {
    const sanitized = sanitizeAmountInput(next, 2)
    if (sanitized === null) return
    setCustom(sanitized)
    const parsed = Number(sanitized)
    if (sanitized !== '' && Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_SLIPPAGE) {
      onChange(parsed)
    }
  }

  return (
    <Popover className="relative">
      <PopoverButton
        disabled={disabled}
        aria-label={`Slippage tolerance, currently ${slippage}%`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-text disabled:cursor-not-allowed"
      >
        <Settings2 className="size-3.5" aria-hidden="true" />
        <span className="num">{slippage}%</span>
      </PopoverButton>

      <PopoverPanel
        transition
        anchor={{ to: 'bottom end', gap: 8 }}
        className={cn(
          'z-50 w-64 rounded-2xl border border-border bg-surface p-4 shadow-2xl',
          'transition duration-[180ms] ease-out data-closed:scale-[0.96] data-closed:opacity-0',
        )}
      >
        <p className="text-xs font-medium text-text">Slippage tolerance</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          The swap reverts if the price moves against you by more than this.
        </p>

        <div className="mt-3 flex gap-1.5">
          {SLIPPAGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setCustom('')
                onChange(preset)
              }}
              className={cn(
                'num flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors',
                slippage === preset
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-border text-muted hover:border-accent hover:text-text',
              )}
            >
              {preset.toFixed(1)}%
            </button>
          ))}
        </div>

        <label className="mt-2 flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 focus-within:border-accent">
          <span className="sr-only">Custom slippage percentage</span>
          <input
            type="text"
            inputMode="decimal"
            value={custom}
            onChange={(event) => handleCustom(event.target.value)}
            placeholder="Custom"
            className="num w-full bg-transparent text-xs outline-none placeholder:text-muted"
          />
          <span className="num text-xs text-muted">%</span>
        </label>

        {slippage > 5 ? (
          <p role="alert" className="mt-2 text-[11px] text-warning-fg">
            A high tolerance lets the swap fill at a much worse price.
          </p>
        ) : null}
      </PopoverPanel>
    </Popover>
  )
}
