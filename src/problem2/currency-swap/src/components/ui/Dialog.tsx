import { Dialog as HDialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** `false` while a transaction is pending: no Escape, no backdrop click. */
  dismissible?: boolean
  children: ReactNode
  className?: string
  /** Bottom sheets grow from the bottom edge; centred modals fade + scale. */
  initialFocus?: React.RefObject<HTMLElement | null>
}

const noop = () => {}

/**
 * One dialog shell for the whole app. Headless UI gives us the focus trap,
 * Escape handling and scroll lock; the responsive half — bottom sheet under
 * 640px, centred modal above — lives in the classes below.
 */
export function Dialog({
  open,
  onClose,
  title,
  dismissible = true,
  children,
  className,
  initialFocus,
}: DialogProps) {
  return (
    <HDialog
      open={open}
      onClose={dismissible ? onClose : noop}
      initialFocus={initialFocus}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm',
          'transition-opacity duration-[180ms] ease-out data-closed:opacity-0',
        )}
      />

      <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <DialogPanel
          transition
          className={cn(
            'flex max-h-[88dvh] w-full flex-col overflow-hidden border border-border bg-surface text-text shadow-2xl',
            'rounded-t-3xl pb-[env(safe-area-inset-bottom)] sm:max-w-[420px] sm:rounded-3xl sm:pb-0',
            'transition duration-[180ms] ease-out',
            'data-closed:translate-y-full data-closed:opacity-0',
            'sm:data-closed:translate-y-0 sm:data-closed:scale-[0.96]',
            className,
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
            <DialogTitle className="font-display text-lg leading-none">{title}</DialogTitle>
            {dismissible ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1 text-muted transition-colors hover:bg-raised hover:text-text"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </header>
          {children}
        </DialogPanel>
      </div>
    </HDialog>
  )
}
