import { createContext, useContext } from 'react'
import type { Size } from '../types'

/** What a Field tells the one control inside it. Facts flow down only. */
export interface FieldContextValue {
  /** The control's id. <label for> points here. */
  id: string
  /** For a control that names itself with aria-labelledby (NumberField's unit, a button-based Combobox). */
  labelId: string
  /** Field's description ids, in reading order, or undefined. A control puts its own ids first. */
  describedBy: string | undefined
  /** Field has an app error. */
  invalid: boolean
  required: boolean
  disabled: boolean
  readOnly: boolean
  size: Size | undefined
}

export const FieldContext = createContext<FieldContextValue | null>(null)

/**
 * The Field around this control, or null outside one.
 *
 * It is what lets any control — Input and NumberField now, Select,
 * Textarea and Combobox next, an app's own control today — sit in a
 * Field unchanged. The contract a control follows:
 *
 * - Use `field.id` as the focusable element's id. An `id` prop given
 *   inside a Field is ignored, with a warning in development.
 * - Set `aria-describedby` to the control's own ids (its problem
 *   message, then the app's own `aria-describedby`), followed by
 *   `field.describedBy`, joined with `joinIds`.
 * - Combine `required`, `disabled` and `readOnly` with OR between the
 *   control's prop and the Field's. Native elements take the native
 *   attributes; ARIA widgets take `aria-required`, `aria-disabled` and
 *   `aria-readonly`.
 * - Set `aria-invalid="true"` when its `invalid` prop is set, when
 *   `field.invalid` is true, or when the control has a problem of its own.
 * - Stamp `data-empty` on its box (the element directly inside
 *   `.lcf-field-control`) while it is empty, computed during render.
 *   Without it the Field never shows "required and empty": Field reads
 *   emptiness only from that attribute, by CSS, so nothing travels up.
 * - Read `--fld-value-fg` and `--fld-value-style` on the value text:
 *   that is how a suggested value turns grey and italic.
 * - Size: the control's own `size` prop wins, then `field.size`, then `'md'`.
 * - Inside a Field only: `data-color="caution"` on the box while
 *   required, empty and not invalid; `data-color="danger"` while invalid.
 *
 * Never build a CSS selector from these ids: a React 19 useId id is not
 * a valid selector. Use getElementById or a ref.
 */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext)
}
