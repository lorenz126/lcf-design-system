/**
 * DESIGN PRINCIPLES — the rules behind the tokens.
 *
 * House style:
 *   - Start with Always or Never where you can. Hedged rules
 *     ("prefer", "try to") never settle anything.
 *   - One rule per entry. If it needs an "and", it is two rules.
 *   - Always give the reason. A rule you cannot justify is a habit,
 *     not a principle.
 *   - Negative rules matter as much as positive ones. What you refuse
 *     to do is most of what makes a style coherent.
 *
 * Adding one:
 *   { rule: 'Never use pure black.',
 *     why:  'It vibrates against white and reads as unconsidered.' }
 */

export interface Principle {
  rule: string
  why?: string
}

export interface PrincipleGroup {
  group: string
  /** Optional one-liner describing what this group governs. */
  scope?: string
  items: Principle[]
}

export const principles: PrincipleGroup[] = [
  { group: 'Typography',     scope: 'Type as a system of coupled decisions, not a list of sizes.', items: [] },
  { group: 'Color',          scope: 'Palette, semantics, contrast.', items: [] },
  { group: 'Space & Layout', scope: 'Rhythm, density, alignment.', items: [] },
  { group: 'Surface & Depth', scope: 'Elevation, borders, shadow, material.', items: [] },
  { group: 'Motion',         scope: 'Timing, easing, what earns animation.', items: [] },
  { group: 'Interaction',    scope: 'States, affordances, feedback.', items: [] },
  { group: 'Content & Voice', scope: 'Labels, tone, empty states, errors.', items: [] }
]
