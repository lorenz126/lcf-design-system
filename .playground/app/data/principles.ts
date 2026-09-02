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
 *   - Cite the measurement where there is one. A number is the
 *     difference between a principle and an opinion.
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
  {
    group: 'Typography',
    scope: 'Type as a system of coupled decisions, not a list of sizes.',
    items: [
      {
        rule: 'Always move a type step whole.',
        why: 'A size is not a step. Line-height, weight and tracking travel with it, and taking the size while leaving the other three behind is exactly how a scale decays into a list of arbitrary numbers. Tracking is the one people drop: body at 15px wants −0.006em and display at 56px wants −0.027em, because the same letterfit does not survive the journey between them.'
      },
      {
        rule: 'Never uppercase a heading.',
        why: 'It costs the word shapes readers navigate by, and it is a shout that size and colour have already made unnecessary. At 11px with letter-spacing added to compensate it is the worst of both — harder to read and no more emphatic than the sentence case it replaced. Every heading in this system, in the sidebar and on the page, is set as it would be written.'
      },
      {
        rule: 'Always set chrome at one size, whatever height the control is.',
        why: 'A search field, a menu row and a navigation item are read the same way and belong at the same size. Letting text scale with its control put a 15px search box beside 13px navigation, and the difference said nothing — it just looked like a mistake. The control grows with `size`; the text barely does.'
      },
      {
        rule: 'Always set numbers meant to be compared in tabular figures.',
        why: 'Proportional digits leave a column ragged, and a ragged column has to be read rather than scanned — which defeats putting the numbers in a column. This is the whole reason .nums-tabular exists, and why a table applies it by column type rather than leaving it to the author.'
      }
    ]
  },
  {
    group: 'Controls',
    scope: 'Shape and sizing of interactive elements.',
    items: [
      {
        rule: 'Never name a component class after a generic word.',
        why: 'Scoped styles stop a component’s rules leaking out; they do nothing to stop the outside leaking in. A class called .wrap inherited 140px of padding from a global .wrap, and .row was overwritten by the page’s own .row — because Vue also stamps the parent’s scope id onto a child component’s root element. Every class in ui/ carries a u- prefix.'
      },
      {
        rule: 'Never fully round a button.',
        why: 'A capsule reads as a tag or a pill — a thing you filter by, not a thing you press. Buttons stay recognisably rectangular with soft corners. Enforced structurally: the radius is capped at 40% of the control height, so it holds even if the radius token is raised or the control is made shorter. A search field was a capsule for one afternoon and read as a label asking to be typed in.'
      },
      {
        rule: 'Never make one component answer two jobs.',
        why: 'A search field and a form field look close enough to merge and are not the same thing. One sits in a form, carries a label, help text and an error, and says "editable" with a border; the other lives in chrome, is named by its glyph, and is marked out by its ground. Reaching the second by adding `variant`, `leadingIcon` and `clearable` to the first would have produced one component that got both slightly wrong.'
      },
      {
        rule: 'Never pass a component’s name where the component is wanted.',
        why: 'A string is resolved against the runtime registry, and Nuxt’s auto-import is a build-time transform, so link="NuxtLink" rendered a literal <nuxtlink to="/type"> element. It looked right, it highlighted the current page right, and not one row could be clicked. A dynamic component that fails to resolve warns about nothing, so the prop type is what has to catch it: a Component, or the one string that is really a tag.'
      },
      {
        rule: 'Never read back a value you have just written through v-model.',
        why: 'defineModel does not apply the write locally when a parent binds v-model — it emits, and the value returns as a prop on the parent’s next render. Three components were caught by the same tick: a board planning its second move against the board as it was before the first, a suggestion list judging itself empty and refusing to open, an announcement permanently one move behind. Keep a local shadow, or wait a tick.'
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
      },
      {
        rule: 'Never grade a colour against the page when it will sit on a panel.',
        why: 'The tint recipe is calibrated against --bg, and a card, a menu and a sidebar are not --bg. On a raised surface in dark mode it costs roughly a point: a destructive menu row measured 4.34:1 and the current navigation row 4.04:1, both under AA, both looking perfectly fine to the eye. Found twice, three commits apart, which is why the contrast test now takes a backdrop per pair rather than assuming the page.'
      },
      {
        rule: 'Never say the same thing in colour twice.',
        why: 'A destructive menu row is already red; washing its ground in red as well was a second red bought with legibility. The current navigation row already says so with a tint and an edge bar; colouring its words made a third. Where a row is marked by other means, its text should be the strongest in the list rather than the weakest.'
      },
      {
        rule: 'Never let a categorical palette outrun what measures apart.',
        why: 'Three chart series is a ceiling that was measured, not chosen. All six Apple tones fail as a categorical set — yellow against orange sits at ΔE 6.5 for normal vision where the floor is 15, and under protanopia the hue collapses and only lightness is left. The chart palette is staggered in lightness and hue and stops at three. A fourth series is small multiples, not a fourth colour.'
      },
      {
        rule: 'Never let a component reach past the semantic tier.',
        why: 'Primitives are literal values, semantic tokens are roles, and only the second may appear in a component. That indirection is what makes it possible to re-theme, to add dark mode, or to fix a contrast failure in one place. It also has to be checked: --fg-primary, --bg-control and --fs-title3 were all written at some point, all fell back silently, and all looked close enough to pass.'
      }
    ]
  },
  {
    group: 'Space & Layout',
    scope: 'Rhythm, density, alignment.',
    items: [
      {
        rule: 'Always give a heading more space above it than below.',
        why: 'A heading belongs to the block under it, so equal margins leave it floating between two and belonging to neither. The failure is nearly always too little below rather than too much above: in the sidebar the gap under a heading was 4px — less than the row’s own padding — so the heading touched the first item it introduced.'
      },
      {
        rule: 'Always size a slot for the largest thing that can sit in it.',
        why: 'A sidebar’s icon slot was 16px while an avatar in it was 22px: the avatar overflowed by 6 and squeezed the gap to its label from 8px down to 2. And fix that size rather than letting the slot grow to its content: growing cures the crowding and breaks the column instead — rows with a glyph and rows with an avatar stop lining up. Fixed, at the size of the biggest occupant.'
      },
      {
        rule: 'Always clip with overflow: clip, never hidden.',
        why: 'hidden makes the element a scroll container, and anything position:sticky inside then sticks to that rather than to the viewport. A card has to clip, or a square child paints over its rounded corner — a table header did exactly that. Clipping it with hidden would have fixed the corner and stopped the header sticking; clip cuts without creating the container.'
      },
      {
        rule: 'Never truncate a number.',
        why: 'A truncated word is a shorter word and a reader completes it. A truncated number is a different number. Text may ellipsize; a numeric cell gets the width it needs, and the layout gives way rather than the value.'
      }
    ]
  },
  {
    group: 'Surface & Depth',
    scope: 'Elevation, borders, shadow, material.',
    items: [
      {
        rule: 'Always separate with a border; use shadow only for what is above the page.',
        why: 'The light in this system is in front, so a shadow is an even offset-free halo that reads as lifted toward the viewer. That makes a shadow a claim: this thing is ON the layout, not IN it. A grid where every card is raised makes the claim about all of them, so none of them read as raised. Border for cards, panels and wells; shadow for popovers, dialogs, floating buttons and anything being dragged.'
      },
      {
        rule: 'Always fade a clipped edge with a mask, never with a gradient.',
        why: 'A gradient has to know the colour behind it, and that colour changes with the theme and with whatever the thing has been placed on — a diagram on a card and the same diagram on the page need different fades. A mask knows nothing about the surface and is right on all of them.'
      },
      {
        rule: 'Never leave content clipped without saying so.',
        why: 'A diagram cut off at a card’s edge with no scrollbar does not look scrollable, it looks broken. Anything wider than what holds it scrolls, fades at the edge it runs past, and — because a region that scrolls has to be reachable without a mouse — becomes a tab stop with a name while it overflows, and stops being one when it does not.'
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
      },
      {
        rule: 'Always express a duration as a token.',
        why: 'Not for consistency — for the off switch. Every duration in the system resolves through four tokens, so prefers-reduced-motion collapses all of them to 1ms in one block. A single hardcoded 200ms is a transition that keeps running for the person who asked the operating system for it to stop.'
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
      },
      {
        rule: 'Never make the keyboard a second implementation.',
        why: 'On the kanban board the pointer and the keyboard call the same placeAt, and the drag handle and the keyboard grab point are one button. Two code paths for one operation is two behaviours that drift apart, and the one that drifts is always the keyboard’s, because it is the one nobody demonstrates.'
      },
      {
        rule: 'Never move focus into a list the user is typing above.',
        why: 'A combobox moves a highlight with aria-activedescendant and leaves focus in the field, because focus is where the next keystroke lands. Moving it into the list means every letter typed after the first arrow key goes somewhere other than the box being typed in — which is also why an option cancels its own mousedown, so clicking one never blurs the field out from under itself.'
      },
      {
        rule: 'Never let a mode outlive the focus that opened it.',
        why: 'A held kanban card whose handle lost focus left a board where no other card answered Enter: a state nobody could see and nothing could clear. A mode needs an exit that does not depend on remembering it is on — the blur that ends it, and a second route for when the browser withholds that blur, which it does whenever the window itself is not focused.'
      },
      {
        rule: 'Never give one surface two cursors.',
        why: 'In a menu the pointer and the keyboard move the same highlight, because there is only one place "here" can mean. A hover state on one row and a keyboard highlight on another is a control that appears to have lost track of itself.'
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
      },
      {
        rule: 'Never let a picture be the only form of its content.',
        why: 'A flowchart is unreadable to a screen reader, and "flowchart, image" tells nobody anything. But the flow itself is a sentence — Pull request leads to CI; CI leads to Green?; Green? leads to Review or to Fix it — so the drawing is aria-hidden and the graph is written out beside it. Which is also why its nodes carry no links: focusable content inside an aria-hidden subtree is a trap.'
      },
      {
        rule: 'Never let a limit lie about what it does.',
        why: 'A work-in-progress limit on a kanban column is shown and never enforced. Refusing the drop does not reduce work in progress; it moves the lie off the board, where it can no longer be seen. A number that reports is more useful than a gate that is worked around.'
      },
      {
        rule: 'Never ship a control that does not do its job.',
        why: 'A search box that does not search, a shortcut with no hint, a limit that counts nothing. Each is decoration wearing the costume of a control, and every one of them teaches the reader to stop trusting the others. The workshop’s own search really finds components, and says ⌘K on itself, for exactly this reason.'
      }
    ]
  }
]
