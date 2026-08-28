import { MAX_DECIMALS } from '../constants/config'

/**
 * Display a token amount. Precision follows the value's magnitude so small
 * balances stay readable and large ones stay scannable.
 *
 *   >= 1000            2 decimals, thousands separators
 *   1 – 1000           4 decimals
 *   0.0001 – 1         6 decimals
 *   < 0.0001 and > 0   "< 0.0001"
 *   0                  "0"
 */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0'

  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs < 0.0001) return `${sign}< 0.0001`

  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6
  return (
    sign +
    abs.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  )
}

/** USD is always two decimals with a `$`. Zero shows `$0.00`, never `-`. */
export function formatUsd(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  return safe.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** A percentage with two decimals, e.g. `0.06%`. */
export function formatPercent(value: number, decimals = 2): string {
  const safe = Number.isFinite(value) ? value : 0
  return `${safe.toFixed(decimals)}%`
}

/**
 * Group the integer part of a raw input string, keeping the fraction verbatim.
 * Used for the field that is *not* focused, so the caret never jumps.
 */
export function groupRawAmount(raw: string): string {
  if (!raw) return ''
  const [intPart = '', fracPart] = raw.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (fracPart === undefined) return raw.endsWith('.') ? `${grouped}.` : grouped
  return `${grouped}.${fracPart}`
}

/**
 * Turn a number into an input-ready string: no separators, no exponent
 * notation, at most MAX_DECIMALS fractional digits, no trailing zeroes.
 */
export function toAmountString(value: number, decimals = MAX_DECIMALS): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  const fixed = value.toFixed(decimals)
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}

/** `0x1a2b…9f8e` — enough to recognise, short enough to sit inline. */
export function truncateHash(hash: string, lead = 6, tail = 4): string {
  if (hash.length <= lead + tail + 1) return hash
  return `${hash.slice(0, lead)}…${hash.slice(-tail)}`
}

/** `Updated 14:32` timestamps under the card. */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Keystroke/paste sanitiser for the amount fields. Accepts digits with at most
 * one decimal point, understands both `1,5` and `1,234.56`, and truncates the
 * fraction to `decimals` digits. Returns
 * `null` when the candidate can't be salvaged, so the caller keeps the old
 * value instead of clearing the field.
 */
export function sanitizeAmountInput(candidate: string, decimals = MAX_DECIMALS): string | null {
  const trimmed = candidate.replace(/\s/g, '')
  // A comma is a decimal separator only when it stands alone; otherwise it is
  // thousands grouping from a paste like `1,234.56`.
  const commas = trimmed.split(',').length - 1
  const normalized =
    commas === 1 && !trimmed.includes('.')
      ? trimmed.replace(',', '.')
      : trimmed.replace(/,/g, '')
  if (normalized === '') return ''
  if (!/^\d*\.?\d*$/.test(normalized)) return null

  const [intPart = '', fracPart] = normalized.split('.')
  if (fracPart === undefined) return intPart
  return `${intPart}.${fracPart.slice(0, decimals)}`
}

/** Parse a sanitised input string. `''` is 0; `'.'` is NaN; `'.5'` is 0.5. */
export function parseAmount(raw: string): number {
  if (raw.trim() === '') return 0
  return Number(raw)
}
