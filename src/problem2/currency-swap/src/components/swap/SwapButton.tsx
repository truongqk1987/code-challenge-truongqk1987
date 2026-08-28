import { Button } from '../ui/Button'

interface SwapButtonProps {
  label: string
  disabled: boolean
  tone: 'accent' | 'warning'
  isPending: boolean
  onClick: () => void
}

/**
 * One button, every state. It keeps a fixed height so nothing below it moves
 * when the label changes from "Enter an amount" to "Swap".
 */
export function SwapButton({ label, disabled, tone, isPending, onClick }: SwapButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      fullWidth
      variant={tone === 'warning' ? 'warning' : 'primary'}
      disabled={disabled || isPending}
      isLoading={isPending}
      onClick={onClick}
      className="text-base font-semibold"
    >
      {isPending ? 'Processing transaction…' : label}
    </Button>
  )
}
