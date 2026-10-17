import { createContext, isValidElement, useContext, type ReactNode } from 'react'
import type { Size } from '../types'

/** What a Field tells the one control inside it. Facts flow down only. */
export interface FieldContextValue {
  /** The control's id. <label for> points here. */
  id: string
  /** For a control that names itself with aria-labelledby (NumberField's unit, a button-based Combobox). */
  labelId: string
  /** Field's description ids, in reading order, or undefined. A control puts its own ids first. */
  describedBy: string | undefined
  /** The same ids for a control where Enter is a new line (Textarea): its confirm sentence says Ctrl+Enter. */
  describedByMultiline: string | undefined
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
 * It is what lets any control — Input, NumberField, Select and Textarea
 * now, Combobox next, an app's own control today — sit in a
 * Field unchanged. The contract a control follows:
 *
 * - Use `field.id` as the focusable element's id. An `id` prop given
 *   inside a Field is ignored, with a warning in development.
 * - Set `aria-describedby` to the control's own ids (its problem
 *   message, then the app's own `aria-describedby`), followed by
 *   `field.describedBy`, joined with `joinIds` (exported beside
 *   `useField`). A `<textarea>` takes `field.describedByMultiline`
 *   instead: there Ctrl+Enter confirms, and the sentence says so.
 * - `required`, `disabled` and `readOnly` belong on the Field: it owns
 *   the word, the asterisk and the actions. Combine them with OR between
 *   the control's prop and the Field's so the native attribute is right
 *   either way, but draw "required and empty" from `field.required`
 *   only. Native elements take the native attributes; ARIA widgets take
 *   `aria-required`, `aria-disabled` and `aria-readonly`.
 * - Write `aria-invalid` always, as `"true"` or `"false"`: `"true"` when
 *   its `invalid` prop is set, when `field.invalid` is true, or when the
 *   control has a problem of its own. With no attribute, Chrome reports
 *   the native validity, and a screen reader hears "invalid" where the
 *   screen shows no words.
 * - A problem of its own goes to `setCustomValidity` as well, in words:
 *   a confirm reads the control's `validity` and refuses a value the
 *   control calls wrong, saying the `validationMessage` instead.
 * - Stamp `data-empty` on its box — the element directly inside
 *   `.lcf-field-control` — while it is empty, computed during render.
 *   Without it the Field never shows "required and empty": Field reads
 *   emptiness only from that attribute, by CSS, so nothing travels up.
 *   Only that element counts, so an empty part deeper inside (a list
 *   with no options) does not.
 * - Stamp `data-dirty` on the same box while it holds text it could not
 *   commit: such text is the person's, and is never drawn as the
 *   suggestion.
 * - Spend Enter and Escape on itself only by calling `preventDefault`
 *   (and, for Escape, `stopPropagation`). An unprevented Enter confirms
 *   (Ctrl+Enter or ⌘ Enter in a `<textarea>`);
 *   an unprevented Escape goes back to the suggestion while there is
 *   one (`onRevert`).
 * - Read `--fld-value-fg` and `--fld-value-style` on the value text:
 *   that is how a suggested value turns grey and italic.
 * - Size: the control's own `size` prop wins, then `field.size`, then `'md'`.
 * - Inside a Field only: `data-color="caution"` on the box while the
 *   Field is required, the control empty and not invalid;
 *   `data-color="danger"` while invalid.
 * - A GROUP of controls (CheckboxGroup) is one control: `field.id` on
 *   its `<fieldset>`, named by `aria-labelledby={field.labelId}` and
 *   described by `field.describedBy`; it hides the Field from what is
 *   inside it (each member is the group's, not the Field's). Enter and
 *   Escape in any member act for the field, and a confirm reads the
 *   members' validity — a fieldset's own stays valid while a member's
 *   is not (measured in Chromium).
 *
 * Never build a CSS selector from these ids: a React 19 useId id is not
 * a valid selector. Use getElementById or a ref.
 */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext)
}

/* A group control, marked on its component, so that the Field around
   it renders its label without `for`: a <label for> pointing at a
   fieldset labels nothing and is not valid HTML, and pointed at the
   first member instead it would toggle that member when the group's
   name is clicked. Read at render from the element Field is given — no
   value travels up — so it holds only for the group as Field's own
   child; CheckboxGroup warns when it is wrapped. Internal: an app's own
   group control is not offered this yet. Symbol.for, so two copies of
   the module still agree. */
const GROUP = Symbol.for('lcf.field.group')

/** Internal. Marks a component as a group control for Field. */
export function markFieldGroup<T extends object>(component: T): T {
  ;(component as Record<symbol, unknown>)[GROUP] = true
  return component
}

/** Internal. Whether Field's child is a marked group control. */
export function isFieldGroup(node: ReactNode): boolean {
  return isValidElement(node) && typeof node.type !== 'string' && (node.type as unknown as Record<symbol, unknown>)[GROUP] === true
}

/** Internal. A group's box: Enter and Escape in any member act for the field. */
export const isGroupBox = (el: Element) => el.matches('fieldset, [role="group"], [role="radiogroup"]')
