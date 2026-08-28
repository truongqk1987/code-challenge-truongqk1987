import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'

interface SwitchDirectionButtonProps {
  onClick: () => void
  disabled?: boolean
  /** Drives the 180° flip — one increment per press. */
  turns: number
}

export function SwitchDirectionButton({ onClick, disabled, turns }: SwitchDirectionButtonProps) {
  const reduceMotion = useReducedMotion()

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Switch direction"
      className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-raised text-text shadow-lg transition-colors hover:border-accent hover:text-accent-fg disabled:cursor-not-allowed disabled:opacity-60"
    >
      <motion.span
        animate={{ rotate: reduceMotion ? 0 : turns * 180 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 400, damping: 25 }
        }
        className="inline-flex"
      >
        <ArrowUpDown className="size-4" aria-hidden="true" />
      </motion.span>
    </button>
  )
}
