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
  {
    group: 'Controls',
    scope: 'Shape and sizing of interactive elements.',
    items: [
      {
        rule: 'Never name a component class after a generic word.',
        why: 'Scoped styles stop a component\u2019s rules leaking out; they do nothing to stop the outside leaking in. A class called .wrap inherited 140px of padding from a global .wrap, and .row was overwritten by the page\u2019s own .row \u2014 because Vue also stamps the parent\u2019s scope id onto a child component\u2019s root element. Every class in ui/ carries a u- prefix.'
      },
      {
        rule: 'Never fully round a button.',
        why: 'A capsule reads as a tag or a pill — a thing you filter by, not a thing you press. Buttons stay recognisably rectangular with soft corners. Enforced structurally: the radius is capped at 40% of the control height, so it holds even if the radius token is raised or the control is made shorter.'
      }
    ]
  },
  {
    group: 'Color',
    scope: 'Palette, semantics, contrast.',
    items: [
      {
        rule: 'Never set small body text in yellow or orange.',
        why: 'Both are tuned for chroma rather than contrast — at the lightness that would clear AA on a light ground they lose their saturation and read as brown. They measure about 3.3:1, which carries a badge or a large label but not a paragraph. If yellow has to say something in running text, the words do the work and the colour is decoration.'
      }
    ]
  },
  { group: 'Space & Layout', scope: 'Rhythm, density, alignment.', items: [] },
  {
    group: 'Surface & Depth',
    scope: 'Elevation, borders, shadow, material.',
    items: [
      {
        rule: 'Always separate with a border; use shadow only for what is above the page.',
        why: 'The light in this system is in front, so a shadow is an even offset-free halo that reads as lifted toward the viewer. That makes a shadow a claim: this thing is ON the layout, not IN it. A grid where every card is raised makes the claim about all of them, so none of them read as raised. Border for cards, panels and wells; shadow for popovers, dialogs, floating buttons and anything being dragged.'
      }
    ]
  },
  {
    group: 'Motion',
    scope: 'Timing, easing, what earns animation.',
    items: [
      {
        rule: 'Never hand a state the browser already owns to JavaScript.',
        why: 'Overlays proved it twice. Opening a popover from a click handler races the same click as it keeps bubbling — it opens, the click reaches the document, and light-dismiss shuts it in the same tick; handing the toggle to popovertarget removes the race instead of papering over it with stopPropagation. And <dialog>.showModal() supplies the focus trap, Escape, the inert background, the top layer and focus returning to the trigger: five things a hand-built modal reimplements and usually gets one of wrong.'
      }
    ]
  },
  {
    group: 'Interaction',
    scope: 'States, affordances, feedback.',
    items: [
      {
        rule: 'Always use one focus colour, on every control.',
        why: 'A focus ring answers "where am I", not "what kind of thing is this". Tinting it per tone — red on destructive, green on confirm — costs instant recognisability and buys nothing, since the control itself already carries the tone. It is also solid rather than translucent: the accent at 45% alpha measured 2.54:1 on white and 1.21:1 on the dark page, below the 3:1 WCAG asks of a focus indicator.'
      }
    ]
  },
  {
    group: 'Content & Voice',
    scope: 'Labels, tone, empty states, errors.',
    items: [
      {
        rule: 'Always move focus to the error summary on a failed submit.',
        why: 'Errors usually render above where the user is standing. Without moving focus they are never announced and nothing visibly changes below the fold, so the form simply appears not to submit — the user presses the button again. The summary takes focus, carries role="alert", and every entry links to its field, which is why every control accepts an id: it generates one otherwise, and nothing outside could reference it.'
      }
    ]
  }
]
