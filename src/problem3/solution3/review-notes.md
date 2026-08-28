# Code Review Notes: WalletPage

Hey, I took a look at the `WalletPage` component and found a few issues, mostly around performance, missing types, and some logic bugs. I've refactored it, but here is a quick breakdown of what I changed and why:

### 1. Performance & Re-renders
*   **useMemo dependency:** `prices` was included in the `useMemo` dependency array for `sortedBalances`, but it wasn't actually being used inside the hook's logic. This means the list was re-sorting/filtering every single time the price updated, which is a huge waste. I removed it.
*   **Redundant array mapping:** We were looping over `sortedBalances` to create `formattedBalances`, but then totally ignoring it and looping over `sortedBalances` *again* to create the UI rows. Plus, in that second loop, it was trying to grab `balance.formatted` which would just be `undefined`. I scrapped the middle step and formatted the amounts directly during the render loop.
*   **getPriority function:** This was declared inside the component, so it was getting re-allocated in memory on every render. I just moved it outside since it doesn't depend on any React state anyway.

### 2. Bugs & Logic
*   **Index as Key:** The `WalletRow` was using `index` as its `key` prop. Since this list gets filtered and sorted dynamically, using the index can cause weird UI rendering bugs. Swapped it to use a unique identifier (`balance.currency`).
*   **Filter logic typo:** The filter was checking `if (balance.amount <= 0)`. I'm assuming we want to display wallets with actual funds in them, so I flipped this to `> 0`.
*   **Undefined variable:** There was a check for `if (lhsPriority > -99)`, but `lhsPriority` didn't exist. Changed it to `balancePriority`.

### 3. TypeScript & Architecture
*   **Decoupling UI Library:** The original code had `interface Props extends BoxProps {}` but no import for `BoxProps` (likely assuming Material-UI). Instead of forcing a third-party dependency just for a `div` wrapper, I created a local `BoxProps` interface that extends `React.HTMLAttributes<HTMLDivElement>`. This keeps the original API signature intact but makes the component fully decoupled and independent.
*   **Missing Interface Properties:** `WalletBalance` was missing the `blockchain` prop entirely, causing TS errors when accessing `balance.blockchain`. Added it.
*   **Strict Typing:** `getPriority` was accepting `blockchain: any`. Updated it to `string`.
*   **Missing Hooks/Components:** Added `declare` statements at the top for `useWalletBalances`, `usePrices`, and `WalletRow` just to mock them so the file compiles perfectly (100% type-safe) without throwing "Cannot find name" errors in isolation.
*   **Undeclared Styles (`classes.row`):** The `WalletRow` component was using `classes.row`, but `classes` was never imported (e.g., from a CSS Module). I commented it out to prevent runtime/compile errors.