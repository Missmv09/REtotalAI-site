import { forwardRef } from 'react'
import type { LabelHTMLAttributes } from 'react'

const cn = (...classes: Array<string | undefined | null | false>) =>
  classes.filter(Boolean).join(' ')

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('text-sm font-medium text-neutral-700', className)} {...props} />
  )
)

Label.displayName = 'Label'

export default Label
