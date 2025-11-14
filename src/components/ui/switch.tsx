import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

const cn = (...classes: Array<string | undefined | null | false>) =>
  classes.filter(Boolean).join(' ')

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  className?: string
  onCheckedChange?: (checked: boolean) => void
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    { className, onCheckedChange, disabled, checked, defaultChecked, onChange, ...rest },
    ref
  ) => (
    <label
      className={cn(
        'relative inline-flex h-6 w-11 cursor-pointer items-center',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        disabled={disabled}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(event) => {
          onCheckedChange?.(event.target.checked)
          onChange?.(event)
        }}
        {...rest}
      />
      <span className="absolute inset-0 rounded-full bg-neutral-300 transition peer-checked:bg-black" />
      <span className="relative h-5 w-5 translate-x-1 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </label>
  )
)

Switch.displayName = 'Switch'

export default Switch
