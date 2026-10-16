import { clsx } from 'clsx'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode
} from 'react'
import { useField } from '../Field/context'
import { joinIds } from '../Field/ids'
import { mergeRefs } from '../refs'
import type { Size } from '../types'

/** The text types. Numbers, dates and search have components of their own. */
export type InputType = 'text' | 'email' | 'tel' | 'url' | 'password'
const TYPES: readonly string[] = ['text', 'email', 'tel', 'url', 'password']

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type' | 'maxLength'> {
  /** The text types. Numbers, dates and search have components of their own. Default 'text'. */
  type?: InputType
  /** 22, 26 or 32px, matching Button. Inside a Field, the Field's size unless set here. Default 'md'. */
  size?: Size
  /** For a field whose words live elsewhere (a table cell with a summary). Inside a Field, Field's `error` sets it. */
  invalid?: boolean
  /** Full width of its container. Default false. */
  block?: boolean
  /** Before the text: an icon, a prefix. Clicking it focuses the input unless it is a control itself. */
  startAdornment?: ReactNode
  /** After the text: a unit, a button. */
  endAdornment?: ReactNode
}

/** What NumberField needs beyond Input's props. Internal. */
export interface InputFrameProps extends InputProps {
  /** Extra attributes on the frame — NumberField's `data-dirty`. */
  frameProps?: Record<`data-${string}`, string | undefined>
  /** Replaces aria-labelledby: NumberField names itself "label + unit". */
  labelledBy?: string
  /** Overrides how emptiness is read. NumberField counts whitespace as empty; Input does not. */
  empty?: boolean
}

const warn = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.warn(`[lcf] ${msg}`)
}

/**
 * The box every one-line control is drawn in, and the Field contract
 * (`useField`'s doc comment) kept once: Input is this with nothing
 * added, NumberField builds on it. Internal.
 */
export function InputFrame({
  type = 'text',
  size: sizeProp,
  invalid: invalidProp,
  block,
  startAdornment,
  endAdornment,
  frameProps,
  labelledBy,
  empty: emptyProp,
  className,
  style,
  id: idProp,
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  value,
  defaultValue,
  onChange,
  ref,
  ...rest
}: InputFrameProps) {
  const field = useField()
  const auto = useId()
  const id = field?.id ?? idProp ?? auto
  const inner = useRef<HTMLInputElement | null>(null)
  const setRef = useMemo(() => mergeRefs(inner, ref), [ref])

  const size = sizeProp ?? field?.size ?? 'md'
  const required = !!(requiredProp || field?.required)
  const disabled = !!(disabledProp || field?.disabled)
  const readOnly = !!(readOnlyProp || field?.readOnly)
  const ariaInvalid = rest['aria-invalid']
  const invalid = !!(invalidProp || field?.invalid || ariaInvalid === true || ariaInvalid === 'true')

  /* Emptiness, worked out during render so that the Field's "required
     and empty" is right on the first paint and on the server. Exactly
     '' — whitespace is not empty, which is what native `required`
     (valueMissing) says too. */
  const controlled = value !== undefined
  const [uncontrolledEmpty, setUncontrolledEmpty] = useState(() => String(defaultValue ?? '') === '')
  const empty = emptyProp ?? (controlled ? String(value ?? '') === '' : uncontrolledEmpty)

  // A form reset puts an uncontrolled value back without an input event.
  useEffect(() => {
    if (controlled) return
    const form = inner.current?.form
    if (!form) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onReset = () => {
      // The reset event fires BEFORE the values change; read after it.
      timer = setTimeout(() => { if (inner.current) setUncontrolledEmpty(inner.current.value === '') }, 0)
    }
    form.addEventListener('reset', onReset)
    return () => {
      form.removeEventListener('reset', onReset)
      clearTimeout(timer)
    }
  }, [controlled])

  const color = invalid ? 'danger' : field && required && empty ? 'caution' : undefined

  // Development only, and enforced: the sweep fails on console warnings.
  const ariaLabel = rest['aria-label']
  const ariaLabelledBy = labelledBy ?? rest['aria-labelledby']
  useEffect(() => {
    if (field || ariaLabel || ariaLabelledBy) return
    if ((inner.current?.labels?.length ?? 0) > 0) return
    warn('Input has no name: put it in a Field, or give it aria-label or a <label for>. A placeholder is not a name.')
  }, [field, ariaLabel, ariaLabelledBy])
  useEffect(() => {
    if (field && idProp !== undefined && idProp !== field.id) {
      warn("an `id` on a control inside a Field is ignored — set the Field's `id`; it names the control.")
    }
  }, [field, idProp])
  useEffect(() => {
    if (!TYPES.includes(type)) warn(`Input: type="${type}" is not one of ${TYPES.join(', ')}. Numbers, dates and search have components of their own.`)
  }, [type])

  /* The pointer rule: the frame is wider than the input (padding,
     adornments), and a click there should land in the text. A click on
     something that is a control itself — a button in an adornment — is
     that control's. */
  const onFrameMouseDown = (e: MouseEvent<HTMLSpanElement>) => {
    const el = inner.current
    if (!el || disabled || e.button !== 0) return
    const target = e.target as Element
    if (target === el || target.closest('button, a, input, select, textarea')) return
    e.preventDefault()
    el.focus()
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!controlled) setUncontrolledEmpty(e.currentTarget.value === '')
    onChange?.(e)
  }

  return (
    <span
      className={clsx('lcf-input', className)}
      style={style}
      data-size={size}
      data-block={block || undefined}
      data-color={color}
      data-empty={empty || undefined}
      data-readonly={readOnly || undefined}
      data-disabled={disabled || undefined}
      {...frameProps}
      onMouseDown={onFrameMouseDown}
    >
      {startAdornment != null && startAdornment !== false && <span className="lcf-input-adornment">{startAdornment}</span>}
      <input
        {...rest}
        ref={setRef}
        id={id}
        type={type}
        className="lcf-input-el"
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={joinIds(rest['aria-describedby'], field?.describedBy)}
      />
      {endAdornment != null && endAdornment !== false && <span className="lcf-input-adornment">{endAdornment}</span>}
    </span>
  )
}
