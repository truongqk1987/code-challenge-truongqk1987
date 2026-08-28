import { SwapCard } from './components/swap/SwapCard'
import { ThemeProvider } from './hooks/useTheme'
import { ThemeToggle } from './components/ui/ThemeToggle'

export default function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <span className="font-display text-base tracking-tight">
            Ink<span className="text-accent-fg">&</span>Gold
          </span>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-10">
          <h1 className="sr-only">Currency swap</h1>
          <SwapCard />
        </main>

        <footer className="px-4 pb-6 text-center text-[11px] text-muted">
          Live prices from Switcheo. Balances and transactions are simulated.
        </footer>
      </div>
    </ThemeProvider>
  )
}
