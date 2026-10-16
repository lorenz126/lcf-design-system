import { clsx } from 'clsx'
import { Check, CircleCheck, CircleX, RotateCcw } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode
} from 'react'
import { flushSync } from 'react-dom'
import { useMessages } from '../../i18n/context'
import type { MessageKey } from '../../i18n/messages'
import { mergeRefs } from '../refs'
import type { FieldState, Origin, OriginSource, Size } from '../types'
import { announce, ensureAnnouncer } from './announce'
import { FieldContext, type FieldContextValue } from './context'
import { joinIds } from './ids'
import { normaliseOrigin, OriginMark, originWords } from './origin'

export interface FieldProps extends Omit<ComponentPropsWithRef<'div'>, 'id' | 'children'> {
  /** What the value is. Required: a field nobody can name is a box nobody can find. */
  label: ReactNode
  /** Visually hides the label (and its asterisk); it stays the name. Marks and actions stay visible. Default false. */
  hideLabel?: boolean
  /** Guidance under the control. Stays when an error arrives. */
  description?: ReactNode
  /** The app's verdict, in words. Anything that renders makes the control invalid; `true`, `false`, '' and null do not (dev warning on `true`). */
  error?: ReactNode
  /** Default false. Native `required` on the control, an aria-hidden "*", and, while the control is empty, the word "Pflichtfeld" and a caution edge. */
  required?: boolean
  /** Default false. OR'ed into the control. Hides the actions. */
  disabled?: boolean
  /** Default false. OR'ed into the control. Hides the actions: a locked offer cannot be confirmed. */
  readOnly?: boolean
  /** Sizes the control unless the control sets its own. Default undefined → the control's default 'md'. Field's own text does not scale. */
  size?: Size
  /** Full width of its container. Default false. */
  block?: boolean
  /** The CONTROL's id (an error summary links to it). Default useId(). */
  id?: string
  /** What the value is: somebody's suggestion, or confirmed by a person. Default undefined (typed or edited). */
  state?: FieldState
  /** Where the value came from. The source string is shorthand: origin="assumed". */
  origin?: Origin | OriginSource
  /** The app's word or two for why this field matters: "Preistreiber". A mark beside the label, spoken as a sentence. */
  hint?: string
  /** An icon for the hint, rendered aria-hidden. */
  hintIcon?: ReactNode
  /** The suggested value as the field shows it ("118 m²", from useFormat().unit). Display only: the ↺ button's text and name, and the "Suggestion: …" sentence. */
  suggestion?: string
  /** Makes the field confirmable: Enter in the control, or the ✓ button, calls this. Enter then never submits the form. */
  onConfirm?: () => void
  /** Back to the suggestion. Pass it only while there is something to go back to; ↺ shows exactly when it is given. */
  onRevert?: () => void
  /** Exactly one control. */
  children: ReactNode
}

/* Enter confirms in a one-line control, never in a textarea or an
   editable region, where Enter is a new line. */
const NOT_TEXT = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'hidden', 'range', 'color'])
function confirmsOnEnter(el: HTMLElement): boolean {
  if (el instanceof HTMLSelectElement) return true
  return el instanceof HTMLInputElement && !NOT_TEXT.has(el.type)
}

const hasWords = (error: ReactNode) =>
  !(error === undefined || error === null || error === false || error === true || error === '')

/**
 * Field — the label, the words around a control, and where its value came from, wired once for any control.
 *
 * - **A context, not a bundle.** It renders no control. Any control that
 *   calls `useField()` gets its id, its description and
 *   required/invalid without the caller wiring ids by hand. That is the
 *   Nuxt defect it ends: a label pointing at nothing.
 * - **It never touches the value.** State, origin and the suggestion's
 *   text are told to it. Emptiness is read only by CSS, from the
 *   control's own `data-empty`, so nothing travels upward and nothing
 *   flashes on first paint.
 * - **Three states, and only two are props.** Suggested is grey italic,
 *   with no word, because most of forty fields arrive suggested and a
 *   word on each hides the ones that need a person. Confirmed is a ✓.
 *   Required-and-empty is derived: the word and a caution edge, the one
 *   edge that clears 3:1 in colour, shown before any submit because in a
 *   review an empty required field is the to-do.
 * - **One Tab stop per field.** Enter confirms what is in the box, and a
 *   confirmable field never submits on Enter. ✓ is for the pointer. ↺
 *   sits before the control, so the forward pass never meets it, and
 *   focus returns to the control after either action.
 * - **Every mark is said once.** The head row's marks are aria-hidden.
 *   Each is spoken by its own sentence ending in a full stop, referenced
 *   by `aria-describedby`. Measured: a word beside an aria-hidden icon
 *   joined as "Herkunft:Kunde".
 * - **The layer's words carry their language.** "Pflichtfeld",
 *   "Vorschlag.", "Kunde per E-Mail" are marked with `lang`; the label,
 *   description, error and hint are the app's, and are not.
 * - **Refuses:**
 *   - owning or reading the value;
 *   - a suggestion shown as a placeholder (a suggestion is a value that
 *     gets submitted and priced);
 *   - being invalid without words;
 *   - validating (it shows what the app and the control found);
 *   - tracking origin (the app owns it, Field shows it);
 *   - inventing the app's words (`hint` is the app's);
 *   - colour as the only signal;
 *   - being a layout (no horizontal label mode, no grid);
 *   - the checkbox family (their label sits beside a control that comes
 *     first; the Nuxt finding);
 *   - a button in the forward Tab path;
 *   - moving focus when something is wrong.
 */
export function Field({
  label,
  hideLabel = false,
  description,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  size,
  block = false,
  id: idProp,
  state,
  origin: originProp,
  hint,
  hintIcon,
  suggestion,
  onConfirm,
  onRevert,
  children,
  className,
  onKeyDown,
  ref,
  ...rest
}: FieldProps) {
  const t = useMessages()
  const auto = useId()
  const id = idProp ?? auto
  const labelId = `${id}-label`
  const root = useRef<HTMLDivElement | null>(null)
  const setRef = useMemo(() => mergeRefs(root, ref), [ref])
  const origin = normaliseOrigin(originProp)

  const hasError = hasWords(error)
  const showConfirm = !!onConfirm && state !== 'confirmed' && !disabled && !readOnly
  const showRevert = !!onRevert && !disabled && !readOnly
  const showHead = !hideLabel || !!origin || !!hint || showConfirm || showRevert || state === 'confirmed'

  const stateKey: MessageKey | undefined =
    state === 'suggested' ? 'stateSuggested'
      : state === 'confirmed' ? 'stateConfirmed'
        : suggestion !== undefined ? 'suggestionWas'
          : undefined
  const stateText = stateKey && t(stateKey, { value: suggestion ?? '' })
  const originText = origin && originWords(origin, t).text
  const hintText = hint && hint + (/[.!?…:;]$/.test(hint) ? '' : '.')

  const ids = {
    error: hasError ? `${id}-error` : undefined,
    state: stateKey ? `${id}-state` : undefined,
    keys: showConfirm ? `${id}-keys` : undefined,
    origin: origin ? `${id}-origin` : undefined,
    hint: hint ? `${id}-hint` : undefined,
    help: description != null && description !== false && description !== '' ? `${id}-help` : undefined
  }
  const describedBy = joinIds(ids.error, ids.state, ids.keys, ids.origin, ids.hint, ids.help)

  const context = useMemo<FieldContextValue>(() => ({
    id,
    labelId,
    describedBy,
    invalid: hasError,
    required,
    disabled,
    readOnly,
    size
  }), [id, labelId, describedBy, hasError, required, disabled, readOnly, size])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && error === true) {
      console.warn('[lcf] Field: error={true} — a field is never invalid without words. Pass the sentence that says what is wrong.')
    }
  }, [error])

  // The region exists, empty, before the first thing it has to say.
  useEffect(() => {
    if (onConfirm) ensureAnnouncer()
  }, [onConfirm])

  /* Confirmation is announced when it happens where the person is: the
     state turned confirmed while focus is in this field, or because of
     an action taken in it (the ✓ button unmounts as it acts, and focus
     is on <body> for that moment). An app confirming a field somewhere
     else says nothing. */
  const acting = useRef(false)
  const previous = useRef(state)
  useEffect(() => {
    const was = previous.current
    previous.current = state
    if (was === 'confirmed' || state !== 'confirmed') return
    const doc = root.current?.ownerDocument
    if (acting.current || (doc && root.current?.contains(doc.activeElement))) {
      announce(t('stateConfirmed'), t.lang('stateConfirmed'))
    }
  }, [state, t])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.key !== 'Enter' || e.defaultPrevented) return
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const target = e.target as HTMLElement
    if (target.id !== id || !confirmsOnEnter(target)) return
    if (!onConfirm || disabled || readOnly) return
    if ((target as HTMLInputElement).readOnly || (target as HTMLInputElement).disabled) return
    // Confirming, not submitting: no implicit submission either.
    e.preventDefault()
    onConfirm()
  }

  /* ✓ and ↺ do not cancel mousedown: focus moves to the button, so a
     NumberField with typed text commits it on blur BEFORE the click —
     otherwise the box and the value would disagree. After the action,
     focus goes back to the control. */
  const act = (fn: (() => void) | undefined, which: 'confirm' | 'revert') => {
    if (!fn) return
    const doc = root.current?.ownerDocument ?? document
    const hadFocus = doc.activeElement !== null && doc.activeElement === doc.getElementById(id)
    acting.current = true
    try {
      flushSync(fn)
    } finally {
      acting.current = false
    }
    const now = doc.activeElement
    if (!now || now === doc.body || root.current?.contains(now)) doc.getElementById(id)?.focus()
    // Moving focus makes a screen reader read the field again — value
    // and "Vorschlag." — so ↺ only speaks when focus did not move.
    if (which === 'revert' && hadFocus) announce(t('stateSuggested'), t.lang('stateSuggested'))
  }

  const revertKey: MessageKey = suggestion !== undefined ? 'backToSuggestionValue' : 'backToSuggestion'
  const revertName = t(revertKey, { value: suggestion ?? '' })
  const confirmName = t('confirmValue')

  const labelEl = (
    <label id={labelId} htmlFor={id} className={clsx('lcf-field-label', hideLabel && 'lcf-sr-only')}>
      {label}
      {required && <span className="lcf-field-req" aria-hidden="true">*</span>}
    </label>
  )
  const hasMarks = !!origin || !!hint || showRevert || showConfirm || state === 'confirmed'

  return (
    <div
      {...rest}
      ref={setRef}
      className={clsx('lcf-field', className)}
      data-state={state}
      data-origin={origin?.source}
      data-required={required || undefined}
      data-invalid={hasError || undefined}
      data-block={block || undefined}
      onKeyDown={handleKeyDown}
    >
      {showHead ? (
        <div className="lcf-field-head">
          {labelEl}
          {required && !hideLabel && (
            <span className="lcf-field-req-word" data-color="caution" aria-hidden="true" lang={t.lang('required')}>
              {t('required')}
            </span>
          )}
          {hasMarks && (
            <span className="lcf-field-marks">
              {origin && <OriginMark origin={origin} t={t} />}
              {hint && (
                <span className="lcf-field-hint" aria-hidden="true">
                  {hintIcon}
                  {hint}
                </span>
              )}
              {showRevert && (
                <button
                  type="button"
                  className="lcf-field-action"
                  data-action="revert"
                  lang={t.lang(revertKey)}
                  aria-label={revertName}
                  title={revertName}
                  aria-describedby={labelId}
                  onClick={() => act(onRevert, 'revert')}
                >
                  <RotateCcw aria-hidden="true" />
                  {suggestion !== undefined && <span className="lcf-field-action-text">{suggestion}</span>}
                </button>
              )}
              {showConfirm && (
                <button
                  type="button"
                  className="lcf-field-action"
                  data-action="confirm"
                  tabIndex={-1}
                  lang={t.lang('confirmValue')}
                  aria-label={confirmName}
                  title={confirmName}
                  aria-describedby={labelId}
                  onClick={() => act(onConfirm, 'confirm')}
                >
                  <Check aria-hidden="true" />
                </button>
              )}
              {state === 'confirmed' && (
                <span className="lcf-field-confirmed" data-color="success" aria-hidden="true">
                  <CircleCheck />
                </span>
              )}
            </span>
          )}
        </div>
      ) : labelEl}
      <div className="lcf-field-control">
        <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      </div>
      {ids.error && (
        <div id={ids.error} className="lcf-field-msg" data-color="danger">
          <CircleX aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {ids.help && <div id={ids.help} className="lcf-field-msg">{description}</div>}
      {/* Description-only sentences: `hidden`, so they are read through
          aria-describedby and never a second time in browse mode. */}
      {ids.state && <span id={ids.state} hidden lang={t.lang(stateKey!)}>{stateText}</span>}
      {ids.keys && <span id={ids.keys} hidden lang={t.lang('enterConfirms')}>{t('enterConfirms')}</span>}
      {ids.origin && <span id={ids.origin} hidden lang={t.lang('originSentence')}>{t('originSentence', { origin: originText! })}</span>}
      {ids.hint && <span id={ids.hint} hidden>{hintText}</span>}
    </div>
  )
}
