/**
 * NumberField's arithmetic, pure: reading what was typed, the grid a
 * value sits on, one arrow press, and what to show. No React here, so
 * every rule is tested on its own (number.test.ts).
 */
import type { Format, Unit } from '../../i18n/format';
import type { MessageKey } from '../../i18n/messages';
/** The spoken word for each unit — part of the field's name. */
export declare const UNIT_WORD: Record<Unit, MessageKey>;
/**
 * The text, ready for parseNumber: trimmed; the field's own unit taken
 * off the start or the end ("CHF 1'200", "12 %", "118 m2"); and a
 * trailing zero-cents dash dropped ("1'200.–"). Done on the raw text:
 * parseNumber reads digits and separators only, and refuses "118 m²"
 * (under the NFKC it once ran, "²" became "2" and that was 1182).
 *
 * Another unit is not taken off: "12 kg" in a square-metre field is not
 * a number, and saying so is better than guessing.
 */
export declare function preParse(text: string, unit?: Unit): string;
/** Fraction digits of a double as written: 0.05 → 2, 1e-7 → 7, 1.5e-7 → 8. */
export declare function decimals(x: number): number;
/** Whether `n` sits on the grid `base + k × step`. Exact, in scaled integers: 0.3 is on a 0.1 grid. */
export declare function onGrid(n: number, step: number, base?: number): boolean;
export interface Bounds {
    min?: number;
    max?: number;
    step?: number;
}
export interface Problem {
    key: 'notANumber' | 'belowMin' | 'aboveMax' | 'offStep';
    /** The number each placeholder stands for; formatted by the field. */
    value?: number;
}
/** What is wrong with a committed number, if anything: below, above, then off the grid. */
export declare function rangeProblem(n: number | null, { min, max, step }: Bounds): Problem | null;
/**
 * One arrow press (or ten, with Shift or Page keys) from `cur`.
 *
 * - Off the grid, the first move lands on the next grid point in the
 *   direction pressed (12.3 → 12.5 on a 0.5 grid), the rest add steps.
 * - From empty, the first press SETS a value and adds nothing: 0, or the
 *   nearest bound, snapped up onto the grid.
 * - The result is clamped to min and max, and with a step to the highest
 *   grid value at or below max. Arrows are gestures, not data, so they
 *   may clamp; what was typed never is.
 * - Scaled integers throughout: 0.1 + 0.2 by arrows is 0.3, not
 *   0.30000000000000004.
 */
export declare function stepFrom(cur: number | null, dir: 1 | -1, mult: number, { min, max, step }: Bounds): number;
/**
 * The number as the field shows it: the reader's own separators, at
 * least `minFractionDigits`, and never rounded — `toPrecision(15)` is a
 * double's honest precision, so 0.1 + 0.2 shows as 0.3 rather than
 * 0.30000000000000004, and 10.555 CHF stays 10.555.
 */
export declare function displayText(n: number, format: Format, minFractionDigits: number): string;
/**
 * The phone keyboard. iOS's decimal pad has no minus key, so it is only
 * offered where a minus can never be needed: with `min` at 0 or above.
 */
export declare function inputModeFor(min: number | undefined): 'decimal' | 'text';
/** What committing `text` would give: a number or null (empty), or unreadable. */
export declare function readText(text: string, unit: Unit | undefined, format: Format): {
    ok: true;
    value: number | null;
} | {
    ok: false;
};
