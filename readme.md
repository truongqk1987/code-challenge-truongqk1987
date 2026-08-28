# 99Tech Code Challenge #1 #

Note that if you fork this repository, your responses may be publicly linked to this repo.  
Please submit your application along with the solutions attached or linked.   

It is important that you minimally attempt the problems, even if you do not arrive at a working solution.

## Submission ##
You can either provide a link to an online repository, attach the solution in your application, or whichever method you prefer.
We're cool as long as we can view your solution without any pain.

---

## Solutions ##

All work lives under `src/`, one folder per problem.

```
src/
├── problem1/   Three ways to sum to n
├── problem2/   Fancy form — Currency Swap (Vite + React + TypeScript)
└── problem3/   Messy React — code review & refactor
```

### `src/problem1` — Three ways to sum to n ###

**`solution1.js`** — three implementations of `sum_to_n(n)`, all returning `1 + 2 + ... + n`:

| Function | Approach | Complexity |
| --- | --- | --- |
| `sum_to_n_a` | Iterative `for` loop | O(n) time, O(1) space |
| `sum_to_n_b` | Closed-form Gauss formula `n(n+1)/2` | O(1) time, O(1) space |
| `sum_to_n_c` | Recursion | O(n) time, O(n) stack |

Documented assumption: `n <= 0` returns `0`.

### `src/problem2` — Currency Swap ###

A token swap interface (Uniswap / PancakeSwap style): pick what you pay, pick what
you receive, and the other side calculates itself. **Prices are real** (fetched from
`interview.switcheo.com/prices.json`); everything behind the swap button is mocked.

- **`plan.md`** — the build specification the app was implemented against: fixed
  filenames, validation rules, colour tokens, and the definition of done.
- **`currency-swap/`** — the app itself, built with Vite + React 18 + TypeScript +
  Tailwind v4. See [`currency-swap/README.md`](src/problem2/currency-swap/README.md)
  for the full write-up of features, technical decisions, and what is mocked.

```bash
cd src/problem2/currency-swap
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run test     # vitest run — the pure swap maths
```

Highlights: live prices with retry + `sessionStorage` cache, two-way amount
calculation from a single source of truth, a seven-rule prioritised validation
table, slippage settings, a keyboard-navigable token picker with debounced search,
a full `idle → confirming → pending → success | error` transaction flow, and dark /
light themes. Pure formulas live in `src/lib/` (no React imports) and are unit
tested in `src/lib/swap.test.ts`.

### `src/problem3` — Messy React ###

A code review of the provided `WalletPage` component, plus a corrected version.

- **`solution3/review-notes.md`** — the review: every issue found, grouped into
  performance & re-renders, bugs & logic, and TypeScript & architecture. Covers the
  unused `prices` dependency in `useMemo`, the discarded `formattedBalances` array,
  `getPriority` being reallocated each render, `index` used as a React `key`, the
  inverted `amount <= 0` filter, the undefined `lhsPriority` variable, the missing
  `blockchain` property, and `blockchain: any`.
- **`solution3/WalletPage.refactored.tsx`** — the refactored component, type-safe in
  isolation (external hooks and `WalletRow` are `declare`d) and decoupled from any UI
  library via a local `BoxProps` extending `React.HTMLAttributes<HTMLDivElement>`.

`package.json` / `tsconfig.json` at the folder root exist only so the refactored file
type-checks on its own.
