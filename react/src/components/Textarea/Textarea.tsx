import { clsx } from 'clsx'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type CSSProperties,
  type FocusEvent
} from 'react'
import { useFormat, useMessages } from '../../i18n/context'
import { announce, ensureAnnouncer } from '../Field/announce'
import { useField } from '../Field/context'
import { joinIds } from '../Field/ids'
import { resolveControl, useControlChecks } from '../Input/InputFrame'
import { mergeRefs } from '../refs'
import type { Size } from '../types'
import { countCharacters } from './count'

export interface TextareaProps extends Omit<ComponentPropsWithRef<'textarea'>, 'rows' | 'cols' | 'maxLength'> {
  /** Lines shown while it is empty, and the fewest it ever shows. Default 3. */
  rows?: number
  /** Lines it grows to; past them it scrolls. `maxRows={rows}` keeps it one height. Default 10, or `rows` if that is more. */
  maxRows?: number
  /** The length the text should keep to. Shows a count and says what is left once the person stops typing — and never stops anyone typing, confirming or submitting. Counted as a person counts (`countCharacters`). */
  characterLimit?: number
  /** Inside a Field, the Field's size unless set here. Default 'md'. */
  size?: Size
  /** For a field whose words live elsewhere (a table cell with a summary). Inside a Field, Field's `error` sets it. */
  invalid?: boolean
  /** Full width of its container. Default false. */
  block?: boolean
}

const DEFAULT_ROWS = 3
const DEFAULT_MAX_ROWS = 10
/* How long after the last keystroke the count is said: after a pause,
   not per keystroke, which would talk over the typing echo. */
const SAY_AFTER_MS = 1000

const warn = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.warn(`[lcf] ${msg}`)
}

/**
 * Textarea — several lines of text, growing with them.
 *
 * - **It grows with its text, from `rows` to `maxRows`, then scrolls.**
 *   `field-sizing: content` does it in CSS where the engine has it.
 *   Elsewhere a fallback measures `scrollHeight` after resetting the
 *   height — a textarea's scrollHeight never shrinks on its own — and it
 *   runs only where the computed `field-sizing` is not `content`, so the
 *   day every engine has it, the fallback is deleted, not rewritten.
 *   Measured in Chromium with the CSS path switched off: both give the
 *   same height, to the pixel, at every row count (`e2e/textarea.spec.ts`).
 * - **The width is the layout's, never the text's.** `field-sizing`
 *   sizes both axes: measured, a textarea with no width of its own was
 *   356px wide with its placeholder and 318px with six words typed. It
 *   is 20rem — or its container's width with `block` — and never wider
 *   than its container.
 * - **A count reports; it never blocks.** `characterLimit` sets no
 *   `maxlength`: refusing keystrokes or cutting a paste does not make the
 *   text shorter, it gets finished somewhere else and pasted in. Over the
 *   limit the count turns danger and its numbers say by how much; the
 *   field is not invalid, a confirm goes through, the form submits. The
 *   verdict is the app's — `error` on the Field — counted with
 *   `countCharacters`, so it cannot disagree with the count on the screen.
 *   The limit is said once, with the field's description; what is left,
 *   a second after the person stops typing (GOV.UK's character count),
 *   never per keystroke.
 * - **In a Field, unchanged.** Its id, description, `required`,
 *   `disabled`, `readOnly`, size and invalid come from `useField()`, as
 *   Input's do, and a suggested value is grey and italic until the field
 *   has focus. Enter is a new line, so Ctrl+Enter or ⌘ Enter confirms,
 *   and the field says "Ctrl+Enter", not "Enter"; Escape goes back to the
 *   suggestion, and what was typed since goes with it, as in Input. Leave
 *   Field's `suggestion` out: it becomes ↺'s visible text, and a
 *   paragraph does not fit beside a label.
 * - **`className`, `style` and `ref` are the `<textarea>`'s**, the box
 *   that is drawn, as Input's are its frame's. `onChange` is native, per
 *   keystroke.
 * - **Sizes follow the type ramp** — 13/18, 15/22 and 17/26 — so `rows`
 *   is exact: three rows at md are 80px, padding and edge included.
 * - **Refuses:**
 *   - a label, description or error of its own;
 *   - `maxLength` (the browser cuts a paste without saying so);
 *   - growing sideways, and `cols` (the width is the layout's);
 *   - a drag handle to resize it (it grows; past `maxRows` it scrolls);
 *   - validating (it reports a length, the app decides);
 *   - a soft or filled look;
 *   - rich text, markdown or mentions;
 *   - a placeholder as the label.
 */
export function Textarea({
  rows: rowsProp = DEFAULT_ROWS,
  maxRows: maxRowsProp,
  characterLimit,
  size: sizeProp,
  invalid: invalidProp,
  block = false,
  className,
  style,
  id: idProp,
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  value,
  defaultValue,
  onChange,
  onBlur,
  ref,
  ...rest
}: TextareaProps) {
  const field = useField()
  const t = useMessages()
  const f = useFormat()
  const auto = useId()
  const id = field?.id ?? idProp ?? auto
  const box = useRef<HTMLTextAreaElement | null>(null)
  const setRef = useMemo(() => mergeRefs(box, ref), [ref])

  const { size, required, disabled, readOnly } = resolveControl(field, {
    size: sizeProp, required: requiredProp, disabled: disabledProp, readOnly: readOnlyProp
  })
  const ariaInvalid = rest['aria-invalid']
  const invalid = !!(invalidProp || field?.invalid || ariaInvalid === true || ariaInvalid === 'true')

  const rows = Math.max(1, Math.floor(rowsProp) || DEFAULT_ROWS)
  const maxRows = Math.max(rows, Math.floor(maxRowsProp ?? DEFAULT_MAX_ROWS) || DEFAULT_MAX_ROWS)
  const limit = characterLimit !== undefined && characterLimit >= 1 ? Math.floor(characterLimit) : undefined

  /* The text, during render: for the count, and for data-empty, so the
     Field's "required and empty" is right on the first paint and on the
     server. Exactly '' is empty — whitespace is not, as native
     `required` (valueMissing) says too. */
  const controlled = value !== undefined
  const [own, setOwn] = useState(() => String(defaultValue ?? ''))
  const text = controlled ? String(value ?? '') : own
  const empty = text === ''
  const count = limit === undefined ? 0 : countCharacters(text)
  const over = limit !== undefined && count > limit

  /* ---- growing ---- */
  /* Whether the engine sizes the box itself, read once from the computed
     style: an engine without field-sizing reports nothing, and so does an
     app that turned it off, and both get the fallback. */
  const native = useRef<boolean | null>(null)
  const grow = useCallback(() => {
    const el = box.current
    if (!el) return
    native.current ??= getComputedStyle(el).getPropertyValue('field-sizing') === 'content'
    if (native.current) return
    /* 'auto' first: scrollHeight is never less than the height already
       set, so without the reset the box grows and never comes back. The
       reset shrinks the page for a moment, and a page scrolled to its
       end would jump; its scroll position is put back. */
    const scroller = el.ownerDocument.scrollingElement
    const top = scroller?.scrollTop
    el.style.height = 'auto'
    const cs = getComputedStyle(el)
    const edges = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
    // min-block-size and max-block-size (rows, maxRows) clamp it.
    el.style.height = `${el.scrollHeight + edges}px`
    if (scroller && top !== undefined && scroller.scrollTop !== top) scroller.scrollTop = top
  }, [])

  useLayoutEffect(grow, [grow, text, rows, maxRows, size])

  /* Narrower, the same text takes more lines: the fallback measures
     again when the width changes, and only then — its own height change
     would otherwise call it back. */
  useEffect(() => {
    const el = box.current
    if (!el || native.current || typeof ResizeObserver === 'undefined') return
    let width = -1
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w === width) return
      width = w
      grow()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [grow])

  // A form reset puts an uncontrolled value back without an input event.
  const formAttr = rest.form
  useEffect(() => {
    if (controlled) return
    const form = box.current?.form
    if (!form) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onReset = () => {
      // The reset event fires BEFORE the values change; read after it.
      timer = setTimeout(() => { if (box.current) setOwn(box.current.value) }, 0)
    }
    form.addEventListener('reset', onReset)
    return () => {
      form.removeEventListener('reset', onReset)
      clearTimeout(timer)
    }
  }, [controlled, formAttr])

  /* ---- what is said ---- */
  useEffect(() => {
    if (limit !== undefined) ensureAnnouncer()
  }, [limit])
  const sayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(sayTimer.current), [])
  /* What is left, once the typing stops, and only while the person is
     still in the box. Read when it is said, so it is the text as it is
     then. */
  const sayLater = () => {
    if (limit === undefined) return
    clearTimeout(sayTimer.current)
    sayTimer.current = setTimeout(() => {
      const el = box.current
      if (!el || el.ownerDocument.activeElement !== el) return
      const n = countCharacters(el.value)
      const key = n > limit ? 'characterLimitOver' : 'characterLimitLeft'
      const k = Math.abs(limit - n)
      announce(t(key, { count: f.number(k), n: k }), t.lang(key))
    }, SAY_AFTER_MS)
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!controlled) setOwn(e.currentTarget.value)
    onChange?.(e)
    sayLater()
  }
  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    onBlur?.(e)
    clearTimeout(sayTimer.current)
  }

  /* Caution only from the Field's `required`: the Field draws the word
     beside it (InputFrame measured the edge alone saying it by hue). */
  const color = invalid ? 'danger' : field?.required && empty ? 'caution' : undefined

  /* ---- development only, and enforced: the sweep fails on warnings ---- */
  useControlChecks('Textarea', field, box, {
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    ariaLabel: rest['aria-label'],
    ariaLabelledBy: rest['aria-labelledby']
  })
  useEffect(() => {
    if (maxRowsProp !== undefined && maxRowsProp < rowsProp) {
      warn(`Textarea: maxRows (${maxRowsProp}) is less than rows (${rowsProp}); it stays ${rows} rows high.`)
    }
  }, [maxRowsProp, rowsProp, rows])
  useEffect(() => {
    if (characterLimit !== undefined && !(characterLimit >= 1)) warn(`Textarea: characterLimit={${characterLimit}} is not a length; no count is shown.`)
  }, [characterLimit])

  const limitId = limit === undefined ? undefined : `${id}-limit`

  return (
    /* The box directly inside a Field's control slot: Field reads
       data-empty here (useField's contract). */
    <div className="lcf-textarea" data-block={block || undefined} data-empty={empty || undefined}>
      <textarea
        {...rest}
        ref={setRef}
        id={id}
        className={clsx('lcf-textarea-el', className)}
        style={{ ...style, '--c-rows': rows, '--c-max-rows': maxRows } as CSSProperties}
        rows={rows}
        data-size={size}
        data-color={color}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        // Always written: with no attribute, Chrome reports the native
        // validity, and a screen reader hears "invalid" with no words.
        aria-invalid={invalid ? 'true' : 'false'}
        // Its own sentence first, then the app's, then the Field's — the
        // one that says Ctrl+Enter, since Enter is a new line here.
        aria-describedby={joinIds(limitId, rest['aria-describedby'], field?.describedByMultiline)}
      />
      {limit !== undefined && (
        <>
          {/* For the eye; the limit is said by the sentence below, what is
              left by the announcement. */}
          <span className="lcf-textarea-count" data-color={over ? 'danger' : undefined} aria-hidden="true" lang={t.lang('characterCount')}>
            {t('characterCount', { count: f.number(count), limit: f.number(limit) })}
          </span>
          {/* Over the limit, the description says by how much as well:
              found in review, a suggestion that arrived 25 over was
              described only as "Höchstens 160 Zeichen." (AX tree), the
              count in danger red for the eye alone until someone typed.
              A description, not a live region: read on focus, never over
              the typing. */}
          <span id={limitId} hidden lang={t.lang('characterLimit')}>
            {t('characterLimit', { limit: f.number(limit) })}
            {over && (
              <>
                {' '}
                <span lang={t.lang('characterLimitOver')}>
                  {t('characterLimitOver', { count: f.number(count - limit), n: count - limit })}
                </span>
              </>
            )}
          </span>
        </>
      )}
    </div>
  )
}
