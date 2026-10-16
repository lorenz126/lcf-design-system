import { clsx } from 'clsx'
import { CircleX, Minus, Plus } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent
} from 'react'
import { flushSync } from 'react-dom'
import { useFormat, useMessages } from '../../i18n/context'
import type { Unit } from '../../i18n/format'
import { announce, ensureAnnouncer } from '../Field/announce'
import { useField } from '../Field/context'
import { joinIds } from '../Field/ids'
import { InputFrame } from '../Input/InputFrame'
import { mergeRefs } from '../refs'
import type { Size } from '../types'
import { decimals, displayText, inputModeFor, rangeProblem, readText, stepFrom, UNIT_WORD, type Problem } from './number'

export interface NumberFieldProps extends Omit<ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' |
  'inputMode' | 'pattern' | 'maxLength' | 'minLength' | 'children'> {
  /** The committed number, in the unit shown: with `percent`, 15 is 15 %. null is empty, 0 is a value. undefined = uncontrolled. */
  value?: number | null
  /** Default null. */
  defaultValue?: number | null
  /** On commit (blur, Enter, an arrow key, a stepper press), and only when the number changed. Never per keystroke. Text it cannot read is never emitted. */
  onValueChange?: (value: number | null) => void
  /** m2 m3 m mm cm km kg h percent CHF EUR: the i18n Unit type. */
  unit?: Unit
  min?: number
  max?: number
  /** The grid a value must sit on (from `min`, or 0) and what an arrow moves by. Omitted: arrows move by 1, no grid check. */
  step?: number
  /** Fraction digits always shown. Default 2 for CHF and EUR, else 0. The display never rounds. */
  minimumFractionDigits?: number
  /** − and + buttons, outside the Tab order. md and lg only; ignored with a dev warning at sm (24px targets, WCAG 2.5.8). Default false. */
  stepper?: boolean
  /** Field's size, else 'md'. */
  size?: Size
  /** For a field whose words live elsewhere. Inside a Field, Field's `error` sets it; a problem of its own sets it too. */
  invalid?: boolean
  /** Default false. */
  block?: boolean
}

const MONEY: readonly Unit[] = ['CHF', 'EUR']

/* The visible label's text, as a screen reader would read it: without
   the aria-hidden asterisk. */
function spokenText(node: Node | null | undefined): string {
  if (!node) return ''
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (node instanceof Element && (node.getAttribute('aria-hidden') === 'true' || node.hasAttribute('hidden'))) return ''
  return [...node.childNodes].map(spokenText).join('')
}

/**
 * NumberField — a quantity with its unit, typed in the reader's own separators and kept as a number.
 *
 * - **NOT `type="number"`, and that is a cost.** The native field
 *   parses in the browser's locale, not the app's. It cannot show
 *   "10'410.50", sanitises "12," to "", accepts `e`, and changes on the
 *   wheel. So this one owns its parsing (`useFormat().parseNumber`), and
 *   with it the debt.
 * - **NOT `role="spinbutton"`.** Measured: an empty spinbutton reports
 *   0, missing min/max report as 0..0, and `aria-valuetext` is ignored.
 *   It stays a textbox. The unit is part of its name ("Fläche
 *   Quadratmeter"), and steps are announced.
 * - **THE TEXT IS NOT A NUMBER YET.** It commits on blur, Enter, arrows
 *   and the stepper, never per keystroke. A field that drives a price
 *   would otherwise recalculate on 1, 12 and 120. "12," mid-typing is not
 *   an error; problems are removed as soon as the text would commit
 *   cleanly, and added only when it commits.
 * - **IT NEVER CLAMPS, SNAPS OR ROUNDS WHAT WAS TYPED.** It says what is
 *   wrong (`setCustomValidity` included, so the form agrees) and keeps
 *   the number. Arrows clamp because they are gestures. Unreadable text
 *   keeps the last good value and emits nothing — emptying a field to
 *   punish a typo destroys data.
 * - **The unit sits at the end in every locale.** A column of "m²", "%"
 *   and "CHF" fields lines its numbers up on one edge; printed text still
 *   uses `format.money`. Pasted units are understood: "CHF 1'200.–" is
 *   1200 in a franc field.
 * - **It posts the canonical number.** With `name`, a hidden input
 *   carries 1234.5, never "1'234.5"; the visible box has no name.
 * - **Refuses:**
 *   - `type="number"`;
 *   - `spinbutton`;
 *   - the wheel;
 *   - per-keystroke values (there is no `onChange`);
 *   - clamping, snapping, rounding or emptying what was typed;
 *   - emitting text it cannot read;
 *   - unit arithmetic or conversion;
 *   - units outside `Unit`;
 *   - steppers at sm;
 *   - being a slider.
 */
export function NumberField({
  value,
  defaultValue = null,
  onValueChange,
  unit,
  min,
  max,
  step,
  minimumFractionDigits,
  stepper = false,
  size: sizeProp,
  invalid = false,
  block = false,
  className,
  style,
  id: idProp,
  name,
  form,
  disabled,
  readOnly,
  onKeyDown,
  onBlur,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: NumberFieldProps) {
  const field = useField()
  const t = useMessages()
  const f = useFormat()
  const auto = useId()
  const id = field?.id ?? idProp ?? auto
  const size = sizeProp ?? field?.size ?? 'md'
  const isDisabled = !!(disabled || field?.disabled)
  const isReadOnly = !!(readOnly || field?.readOnly)

  const input = useRef<HTMLInputElement | null>(null)
  const setRef = useMemo(() => mergeRefs(input, ref), [ref])

  const [text, setText] = useState('')
  const [dirty, setDirty] = useState(false)
  const [parseFailed, setParseFailed] = useState(false)
  const [inner, setInner] = useState<number | null>(defaultValue ?? null)
  const committed = value !== undefined ? value : inner

  const bounds = { min, max, step }
  const mfd = minimumFractionDigits ?? (unit && MONEY.includes(unit) ? 2 : 0)
  const display = (n: number) => displayText(n, f, mfd)
  // The box follows the value whenever the person is not mid-edit: a
  // parent that rejects a commit is shown as rejected. No sync effect.
  const displayed = dirty ? text : committed == null ? '' : display(committed)
  const empty = displayed.trim() === ''

  /* Problems are removed early and added late: while typing, one goes the
     moment the text would commit cleanly; a new one arrives only with a
     commit. Derived during render, so an out-of-range default shows at
     once, and the server agrees. */
  let problem: Problem | null
  const read = dirty ? readText(text, unit, f) : null
  if (read?.ok && !rangeProblem(read.value, bounds)) problem = null
  else if (dirty && parseFailed) problem = { key: 'notANumber' }
  else problem = rangeProblem(committed, bounds)

  // Each placeholder in the reader's units: "Mindestens CHF 1'000.00.", "Höchstens 100 %."
  const amount = (x: number) => {
    const digits = Math.min(20, decimals(x))
    return unit
      ? f.unit(x, unit, { maximumFractionDigits: Math.max(digits, unit && MONEY.includes(unit) ? 2 : 0) })
      : f.number(x, { maximumFractionDigits: digits })
  }
  const problemText = problem && t(problem.key, problem.value === undefined ? {} : { min: amount(problem.value), max: amount(problem.value), step: amount(problem.value) })

  // The form agrees with what the field says.
  useLayoutEffect(() => {
    input.current?.setCustomValidity(problemText ?? '')
  }, [problemText])

  useEffect(() => { ensureAnnouncer() }, [])

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (field && idProp !== undefined) console.warn("[lcf] an `id` on a control inside a Field is ignored — set the Field's `id`; it names the control.")
  }, [field, idProp])
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && stepper && size === 'sm') {
      console.warn('[lcf] NumberField: no stepper at size sm — its buttons would be under 24px (WCAG 2.5.8). Arrow keys step at every size.')
    }
  }, [stepper, size])

  /* ---- what is said ---- */
  const lastSaid = useRef<string | null>(null)
  const labelText = () => {
    const el = input.current
    if (!el) return ''
    if (field) return spokenText(el.ownerDocument.getElementById(field.labelId)).trim()
    if (ariaLabel) return ariaLabel
    return spokenText(el.labels?.[0]).trim()
  }
  const sayProblem = (p: Problem | null) => {
    if (!p) {
      lastSaid.current = null
      return
    }
    const message = t(p.key, p.value === undefined ? {} : { min: amount(p.value), max: amount(p.value), step: amount(p.value) })
    const label = labelText()
    const said = label ? t('fieldMessage', { field: label, message }) : message
    if (said === lastSaid.current) return
    lastSaid.current = said
    announce(said, t.lang(p.key))
  }
  const stepTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(stepTimer.current), [])
  const sayStep = (v: number) => {
    clearTimeout(stepTimer.current)
    const message = unit ? t('valueWithUnit', { value: display(v), unit: t(UNIT_WORD[unit]) }) : display(v)
    const lang = unit ? t.lang(UNIT_WORD[unit]) : f.locale
    // After the last of a run of presses, not each one.
    stepTimer.current = setTimeout(() => announce(message, lang), 250)
  }

  /* ---- commit ---- */
  const emit = (n: number | null) => {
    if (value === undefined) setInner(n)
    if (!Object.is(n, committed)) onValueChange?.(n)
  }

  const commit = (reason: 'blur' | 'enter' | 'step'): 'ok' | 'failed' => {
    if (!dirty) return 'ok'
    const r = readText(text, unit, f)
    if (!r.ok) {
      // The value is unchanged, nothing is emitted, the text stays.
      setParseFailed(true)
      if (reason !== 'step') sayProblem({ key: 'notANumber' })
      return 'failed'
    }
    setParseFailed(false)
    setDirty(false)
    emit(r.value)
    if (reason !== 'step') sayProblem(rangeProblem(r.value, bounds))
    return 'ok'
  }

  const stepBy = (dir: 1 | -1, mult: number) => {
    if (isDisabled || isReadOnly) return
    let base = committed
    if (dirty) {
      const r = readText(text, unit, f)
      if (!r.ok) {
        commit('step')
        return
      }
      base = r.value
    }
    const v = stepFrom(base, dir, mult, bounds)
    setDirty(false)
    setParseFailed(false)
    emit(v)
    lastSaid.current = null
    sayStep(v)
  }

  /* ---- keys ---- */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (isDisabled || isReadOnly) return
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault()
        stepBy(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey ? 10 : 1)
        break
      case 'PageUp':
      case 'PageDown':
        e.preventDefault()
        stepBy(e.key === 'PageUp' ? 1 : -1, 10)
        break
      case 'Enter': {
        /* Flushed now, so a submit or a Field's confirm later in this
           same event acts on the committed number — the hidden input
           already carries it. Unreadable text stops both. */
        if (flushSync(() => commit('enter')) === 'failed') e.preventDefault()
        break
      }
      case 'Escape':
        // Back to the committed value. A dialog around it stays open: the
        // Escape was spent on the edit.
        if (dirty) {
          setDirty(false)
          setParseFailed(false)
          e.preventDefault()
          e.stopPropagation()
        }
        break
    }
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    onBlur?.(e)
    commit('blur')
  }

  /* ---- naming ---- */
  const unitId = `${id}-unit`
  const problemId = problem ? `${id}-problem` : undefined
  let labelledBy: string | undefined = ariaLabelledBy
  let unitDescId: string | undefined
  if (unit) {
    if (field) labelledBy = `${field.labelId} ${unitId}`
    else if (ariaLabelledBy) labelledBy = `${ariaLabelledBy} ${unitId}`
    // The self-reference takes the element's own aria-label.
    else if (ariaLabel) labelledBy = `${id} ${unitId}`
    // Named from outside by <label for>: aria-labelledby would override
    // it, so the unit is said as a description instead.
    else unitDescId = unitId
  }

  const atMin = min !== undefined && committed != null && committed <= min
  const atMax = max !== undefined && committed != null && committed >= max
  const showStepper = stepper && size !== 'sm'
  const stepButton = (dir: 1 | -1) => {
    const key = dir > 0 ? 'increment' : 'decrement'
    const own = `${id}-${dir > 0 ? 'inc' : 'dec'}`
    return (
      <button
        type="button"
        className="lcf-number-step"
        tabIndex={-1}
        id={own}
        aria-label={t(key)}
        aria-labelledby={field ? `${own} ${field.labelId}` : undefined}
        aria-controls={id}
        lang={t.lang(key)}
        disabled={isDisabled || isReadOnly || (dir > 0 ? atMax : atMin)}
        // Focus stays in the box: the button is a pointer's way to an arrow key.
        onPointerDown={e => e.preventDefault()}
        onMouseDown={e => e.preventDefault()}
        onClick={() => stepBy(dir, 1)}
      >
        {dir > 0 ? <Plus aria-hidden="true" /> : <Minus aria-hidden="true" />}
      </button>
    )
  }

  return (
    <div className={clsx('lcf-number', className)} style={style} data-block={block || undefined}>
      <InputFrame
        {...rest}
        ref={setRef}
        id={id}
        type="text"
        size={size}
        block={block}
        invalid={invalid || !!problem}
        disabled={disabled}
        readOnly={readOnly}
        empty={empty}
        value={displayed}
        onChange={e => {
          setText(e.currentTarget.value)
          setDirty(true)
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        inputMode={inputModeFor(min)}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        // The number is the formatter's writing: its separators, its language.
        lang={f.locale}
        aria-label={ariaLabel}
        labelledBy={labelledBy}
        aria-describedby={joinIds(problemId, unitDescId, ariaDescribedBy)}
        frameProps={{ 'data-dirty': dirty ? 'true' : undefined }}
        endAdornment={(unit || showStepper) && (
          <>
            {unit && <span className="lcf-number-unit" aria-hidden="true">{f.unitSymbol(unit)}</span>}
            {showStepper && (
              <span className="lcf-number-steps">
                {stepButton(-1)}
                {stepButton(1)}
              </span>
            )}
          </>
        )}
      />
      {unit && <span id={unitId} hidden lang={t.lang(UNIT_WORD[unit])}>{t(UNIT_WORD[unit])}</span>}
      {problem && (
        <div id={problemId} className="lcf-field-msg" data-color="danger" lang={t.lang(problem.key)}>
          <CircleX aria-hidden="true" />
          <span>{problemText}</span>
        </div>
      )}
      {name && <input type="hidden" name={name} form={form} disabled={isDisabled} value={committed == null ? '' : String(committed)} />}
    </div>
  )
}
