import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { Color } from '../types';
export interface AlertProps extends Omit<ComponentPropsWithRef<'div'>, 'color' | 'title'> {
    /** What it means. The ground and the mark carry it; the words stay full-strength. */
    color?: Exclude<Color, 'secondary'> | 'secondary';
    /** soft: tinted ground (default). outline: a hairline on the page. */
    variant?: 'soft' | 'outline';
    /** What is the case, in a few words. Alone, it is the whole message. */
    title?: ReactNode;
    /** Replaced by children when there is more to say. */
    description?: ReactNode;
    /** Buttons for what to do about it. */
    actions?: ReactNode;
    /** Override the mark, or `false` for none. */
    indicator?: ReactNode | false;
    /** Shows a close button. The alert does not remember; the page does. */
    onDismiss?: () => void;
    /** A live region. Only for an alert that APPEARS — see above. */
    announce?: boolean;
}
/**
 * Alert — what the page says about itself.
 *
 * The distinction from a toast is the whole reason both exist. A toast
 * is what HAPPENED: it arrives, it is read, it leaves. An alert is what
 * IS: this offer is locked, this licence is unresolved, this form is
 * read-only. It has no timer because the condition has none, and it
 * sits in the layout rather than over it.
 *
 * SO IT IS USUALLY NOT A LIVE REGION. One that is on the page when the
 * page loads is read in order like everything else. `announce` is for the
 * other case — one that appears because of something the reader just
 * did — and picks the urgency: danger interrupts, the rest waits.
 *
 * TINT GROUND, FULL-STRENGTH TEXT, COLOURED MARK. The ground already
 * says the colour; colouring the words too says it twice and pays in
 * legibility — accent text on accent tint fell under AA in dark mode,
 * on a raised panel, twice. The mark keeps the colour; it is a graphic,
 * held to 3:1.
 *
 * Several of them in a row is a list of findings — blocks and hints from
 * a calculation — and should be one Alert with a list in its body, not a
 * stack of boxes.
 *
 * Its own word — "Dismiss" on the close button — carries `lang`, so a
 * German "Ausblenden" under an English document is read as German. The
 * title and body are the app's, and are never marked.
 */
export declare function Alert({ color, variant, title, description, actions, indicator, onDismiss, announce, className, children, ...rest }: AlertProps): import("react").JSX.Element;
