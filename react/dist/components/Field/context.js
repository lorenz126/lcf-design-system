import { createContext, useContext } from "react";
//#region src/components/Field/context.ts
var FieldContext = createContext(null);
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
*   `field.describedBy`, joined with `joinIds` (exported beside
*   `useField`).
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
*   (and, for Escape, `stopPropagation`). An unprevented Enter confirms;
*   an unprevented Escape goes back to the suggestion while there is
*   one (`onRevert`).
* - Read `--fld-value-fg` and `--fld-value-style` on the value text:
*   that is how a suggested value turns grey and italic.
* - Size: the control's own `size` prop wins, then `field.size`, then `'md'`.
* - Inside a Field only: `data-color="caution"` on the box while the
*   Field is required, the control empty and not invalid;
*   `data-color="danger"` while invalid.
*
* Never build a CSS selector from these ids: a React 19 useId id is not
* a valid selector. Use getElementById or a ref.
*/
function useField() {
	return useContext(FieldContext);
}
//#endregion
export { FieldContext, useField };

//# sourceMappingURL=context.js.map