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
  {
    group: 'Typography',
    scope: 'Type as a system of coupled decisions, not a list of sizes.',
    items: [
      {
        rule: 'Never set font-size on its own.',
        why: 'A type step is a bundle of size, line-height, weight and tracking. In SF these are not independently choosable — changing size without the other three produces text that is technically the right size and visibly wrong. Use a step class; add a step if none fits.'
      },
      {
        rule: 'Always use whole-number sizes.',
        why: 'Modular ratios generate values like 12.8px and 20.5px that land off the pixel grid and render soft. The ramp is hand-tuned instead: fine gradation in the UI range where hierarchy is subtle, wide jumps in the display range where it needs to be obvious.'
      },
      {
        rule: 'Line-height ratio tightens as size grows.',
        why: '1.47 at body, 1.06 at display. A single global line-height leaves every headline looking loose and unresolved. Large type needs less leading, not proportionally more.'
      },
      {
        rule: 'Always track type to SF’s curve.',
        why: 'Positive below 13px, zero at 13, increasingly negative above — asymptotic to about -0.035em. Untracked display type is the single most common tell of an unconsidered interface. Use .t-auto for sizes outside the ramp.'
      },
      {
        rule: 'Never use more than four weights.',
        why: 'SF ships nine. Regular, Medium, Semibold and Bold cover every real need. Past four, hierarchy stops reading as intentional and starts reading as accident.'
      },
      {
        rule: 'Always use tabular numerals for figures that align.',
        why: 'Tables, prices, timers, counters. SF’s default figures are proportional and will jitter column-to-column and frame-to-frame.'
      },
      {
        rule: 'Never let a line of body text exceed ~68 characters.',
        why: 'Beyond that the eye loses the return sweep and re-reads lines. Use .measure rather than trusting the container to be sensible.'
      }
    ]
  },

  /* ---- Yours to fill. Seeded empty on purpose. ---- */
  { group: 'Color',           scope: 'Palette, semantics, contrast.', items: [] },
  { group: 'Space & Layout',  scope: 'Rhythm, density, alignment.', items: [] },
  { group: 'Surface & Depth', scope: 'Elevation, borders, shadow, material.', items: [] },
  { group: 'Motion',          scope: 'Timing, easing, what earns animation.', items: [] },
  { group: 'Interaction',     scope: 'States, affordances, feedback.', items: [] },
  { group: 'Content & Voice', scope: 'Labels, tone, empty states, errors.', items: [] }
]
