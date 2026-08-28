import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { POPULAR_TOKENS } from '../../constants/config'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { cn } from '../../lib/cn'
import { filterTokens } from '../../lib/tokens'
import type { Token } from '../../types'
import { Dialog } from '../ui/Dialog'
import { TokenIcon } from './TokenIcon'
import { TokenListRow } from './TokenListRow'

interface TokenSelectDialogProps {
  open: boolean
  onClose: () => void
  tokens: Token[]
  /** Symbol picked on the *other* field — shown as "In use". */
  otherSymbol: string | null
  selectedSymbol: string | null
  balanceOf: (token: Token) => number
  onSelect: (token: Token) => void
}

export function TokenSelectDialog({
  open,
  onClose,
  tokens,
  otherSymbol,
  selectedSymbol,
  balanceOf,
  onSelect,
}: TokenSelectDialogProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const debouncedQuery = useDebouncedValue(query, 150)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => filterTokens(tokens, debouncedQuery), [tokens, debouncedQuery])

  const popular = useMemo(
    () => POPULAR_TOKENS.map((symbol) => tokens.find((token) => token.symbol === symbol)).filter(
      (token): token is Token => token !== undefined,
    ),
    [tokens],
  )

  // A fresh open is a fresh search, and a new query starts the cursor over.
  // Both are adjustments to a changing input, so they happen during render
  // rather than in an effect.
  const [lastOpen, setLastOpen] = useState(open)
  const [lastQuery, setLastQuery] = useState(debouncedQuery)

  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }
  if (debouncedQuery !== lastQuery) {
    setLastQuery(debouncedQuery)
    setActiveIndex(0)
  }

  // Keep the keyboard cursor in view as it moves.
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const commit = (token: Token) => {
    onSelect(token)
    onClose()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const token = results[activeIndex]
      if (token) commit(token)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Select a token" initialFocus={searchRef}>
      <div className="shrink-0 px-5 pt-4" onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-raised px-3 focus-within:border-accent">
          <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by symbol"
            aria-label="Search tokens by symbol"
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>

        {popular.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {popular.map((token) => (
              <button
                key={token.symbol}
                type="button"
                onClick={() => commit(token)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:border-accent',
                  token.symbol === selectedSymbol && 'border-accent text-accent-fg',
                )}
              >
                <TokenIcon symbol={token.symbol} size={20} />
                {token.symbol}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        ref={listRef}
        role="listbox"
        aria-label="Tokens"
        className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-border py-1"
      >
        {results.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted">No tokens match “{debouncedQuery}”.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              className="mt-2 text-sm font-medium text-accent-fg underline underline-offset-4"
            >
              Clear filter
            </button>
          </div>
        ) : (
          results.map((token, index) => (
            <div key={token.symbol} data-index={index}>
              <TokenListRow
                token={token}
                balance={balanceOf(token)}
                inUse={token.symbol === otherSymbol}
                isSelected={token.symbol === selectedSymbol}
                isActive={index === activeIndex}
                onSelect={commit}
                onHover={() => setActiveIndex(index)}
              />
            </div>
          ))
        )}
      </div>
    </Dialog>
  )
}
