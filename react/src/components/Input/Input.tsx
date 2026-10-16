import { InputFrame, type InputProps } from './InputFrame'

export type { InputProps, InputType } from './InputFrame'

/**
 * Input — one line of text.
 *
 * - **No label props.** Label, description and error are Field's. In a
 *   Field it takes its id, its description, `required`, `disabled`,
 *   `readOnly`, its size and its invalid state from the Field
 *   (`useField`), so nobody wires an id by hand; bare, it needs an
 *   `aria-label` or a `<label for>`, and says so in development.
 * - **A field's edge is what makes it a field.** A button is named by
 *   its label; an empty text field is found only by its border. So the
 *   frame is held to 3:1 under WCAG 1.4.11 by `--border-field`: 3.41:1
 *   light and 3.66:1 dark, where the Nuxt `--border-strong` measured
 *   1.48 and 1.91. The cost is an edge visibly darker than a button's
 *   hairline.
 * - **Invalid is not only a hue.** The edge turns danger and doubles to
 *   two pixels; the focus ring stays the one ring colour every control has.
 * - **Never styled from `:invalid`.** An empty required field matches
 *   `:invalid` the moment it loads. It is styled from what the app and
 *   the Field said — `aria-invalid` and `data-color` — and keeps native
 *   `required`, so `form.checkValidity()` still works.
 * - **`className` and `style` sit on the frame**, so adornments are
 *   layout, not a breaking change. `ref` and every other native prop go
 *   to the `<input>`; `onChange` is native, per keystroke.
 * - **Sizes match Button** — 22, 26 and 32px — so a field and its
 *   button sit on one line. The height is a minimum, so text spacing
 *   overrides (WCAG 1.4.12) grow it rather than clip it.
 * - **Refuses:**
 *   - a label, description or error of its own;
 *   - validating (it shows `invalid`, it does not decide it);
 *   - `type` number, date or search (NumberField, DatePicker and
 *     SearchField cover those);
 *   - `maxLength` (the browser truncates a paste without saying so);
 *   - a soft or filled look (its ground measured 1.09:1 against the page);
 *   - a pill;
 *   - a placeholder as the label;
 *   - masks or filtering keystrokes.
 */
export function Input(props: InputProps) {
  return <InputFrame {...props} />
}
