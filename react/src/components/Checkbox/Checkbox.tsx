import { clsx } from 'clsx'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode
} from 'react'
import { useField } from '../Field/context'
import { joinIds } from '../Field/ids'
import { mergeRefs } from '../refs'
import type { Size } from '../types'
import { useCheckboxGroup } from './group'

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size' | 'value' | 'children'> {
  /** The box's name, beside it and after it; clicking it ticks the box. Without one, give `aria-label` or `aria-labelledby` (a table row's box names itself by the row). */
  label?: ReactNode
  /** Guidance under the label, read after the name (`aria-describedby`). */
  description?: ReactNode
  /** Controlled. In a CheckboxGroup a box with a `value` takes it from the group instead. */
  checked?: boolean
  /** Uncontrolled. Default false. */
  defaultChecked?: boolean
  /** The new state, after the click or Space. Native `onChange` is passed through as well. */
  onCheckedChange?: (checked: boolean) => void
  /** Neither ticked nor clear: a parent of partly chosen children. Shown, never decided — the app derives it. A click clears it and emits the next `checked`. Default false. */
  indeterminate?: boolean
  /** The danger edge and `aria-invalid`. Shown, never decided. In a CheckboxGroup, the group's `invalid` and its Field's error set it too. Default false. */
  invalid?: boolean
  /** The box and the label's text: 14, 16 or 20px on the 13, 15 and 17px type steps. In a CheckboxGroup, the group's size unless set here. Default 'md'. */
  size?: Size
  /** What the box posts under `name`, and in a CheckboxGroup what it adds to the group's value. Default 'on', as native. */
  value?: string
}

const warn = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.warn(`[lcf] ${msg}`)
}

const hasContent = (n: ReactNode) => n !== undefined && n !== null && n !== false && n !== ''

/**
 * Checkbox — a real `<input type="checkbox">` with its label beside it.
 *
 * - **Native, not Radix.** `appearance: none` on the input itself, so
 *   the space bar, form submission (`name`, `value`, `form`, reset),
 *   `<label for>`, `required` and the checkbox role all come from the
 *   browser. Radix's Checkbox is a `<button role="checkbox">` that puts
 *   a hidden input back for forms: it rebuilds those four, and carries
 *   no behaviour here that would otherwise be written by hand.
 *   `indeterminate` is the DOM property, which the accessibility tree
 *   reports as "mixed"; it has no attribute, so a server render shows
 *   the box clear until hydration.
 * - **Every attribute goes to the `<input>`** — `aria-label`, `name`,
 *   `required`, `form`, `data-*`, `ref`. Only `className` and `style`
 *   sit on the row. The Nuxt 0.2.0 breaking change: on the wrapper, an
 *   `aria-label` named nothing, and a column of table checkboxes was
 *   read as "checkbox, checkbox, checkbox" with no way to fix it from
 *   outside.
 * - **The label sits beside the box, after it, and is not Field's.** A
 *   stacked label above a box that comes first is a wrapper with a hole
 *   in it (the Nuxt finding), so a lone Checkbox is not put in a Field.
 *   In a Field it goes in a **CheckboxGroup** — of one, if need be: the
 *   Field's label names the group, each Checkbox's label names its box,
 *   and the group takes the Field's state, origin, words and
 *   `required`. The label's cell reaches back over the gap, so the
 *   whole first line ticks the box; the description does not, so it can
 *   be selected.
 * - **An unchecked box is found by its edge alone**, so the edge is
 *   held to 3:1 under WCAG 1.4.11: `--border-field`, 3.41:1 light and
 *   3.66:1 dark, where the Nuxt box drew `--border-strong` at 1.48:1.
 *   Checked, the box is the primary solid, `--accent-solid-bg`, with
 *   the tick in its on-solid colour.
 * - **The tick is drawn on a 10px grid**, not Lucide's Check. Measured
 *   in the Nuxt layer: Lucide draws on a 24px viewBox, and at 10px its
 *   stroke resolved to 0.73px, a grey smudge. This path is 1.8 units on
 *   10, so 1.44px at sm and 2.16px at lg.
 * - **Invalid is the danger edge, doubled**, as Input's, and fills a
 *   ticked box danger; in a required group with nothing chosen every box
 *   takes the caution edge beside the Field's "Pflichtfeld".
 * - **Suggested, a ticked box's label is grey and italic** (Field's
 *   `--fld-value-*`, as a text field's value): in a group the value is
 *   which labels are ticked. The box stays filled, so a suggested tick
 *   never reads as no tick.
 * - **Read-only is not native** — a checkbox ignores `readonly` — so it
 *   is `aria-readonly` and a click that changes nothing.
 * - **Refuses:**
 *   - a `color` (ticked is the app's colour, invalid is danger: a
 *     checkbox does not pick a meaning);
 *   - a button or a `<div>` drawn as a checkbox;
 *   - a label above the box, and a Field around a lone box;
 *   - a label before the box (the SDK's `orientation`): the box comes
 *     first, so a column of boxes lines up on one edge whatever the
 *     labels' lengths;
 *   - being a switch (a setting that applies at once is Switch);
 *   - deciding `indeterminate`;
 *   - an error sentence of its own (a group's Field has `error`; a lone
 *     box points `aria-describedby` at the app's words).
 */
export function Checkbox({
  label,
  description,
  checked: checkedProp,
  defaultChecked,
  onCheckedChange,
  onChange,
  indeterminate = false,
  invalid: invalidProp = false,
  size: sizeProp,
  value,
  id: idProp,
  name,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  className,
  style,
  ref,
  ...rest
}: CheckboxProps) {
  const group = useCheckboxGroup()
  // A CheckboxGroup hides its Field from what is inside it, so a Field
  // seen here is one around this box alone.
  const field = useField()
  const auto = useId()
  const id = idProp ?? auto
  const inner = useRef<HTMLInputElement | null>(null)
  const setRef = useMemo(() => mergeRefs(inner, ref), [ref])

  // A box with a value is one of the group's options; one without (a
  // "select all" above them) keeps its own checked.
  const member = !!group && value !== undefined
  const checked = group && value !== undefined ? group.value.includes(value) : checkedProp
  const size = sizeProp ?? group?.size ?? 'md'
  const disabled = !!(disabledProp || group?.disabled)
  const readOnly = !!(readOnlyProp || group?.readOnly)
  const ariaInvalid = rest['aria-invalid']
  const invalid = !!(invalidProp || group?.invalid || ariaInvalid === true || ariaInvalid === 'true')
  const color = invalid ? 'danger' : group?.caution ? 'caution' : 'primary'

  const hasLabel = hasContent(label)
  const descriptionId = hasContent(description) ? `${id}-description` : undefined

  /* A DOM property, not an attribute: set on every render, so the box
     shows what the prop says even after a click cleared it. */
  useLayoutEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate
  })

  const ariaLabel = rest['aria-label']
  const ariaLabelledBy = rest['aria-labelledby']
  // Development only, and enforced: the sweep fails on console warnings.
  useEffect(() => {
    if (hasLabel || ariaLabel || ariaLabelledBy) return
    if ((inner.current?.labels?.length ?? 0) > 0) return
    warn('Checkbox has no name: give it a label, or aria-label or aria-labelledby (a table row\'s box can name itself by the row).')
  }, [hasLabel, ariaLabel, ariaLabelledBy])
  const inField = !!field
  useEffect(() => {
    if (inField) warn('a Checkbox directly in a Field: put it in a CheckboxGroup, so the Field\'s label names the group and the Checkbox\'s label names the box.')
  }, [inField])
  const stray = !!group && value === undefined && checkedProp === undefined
  useEffect(() => {
    if (stray) warn('a Checkbox in a CheckboxGroup with neither `value` nor `checked`: give it the `value` it adds to the group.')
  }, [stray])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    // The click cleared it; the prop still decides.
    el.indeterminate = indeterminate
    /* Read-only: put the box back here, through the `checked` setter,
       not by preventDefault on the click. React reads a checkbox's
       change from the click itself, so a prevented click still called
       onChange (measured), and the browser's own undo after it bypasses
       the setter React tracks the box's state through. */
    if (readOnly) {
      el.checked = !el.checked
      return
    }
    onChange?.(e)
    if (group && value !== undefined) group.toggle(value, el.checked)
    onCheckedChange?.(el.checked)
  }

  return (
    <div
      className={clsx('lcf-checkbox', className)}
      style={style}
      data-size={size}
      data-color={color}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      <input
        {...rest}
        ref={setRef}
        id={id}
        type="checkbox"
        className="lcf-checkbox-input"
        name={member ? group?.name ?? name : name}
        value={value}
        checked={checked}
        defaultChecked={member ? undefined : defaultChecked}
        disabled={disabled}
        aria-readonly={readOnly || undefined}
        // Always written: with no attribute, Chrome reports the native
        // validity — a required group's first box carries a custom
        // validity while nothing is chosen, and the screen shows no error.
        aria-invalid={invalid ? 'true' : 'false'}
        aria-describedby={joinIds(descriptionId, rest['aria-describedby'])}
        onChange={handleChange}
      />
      <svg className="lcf-checkbox-mark" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
        <path className="lcf-checkbox-tick" d="M1.5 5.2l2.2 2.3L8.5 2.8" />
        <path className="lcf-checkbox-dash" d="M2 5h6" />
      </svg>
      {hasLabel && <label className="lcf-checkbox-label" htmlFor={id}>{label}</label>}
      {descriptionId && <div id={descriptionId} className="lcf-checkbox-description">{description}</div>}
    </div>
  )
}
