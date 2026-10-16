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

/** A value's review state, told by the app. "Required and empty" is not here: it is derived, never told. */
export type FieldState = 'suggested' | 'confirmed'

/** Who the value came from. Shared by Field now and media items (MediaPanel, MediaCell) later. */
export type OriginSource = 'customer' | 'staff' | 'assumed' | 'missing'

/** The channel it arrived through. */
export type OriginChannel = 'email' | 'form'

/**
 * Where a value came from: "Kunde per E-Mail", "Ergänzt von Anna",
 * "Angenommen". Typed, so a field and a media item say it the same way
 * in every app; the words are the layer's, from the message table.
 */
export interface Origin {
  source: OriginSource
  via?: OriginChannel
  /** A person's name. With source 'staff': "Ergänzt von Anna". Ignored for other sources. */
  by?: string
}
