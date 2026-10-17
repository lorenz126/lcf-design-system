import { clsx } from 'clsx'
import { ChevronDown, CircleX } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode
} from 'react'
import { useMessages } from '../../i18n/context'
import { useField } from '../Field/context'
import { joinIds } from '../Field/ids'
import { resolveControl, useControlChecks } from '../Input/InputFrame'
import { mergeRefs } from '../refs'
import type { Size } from '../types'

export interface SelectOption<T extends string = string> {
  /** What is stored and posted. Never '' — that is the placeholder's. */
  value: T
  /** What the person reads. Text only: a native option holds no markup. */
  label: string
  /** In the list, not choosable. Default false. */
  disabled?: boolean
}

export interface SelectGroup<T extends string = string> {
  /** The group's heading in the list. It is not a choice. */
  label: string
  options: readonly SelectOption<T>[]
  /** Every option in it. Default false. */
  disabled?: boolean
}

export interface SelectProps<T extends string = string>
  extends Omit<ComponentPropsWithRef<'select'>, 'size' | 'multiple' | 'value' | 'defaultValue' | 'children'> {
  /** The whole list, options and groups, in the order shown. Handed over complete: nothing is loaded or filtered. */
  options: readonly (SelectOption<T> | SelectGroup<T>)[]
  /** The chosen option's value. null is nothing chosen. undefined = uncontrolled. */
  value?: T | null
  /** Default null: nothing is chosen until somebody chooses. */
  defaultValue?: T | null
  /** On every choice, with the option's value, or null for the placeholder. Only when it changed. */
  onValueChange?: (value: T | null) => void
  /** The words in the box while nothing is chosen. Default the table's "Choose…" / "Bitte wählen…". */
  placeholder?: string
  /** Shows the choice, posts it, cannot change it. Default false. Inside a Field, set it on the Field. */
  readOnly?: boolean
  /** 22, 26 or 32px, matching Button and Input. Inside a Field, the Field's size unless set here. Default 'md'. */
  size?: Size
  /** For a field whose words live elsewhere. Inside a Field, Field's `error` sets it; a value the list does not offer sets it too. */
  invalid?: boolean
  /** Full width of its container. Default false. */
  block?: boolean
}

const warn = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.warn(`[lcf] ${msg}`)
}

/**
 * Select — one choice from a list the app hands over whole.
 *
 * - **A native `<select>`: not Radix Select, and not a listbox of our
 *   own.** Weighed against what the offer tool needs:
 *   - *Field.* Enter confirms in a `<select>`, and a confirm reads the
 *     control's `validity`: a required select left on its placeholder
 *     says `valueMissing`, and the confirm says "Pflichtfeld" instead.
 *     Radix's trigger is a `<button>` that opens its list on Enter (its
 *     OPEN_KEYS, read in 2.4.1), and a button is barred from constraint
 *     validation (`willValidate` is false, measured): Field would have
 *     needed a new way in, or confirmed an empty required choice.
 *   - *Forms.* `name`, `required`, `form`, a reset and `FormData` are the
 *     browser's. Radix posts through a hidden native select of its own.
 *   - *Keyboard.* The platform's, typeahead included. Measured in
 *     Chromium on macOS: on a closed select the arrows change nothing (the
 *     platform opens its list), a letter chooses the next option starting
 *     with it, and Enter submits the form — which a confirmable Field
 *     turns into a confirm. Every change is a commit.
 *   - *Mobile and long lists.* The phone's own picker, for three entries
 *     or two hundred (not tried on a device here); grouping is
 *     `<optgroup>`; in a list of 200, a letter jumps to the first
 *     article starting with it (measured).
 *   - *Screen readers.* The pattern every one of them supports: Chromium
 *     reports it as a combobox with its options (measured); no screen
 *     reader was available to this build.
 *   - *The cost:* the open list cannot be styled. Options are text: no
 *     icons, no second line. Radix Select would have bought those (not
 *     search) for 35 KB gzipped (124 KB minified, measured with React
 *     external), a list in a portal on a phone, and the Field contract
 *     reworked around a button; those needs are Combobox's.
 * - **Nothing is chosen until somebody chooses.** The first option is
 *   always the placeholder, value '', and `null` in and out. A select
 *   without one chooses its first option itself — measured: a required
 *   select whose disabled placeholder was not marked `selected` loaded
 *   with the first country chosen, and valid. Required, the placeholder
 *   is disabled and the empty select is Field's "Pflichtfeld" with its
 *   caution edge; optional, choosing the placeholder takes the choice
 *   back. Its words are the table's unless the app gives its own.
 * - **A value the list does not offer is shown as itself, and called
 *   wrong.** React shows a select whose value matches no option on its
 *   first enabled option (measured, React 19): the box said "Schweiz"
 *   while the value was "LI". So such a value gets an option of its own, the box shows
 *   it, the line under it says "Steht nicht zur Auswahl.", and
 *   `setCustomValidity` makes the form and a Field's confirm agree. The
 *   same for a value whose option is disabled.
 * - **The current value is always posted.** A selected option that is
 *   disabled is left out of `FormData` (measured), so the chosen option
 *   is never disabled, even when the list says it is: it is said to be
 *   wrong, never dropped.
 * - **Read-only is one option.** `<select>` has no `readonly`. Read-only,
 *   only the chosen option is rendered: focusable, read, posted,
 *   `aria-readonly`, and no chevron. Disabled is native: not focusable,
 *   not posted.
 * - **Drawn in Input's frame** (Input.css): the same 3:1 edge, hover,
 *   caution and danger edges, focus ring and heights, so Inputs,
 *   NumberFields and Selects make one row. The select fills the frame,
 *   padding included, so a click anywhere in the box opens the list; the
 *   chevron is drawn over it and is aria-hidden.
 * - **A suggested choice is grey and italic**, as a suggested number is:
 *   the chosen label reads `--fld-value-fg` and `--fld-value-style`. The
 *   options in the open list are always ordinary text.
 * - **`className` and `style` sit on its outer box**, which holds the
 *   frame and the problem line, as NumberField's does.
 * - **Refuses:**
 *   - `multiple` (a native multi-select is a list nobody uses without
 *     Ctrl; several choices are checkboxes, or a Combobox);
 *   - search and filtering (Combobox);
 *   - options loaded as somebody types (AsyncCombobox);
 *   - icons, descriptions or markup in an option;
 *   - children (`options` is the list, so it knows every label);
 *   - '' as an option's value (it is the placeholder's);
 *   - choosing for the person (no first option by default);
 *   - a clear button (the placeholder is the way back, where the field
 *     is optional);
 *   - `size` as a number of rows (that is a listbox);
 *   - a label, description or error of its own.
 */
export function Select<T extends string = string>({
  options,
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  readOnly: readOnlyProp,
  size: sizeProp,
  invalid = false,
  block = false,
  className,
  style,
  id: idProp,
  required: requiredProp,
  disabled: disabledProp,
  form,
  onChange,
  ref,
  ...rest
}: SelectProps<T>) {
  const field = useField()
  const t = useMessages()
  const auto = useId()
  const id = field?.id ?? idProp ?? auto
  const { size, required, disabled, readOnly } = resolveControl(field, {
    size: sizeProp, required: requiredProp, disabled: disabledProp, readOnly: readOnlyProp
  })

  const el = useRef<HTMLSelectElement | null>(null)
  const setRef = useMemo(() => mergeRefs(el, ref), [ref])

  /* The box is always controlled by this component, uncontrolled or
     not, so the extra option for an unknown value and the box agree on
     every render. '' is nothing chosen, as null is. */
  const [inner, setInner] = useState<T | null>(defaultValue ?? null)
  const controlled = value !== undefined
  const raw = controlled ? value : inner
  const current: T | null = raw === '' || raw == null ? null : raw
  const empty = current === null

  /* What the list offers: every label, and the values a person can choose. */
  const { labels, choosable } = useMemo(() => {
    const labels = new Map<string, string>()
    const choosable = new Set<string>()
    for (const item of options) {
      const group = 'options' in item ? item : null
      for (const o of group ? group.options : [item as SelectOption<T>]) {
        labels.set(o.value, o.label)
        if (!o.disabled && !group?.disabled) choosable.add(o.value)
      }
    }
    return { labels, choosable }
  }, [options])

  const unknown = current !== null && !labels.has(current)
  const problem = current !== null && !choosable.has(current)
  const problemText = problem ? t('notAChoice') : ''
  const problemId = problem ? `${id}-problem` : undefined

  // The form agrees with what the field says; so does a Field's confirm.
  useLayoutEffect(() => {
    el.current?.setCustomValidity(problemText)
  }, [problemText])

  useControlChecks('Select', field, el, {
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    ariaLabel: rest['aria-label'],
    ariaLabelledBy: rest['aria-labelledby']
  })
  useEffect(() => {
    if (labels.has('')) warn("Select: an option has the value '' — that is the placeholder's, and choosing it reads as nothing chosen.")
  }, [labels])

  /* A form reset puts the select back to its default-selected option.
     React never marks one while it controls the value, so the browser
     falls back to the first enabled option — the rule measured on load
     above. So after a reset the value is set again: the default when
     uncontrolled, the app's value when controlled. The reset event fires
     BEFORE the values change. */
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const owner = el.current?.form
    if (!owner) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onReset = () => {
      timer = setTimeout(() => {
        if (!controlled) setInner(defaultValue ?? null)
        rerender()
      }, 0)
    }
    owner.addEventListener('reset', onReset)
    return () => {
      owner.removeEventListener('reset', onReset)
      clearTimeout(timer)
    }
  }, [controlled, defaultValue, form])

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e)
    const v = e.currentTarget.value
    const next = (v === '' ? null : v) as T | null
    if (!controlled) setInner(next)
    if (!Object.is(next, current)) onValueChange?.(next)
  }

  const ariaInvalid = rest['aria-invalid']
  const isInvalid = !!(invalid || field?.invalid || ariaInvalid === true || ariaInvalid === 'true' || problem)
  // Caution only from the Field's `required`, as Input: the Field draws the word beside it.
  const color = isInvalid ? 'danger' : field?.required && empty ? 'caution' : undefined

  const ownPlaceholder = placeholder !== undefined
  const placeholderOption = (
    <option value="" disabled={required} lang={ownPlaceholder ? undefined : t.lang('choose')}>
      {ownPlaceholder ? placeholder : t('choose')}
    </option>
  )
  // The chosen option is never disabled: a disabled one is not posted.
  const option = (o: SelectOption<T>, groupDisabled = false) => (
    <option key={o.value} value={o.value} disabled={(o.disabled || groupDisabled) && o.value !== current}>
      {o.label}
    </option>
  )

  let list: ReactNode
  if (readOnly) {
    list = current === null ? placeholderOption : <option value={current}>{labels.get(current) ?? current}</option>
  } else {
    list = (
      <>
        {placeholderOption}
        {/* The app's value, shown as itself: the box never says another. */}
        {unknown && current !== null && <option value={current}>{current}</option>}
        {options.map(item => {
          if (!('options' in item)) return option(item)
          const holdsCurrent = item.options.some(o => o.value === current)
          return (
            <optgroup key={`group:${item.label}`} label={item.label} disabled={!!item.disabled && !holdsCurrent}>
              {item.options.map(o => option(o, !!item.disabled))}
            </optgroup>
          )
        })}
      </>
    )
  }

  return (
    /* The box directly inside a Field's control slot: Field reads
       data-empty here (useField's contract). */
    <div
      className={clsx('lcf-select', className)}
      style={style}
      data-block={block || undefined}
      data-empty={empty || undefined}
    >
      <span
        className="lcf-input lcf-select-frame"
        data-size={size}
        data-block={block || undefined}
        data-color={color}
        data-readonly={readOnly || undefined}
        data-disabled={disabled || undefined}
      >
        <select
          {...rest}
          ref={setRef}
          id={id}
          form={form}
          className="lcf-input-el lcf-select-el"
          value={current ?? ''}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          aria-readonly={readOnly || undefined}
          // Always written, as Input does: with no attribute, Chrome
          // reports the native validity, which no words on the screen say.
          aria-invalid={isInvalid ? 'true' : 'false'}
          aria-describedby={joinIds(problemId, rest['aria-describedby'], field?.describedBy)}
        >
          {list}
        </select>
        {!readOnly && <ChevronDown className="lcf-select-chevron" aria-hidden="true" />}
      </span>
      {problem && (
        <div id={problemId} className="lcf-field-msg" data-color="danger" lang={t.lang('notAChoice')}>
          <CircleX aria-hidden="true" />
          <span>{problemText}</span>
        </div>
      )}
    </div>
  )
}
