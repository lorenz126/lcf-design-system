import { type ComponentPropsWithRef, type ReactNode } from 'react';
import type { FieldState, Origin, OriginSource, Size } from '../types';
export interface FieldProps extends Omit<ComponentPropsWithRef<'div'>, 'id' | 'children'> {
    /** What the value is. Required: a field nobody can name is a box nobody can find. */
    label: ReactNode;
    /** Visually hides the label (and its asterisk); it stays the name. Marks, actions and the required word stay visible. Default false. */
    hideLabel?: boolean;
    /** Guidance under the control. Stays when an error arrives. */
    description?: ReactNode;
    /** The app's verdict, in words. Anything that renders makes the control invalid; `true`, `false`, '' and null do not (dev warning on `true`). */
    error?: ReactNode;
    /** Default false. Native `required` on the control, an aria-hidden "*", and, while the control is empty, the word "Pflichtfeld" and a caution edge. */
    required?: boolean;
    /** Default false. OR'ed into the control. Hides the actions. */
    disabled?: boolean;
    /** Default false. OR'ed into the control. Hides the actions: a locked offer cannot be confirmed. */
    readOnly?: boolean;
    /** Sizes the control unless the control sets its own. Default undefined → the control's default 'md'. Field's own text does not scale. */
    size?: Size;
    /** Full width of its container. Default false. */
    block?: boolean;
    /** The CONTROL's id (an error summary links to it). Default useId(). */
    id?: string;
    /** What the value is: somebody's suggestion, or confirmed by a person. Default undefined (typed or edited). */
    state?: FieldState;
    /** Where the value came from. The source string is shorthand: origin="assumed". */
    origin?: Origin | OriginSource;
    /** The app's word or two for why this field matters: "Preistreiber". A mark beside the label, spoken as a sentence. */
    hint?: string;
    /** An icon for the hint, rendered aria-hidden. */
    hintIcon?: ReactNode;
    /** The suggested value as the field shows it ("118 m²", from useFormat().unit). Display only: the ↺ button's text and name, and the "Suggestion: …" sentence. */
    suggestion?: string;
    /** Makes the field confirmable: Enter in the control, or the ✓ button, calls this — unless the control reports a problem of its own (its `validity`), which is said instead. Enter then never submits the form. */
    onConfirm?: () => void;
    /** Back to the suggestion. Pass it only while there is something to go back to; ↺ shows exactly when it is given, and Escape in the control calls it. */
    onRevert?: () => void;
    /** Exactly one control. */
    children: ReactNode;
}
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
 *   word on each hides the ones that need a person. Text the control
 *   holds but could not commit is never drawn as the suggestion.
 *   Confirmed is a ✓. Required-and-empty is derived: the word and a
 *   caution edge, the one edge that clears 3:1 in colour, shown before
 *   any submit because in a review an empty required field is the to-do.
 *   The word stays with a hidden label: without it the edge says
 *   "required" by hue alone (1.0:1 against the resting edge, measured in
 *   light).
 * - **One Tab stop per field, and it is the control.** Enter confirms
 *   what is in the box, and a confirmable field never submits on Enter.
 *   ✓ and ↺ are for the pointer, out of the Tab order; Escape in the
 *   control is ↺ for the keyboard, once the control has no edit of its
 *   own to undo. Measured when ↺ was a Tab stop before the control: it
 *   sat in the forward path of the field ABOVE it, so Enter, Tab, Enter
 *   there threw away a typed override nobody had confirmed yet. Focus
 *   returns to the control after either action.
 * - **A confirm acts on what the box shows.** Before confirming, Field
 *   reads the control's `validity`: text NumberField could not read, a
 *   number out of range, a required field still empty stop Enter and ✓
 *   alike, and the reason is said instead. The app's own `error` does
 *   not stop it; that verdict is the app's to act on.
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
 *   - confirming a value the control itself calls wrong;
 *   - tracking origin (the app owns it, Field shows it);
 *   - inventing the app's words (`hint` is the app's);
 *   - colour as the only signal;
 *   - being a layout (no horizontal label mode, no grid);
 *   - the checkbox family (their label sits beside a control that comes
 *     first; the Nuxt finding);
 *   - a button in the forward Tab path;
 *   - moving focus when something is wrong.
 */
export declare function Field({ label, hideLabel, description, error, required, disabled, readOnly, size, block, id: idProp, state, origin: originProp, hint, hintIcon, suggestion, onConfirm, onRevert, children, className, onKeyDown, ref, ...rest }: FieldProps): import("react").JSX.Element;
