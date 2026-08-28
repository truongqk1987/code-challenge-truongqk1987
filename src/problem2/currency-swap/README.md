# Currency Swap

A token swap interface — pick what you pay, pick what you receive, watch the
other side calculate itself. Prices are real; everything behind the swap button
is simulated. Built with Vite + React + TypeScript.

---

## 1. Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build — no TypeScript errors
npm run test     # vitest run — the pure swap maths
```

Node 20+.

---

## 2. Features

**Data**

- Live prices from `interview.switcheo.com/prices.json`, cleaned in `lib/tokens.ts`:
  non-finite and non-positive prices dropped, blank currencies dropped, duplicates
  deduped to the newest `date`, casing preserved (`bNEO`, `ampLUNA`, `wstETH`),
  sorted case-insensitively.
- Two automatic retries (500ms → 1500ms) before an error state, `AbortController`
  cleanup on unmount.
- 5-minute `sessionStorage` cache under `swap:prices:v1`: a reload renders from
  cache immediately and revalidates in the background.
- Token icons try exact casing, then upper case, then a locally drawn initial —
  each tier exactly once, so a missing file can never loop.
- Balances are hashed from the symbol, so they never change between renders.

**Interaction**

- Two-way calculation: type on either side and the other follows.
- Switch direction — tokens swap, the number stays in the *You pay* field.
- 50% and MAX quick amounts, USD equivalent under both fields.
- Live `1 A = X B` rate, plus a collapsible breakdown: network fee, price impact,
  minimum received.
- Slippage popover with 0.1 / 0.5 / 1.0 presets and a custom value that really
  moves the minimum-received number.
- Token picker with debounced search (prefix matches ranked first), popular-token
  chips, `↑`/`↓`/`Enter` navigation, and a bottom-sheet layout under 640px.
- Dark / light theme, persisted to `localStorage` under `swap:theme`.

**Validation**

Checked in priority order, only the highest-priority message shown, always
directly under the field it belongs to:

| # | Condition | Button |
| --- | --- | --- |
| 1 | No token on one side | `Select a token`, disabled |
| 2 | Empty or `0` | `Enter an amount`, disabled |
| 3 | Not a number | `Enter an amount`, disabled |
| 4 | `amount <= 0` | `Enter an amount`, disabled |
| 5 | Over balance | `Insufficient balance`, disabled |
| 6 | Price impact > 5% | `Swap anyway`, enabled, amber |
| 7 | Valid | `Swap`, enabled |

Typing and pasting run through the same sanitiser: digits only, one decimal
separator, at most 8 fractional digits, `1,234.56` normalised to `1234.56` and a
lone `0,5` read as `0.5`. Choosing the token already used on the other side swaps
the pair instead of raising an error.

**Transactions**

- `idle → confirming → pending → success | error`, with retry from error.
- The confirmation dialog carries the full summary; while pending, every input and
  picker is locked and the dialog refuses `Escape` and backdrop clicks.
- Success fires one confetti burst, shows a copyable truncated hash, and settles
  the mock balances — the source token goes down, the destination goes up.
- Errors are typed: `SLIPPAGE` (50%), `NETWORK` (35%), `REJECTED` (15%).
- Double-submitting is impossible: the guard is a committed state flag, not a
  debounce.

---

## 3. Technical decisions

- **Hand-rolled `useSwapForm` instead of React Hook Form + Zod.** The form has two
  fields and one of them is always derived. A schema library would add bundle
  weight to validate a single number and would fight the two-way calculation,
  which needs the *raw* value while the field shows a rounded one.
- **One source of truth: `{ activeSide, rawInput }`.** Storing both amounts lets
  them drift apart the moment a price ticks or a token changes. The inactive field
  is recomputed on every render from the active one, so the two numbers can never
  disagree. Focusing a derived field hands it the raw value and makes it active.
- **`lib/` never imports React.** Every formula — conversion, rate, fee, minimum
  received, price impact, formatting, balances — is a pure function testable
  without rendering. `swap.test.ts` covers round-trip conversion, division by
  zero, `1e-9` inputs, minimum received at 0.5% slippage, and the 15% impact cap.
- **Tabular mono for every number.** Digits keep their column as values change, so
  amounts do not shimmer while you type. It is the cheapest thing that makes a
  financial interface read as deliberate.
- **`sessionStorage` cache, not a fetch library.** One endpoint, no mutations, no
  pagination — a 40-line hook with retry and a TTL does the job that TanStack Query
  would do at 30× the bundle cost. Stale data still renders while it revalidates,
  because an empty card is worse than a slightly old price.
- **Colour tokens, never hex in components.** Two documented additions to the
  spec's palette: `--accent-fg` / `--warning-fg` for accent-coloured *small text*,
  and `--accent-ink` / `--warning-ink` for text sitting on those fills. Light-mode
  gold at #C77A16 only reaches 3.2:1 as text; the darker tones clear 4.5:1 while
  the fills stay exactly as specified.

Two deliberate deviations, both documented in code:

- `getMockBalance(symbol, price)` takes the price as an argument — the spec's
  one-argument signature cannot divide a USD notional by a price it does not have.
- Mock balances are hashed into $50–$250,000 rather than $50–$25,000. With
  `MOCK_LIQUIDITY_USD = $2,000,000` a $25k order tops out at 1.2% price impact, so
  the "> 5% impact" row of the validation table would be unreachable — the
  insufficient-balance rule outranks it.

---

## 4. What's mocked

Prices are real, fetched live from the Switcheo endpoint. Everything else is
simulated: wallet balances (hashed from the symbol so they are stable), the
transaction itself (a 1.4–2.6s timer), the 0.3% fee, the price impact (against
$2M of assumed liquidity), and the transaction hash.

The **15% failure rate is deliberate**. It is there so the error states are
reachable in a demo — swap a handful of times and you will see the slippage,
network, and rejection paths, each with its own retry.

No wallet is connected, nothing is signed, and no transaction touches a chain.

---

## 5. With more time

- **Real quotes.** The price-impact curve is a made-up hyperbola. A real
  implementation would quote against pool reserves and split routes across pairs.
- **More tests.** Only `lib/swap.ts` is covered. `normalizeTokens`, the input
  sanitiser, and `useSwapForm`'s validation ordering deserve tests too — they hold
  the trickiest edge cases in the app.
- **Persisted history.** A recent-swaps list, recent tokens in the picker, and a
  URL that encodes the pair so a swap can be shared as a link.
