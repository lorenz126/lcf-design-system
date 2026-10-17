import { clsx } from 'clsx'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode
} from 'react'
import { useMessages } from '../../i18n/context'
import { FieldContext, markFieldGroup, useField } from '../Field/context'
import { joinIds } from '../Field/ids'
import { resolveControl, useControlChecks } from '../Input/InputFrame'
import { mergeRefs } from '../refs'
import type { Size } from '../types'
import { CheckboxGroupContext, type CheckboxGroupContextValue } from './group'

export interface CheckboxGroupProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'defaultValue' | 'name' | 'children'> {
  /** The chosen boxes' `value`s, in the order the boxes are rendered. Controlled. */
  value?: string[]
  /** Uncontrolled. Default []. A form reset goes back to it. */
  defaultValue?: string[]
  /** The new list, in the order the boxes are rendered, on every tick and clear. */
  onValueChange?: (value: string[]) => void
  /** Posted by each chosen box, once per box: read it with `FormData.getAll(name)`. */
  name?: string
  /** Every box's size unless a box sets its own. Inside a Field, the Field's size unless set here. Default 'md'. */
  size?: Size
  /** Every box shows the danger edge. Inside a Field, Field's `error` sets it. Default false. */
  invalid?: boolean
  /** At least one box. Put it on the Field inside one. Default false. */
  required?: boolean
  /** Disables the fieldset, and so every box in it. Put it on the Field inside one. Default false. */
  disabled?: boolean
  /** No box changes. Put it on the Field inside one. Default false. */
  readOnly?: boolean
  /** Checkboxes, each with its `value`; anything else may sit between them. */
  children: ReactNode
}

const warn = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.warn(`[lcf] ${msg}`)
}

/**
 * CheckboxGroup — several Checkboxes as one value: a `<fieldset>`, and the one control a Field holds.
 *
 * - **The value is the list of chosen `value`s, in the order the boxes
 *   are rendered**, not the order they were clicked, so an app compares
 *   it with its suggestion element by element. Each chosen box posts
 *   `name=value` itself, natively (`FormData.getAll(name)`); a disabled
 *   box posts nothing, as native.
 * - **In a Field, the Field's label names it and the Field's words
 *   describe it** — on the fieldset, so state, origin, "Enter
 *   bestätigt." and the description are said once as focus enters the
 *   group, not again on every box. The Field's context stops at the
 *   group: what is inside belongs to the group, so an Input for "other"
 *   between the boxes does not take the Field's id. One exception: the
 *   Field's error also describes every box. Found in review, an AX
 *   snapshot showed boxes with invalid=true and an empty description —
 *   a box reached by Shift+Tab or the virtual cursor said "invalid" with
 *   no reason. Only the error: state, keys and origin stay said once.
 *   The fieldset carries no `aria-invalid`: ARIA 1.2 does not support it
 *   on role group, so the boxes say it.
 * - **`required` means at least one.** Native `required` on a checkbox
 *   means THAT box must be ticked. So the group sets a custom validity
 *   on its first box while nothing is chosen ("Bitte mindestens eine
 *   Option wählen.", from the table): the form's own check stops the
 *   submit and points at the group, a Field's confirm is refused with
 *   that sentence, and a form with `noValidate` still saves a draft. A
 *   group has no attribute a screen reader reads as required, so
 *   "Pflichtfeld." is the first sentence of its description.
 * - **A Tab stop per box**, as checkboxes have, and Space ticks. In a
 *   confirmable Field, Enter in any box confirms and Escape goes back to
 *   the suggestion. Enter in an "other" Input or a Select between the
 *   boxes confirms too and never submits the form (Ctrl+Enter in a
 *   Textarea); Escape there is that control's own and reverts nothing.
 * - **Disabled is the fieldset's own**, so the browser disables every
 *   box in it, and a disabled box posts nothing.
 * - **Refuses:**
 *   - a label, description or error of its own (Field's; outside a
 *     Field, `aria-label` or `aria-labelledby`);
 *   - native `required` on its boxes;
 *   - a count beyond "at least one" (an app's rule, said in Field's
 *     `error`);
 *   - a horizontal row of boxes (not asked for yet);
 *   - one of many (that is a radio group, with one Tab stop).
 */
export function CheckboxGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  name,
  size: sizeProp,
  invalid: invalidProp = false,
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  id: idProp,
  className,
  children,
  ref,
  ...rest
}: CheckboxGroupProps) {
  const field = useField()
  const t = useMessages()
  const auto = useId()
  const id = field?.id ?? idProp ?? auto
  const root = useRef<HTMLFieldSetElement | null>(null)
  const setRef = useMemo(() => mergeRefs(root, ref), [ref])

  const { size, required, disabled, readOnly } = resolveControl(field, {
    size: sizeProp, required: requiredProp, disabled: disabledProp, readOnly: readOnlyProp
  })
  const controlled = valueProp !== undefined
  const [inner, setInner] = useState<string[]>(() => defaultValue ?? [])
  const value = controlled ? valueProp : inner
  // Worked out during render, so the Field's "required and empty" is
  // right on the first paint and on the server.
  const empty = value.length === 0
  const invalid = !!(invalidProp || field?.invalid)
  // Caution only from the Field's required, which draws the word beside it.
  const caution = !invalid && !!field?.required && empty

  /* The boxes' own values, in the order they are rendered, read when one
     changes: the emitted list follows the page, not the clicks. Values
     with no box are kept, after them. */
  const toggle = (option: string, on: boolean) => {
    if (value.includes(option) === on) return
    const next = on ? [...value, option] : value.filter(v => v !== option)
    const order = [...(root.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? [])].map(i => i.value)
    const rank = (v: string) => {
      const i = order.indexOf(v)
      return i < 0 ? order.length : i
    }
    next.sort((a, b) => rank(a) - rank(b))
    if (!controlled) setInner(next)
    onValueChange?.(next)
  }

  // A new object every render: the boxes are context consumers, so a
  // reset that re-renders only the group still reaches every box.
  const context: CheckboxGroupContextValue = { value, toggle, name, size, invalid, errorId: field?.errorId, caution, disabled, readOnly }

  /* The form agrees with the group: while a required group has nothing
     chosen, its first box that can take a value says so, in the table's
     words. Every render, because the first box is whichever renders
     first now. */
  const message = required && empty ? t('chooseAtLeastOne') : ''
  useLayoutEffect(() => {
    const boxes = [...(root.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? [])]
    const first = boxes.find(b => !b.disabled)
    for (const b of boxes) b.setCustomValidity(b === first ? message : '')
  })

  // A form reset puts the boxes back without a change event.
  useEffect(() => {
    const form = root.current?.form
    if (!form) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onReset = () => {
      // The reset event fires BEFORE the boxes change; act after it.
      timer = setTimeout(() => {
        // A new array either way: the re-render is what puts the value
        // back on the boxes, the app's own when controlled.
        setInner(v => (controlled ? [...v] : [...(defaultValue ?? [])]))
      }, 0)
    }
    form.addEventListener('reset', onReset)
    return () => {
      form.removeEventListener('reset', onReset)
      clearTimeout(timer)
    }
  }, [controlled, defaultValue])

  // Development only, and enforced: the sweep fails on console warnings.
  const ariaLabelledBy = rest['aria-labelledby']
  useControlChecks('CheckboxGroup', field, root, {
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    ariaLabel: rest['aria-label'],
    ariaLabelledBy
  })
  const labelId = field?.labelId
  useEffect(() => {
    if (!labelId) return
    const label = root.current?.ownerDocument.getElementById(labelId)
    if (label instanceof HTMLLabelElement && label.htmlFor === id) {
      warn("a CheckboxGroup wrapped in another component inside a Field: make it the Field's own child, so the Field's label names the group and points at no box.")
    }
  }, [labelId, id])

  const requiredId = required ? `${id}-required` : undefined
  const requiredText = t('required')

  return (
    <fieldset
      {...rest}
      ref={setRef}
      id={id}
      className={clsx('lcf-checkbox-group', className)}
      data-size={size}
      data-empty={empty || undefined}
      data-color={invalid ? 'danger' : caution ? 'caution' : undefined}
      data-readonly={readOnly || undefined}
      disabled={disabled}
      aria-labelledby={joinIds(field?.labelId, ariaLabelledBy)}
      aria-describedby={joinIds(requiredId, rest['aria-describedby'], field?.describedBy)}
    >
      {/* Description-only: `hidden`, read through aria-describedby. */}
      {requiredId && (
        <span id={requiredId} hidden lang={t.lang('required')}>
          {requiredText + (/[.!?…:;]$/.test(requiredText) ? '' : '.')}
        </span>
      )}
      <FieldContext.Provider value={null}>
        <CheckboxGroupContext.Provider value={context}>{children}</CheckboxGroupContext.Provider>
      </FieldContext.Provider>
    </fieldset>
  )
}
// So a Field around it labels the group, and points its label at no box.
markFieldGroup(CheckboxGroup)
