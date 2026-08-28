import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'

interface RollingNumberProps {
  value: string
  className?: string
}

/**
 * The signature detail: digits roll vertically instead of snapping when the
 * receive amount changes. Under `prefers-reduced-motion` the value is swapped
 * in plainly — no springs, no slide.
 */
export function RollingNumber({ value, className }: RollingNumberProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <span className={className}>{value}</span>
  }

  return (
    <span className={cn('inline-flex overflow-hidden', className)} aria-label={value}>
      {value.split('').map((char, index) => (
        <span key={`${index}-${char}`} className="relative inline-block">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={char}
              initial={{ y: '-70%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '70%', opacity: 0 }}
              transition={{ duration: 0.22, delay: index * 0.015, ease: 'easeOut' }}
              className="inline-block"
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}
