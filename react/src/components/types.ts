/**
 * The vocabulary every component shares. A prop that means one of these
 * things is spelled this way everywhere — `color`, never `tone` here and
 * `intent` there — so that learning one component is learning the rest.
 */

/** What it means, not what hue it is. `primary` is the app's own colour. */
export type Color = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'caution' | 'danger' | 'discovery'

export const COLORS: readonly Color[] = ['primary', 'secondary', 'info', 'success', 'warning', 'caution', 'danger', 'discovery']

/**
 * How loud.
 *   solid    one per view: the thing you want pressed. White text.
 *   soft     tinted ground, coloured text. Secondary actions with a colour.
 *   outline  a hairline and the colour as text. No ground.
 *   ghost    no ground, no line until hovered. Tertiary.
 */
export type Variant = 'solid' | 'soft' | 'outline' | 'ghost'

/**
 * Three sizes and not nine. A fourth control height starts producing
 * controls nobody can tell apart; the ladder is 22, 26 and 32 pixels.
 */
export type Size = 'sm' | 'md' | 'lg'
