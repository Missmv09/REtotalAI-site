import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

const cn = (...classes: Array<string | undefined | null | false>) =>
  classes.filter(Boolean).join(' ')

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50'

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(baseStyles, className)} {...props} />
  )
)

Button.displayName = 'Button'

export default Button
