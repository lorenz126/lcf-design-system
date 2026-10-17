import { type ComponentPropsWithRef } from 'react';
import type { Unit } from '../../i18n/format';
import type { Size } from '../types';
export interface NumberFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'inputMode' | 'pattern' | 'maxLength' | 'minLength' | 'children'> {
    /** The committed number, in the unit shown: with `percent`, 15 is 15 %. null is empty, 0 is a value. undefined = uncontrolled. */
    value?: number | null;
    /** Default null. */
    defaultValue?: number | null;
    /** On commit (blur, Enter, an arrow key, a stepper press), and only when the number changed. Never per keystroke. Text it cannot read is never emitted. */
    onValueChange?: (value: number | null) => void;
    /** m2 m3 m mm cm km kg h percent CHF EUR: the i18n Unit type. */
    unit?: Unit;
    min?: number;
    max?: number;
    /** The grid a value must sit on (from `min`, or 0) and what an arrow moves by. Omitted: arrows move by 1, no grid check. */
    step?: number;
    /** Fraction digits always shown. Default 2 for CHF and EUR, else 0. The display never rounds. */
    minimumFractionDigits?: number;
    /** − and + buttons, outside the Tab order. md and lg only; ignored with a dev warning at sm (24px targets, WCAG 2.5.8). Default false. */
    stepper?: boolean;
    /** Field's size, else 'md'. */
    size?: Size;
    /** For a field whose words live elsewhere. Inside a Field, Field's `error` sets it; a problem of its own sets it too. */
    invalid?: boolean;
    /** Default false. */
    block?: boolean;
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
 *   carries 1234.5, never "1'234.5"; the visible box has no name. `form`
 *   reaches both, so a field outside the form it names is still
 *   validated by it; a form reset puts an uncontrolled field back to
 *   `defaultValue`.
 * - **`className` and `style` sit on its outer box**, which holds the
 *   frame, the problem line and the hidden input.
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
export declare function NumberField({ value, defaultValue, onValueChange, unit, min, max, step, minimumFractionDigits, stepper, size: sizeProp, invalid, block, className, style, id: idProp, name, form, disabled, readOnly, onKeyDown, onFocus, onBlur, ref, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, ...rest }: NumberFieldProps): import("react").JSX.Element;
