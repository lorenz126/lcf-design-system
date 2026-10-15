<script setup lang="ts">
/**
 * Button — the framework's first control.
 *
 * Six variants, matching how a hierarchy actually gets used:
 *   solid    one per screen. The thing you want pressed. White text, always.
 *   tinted   secondary actions that still carry colour. Coloured text, always.
 *   outline  neutral secondary. Carries no colour opinion.
 *   plain    tertiary. Reads as a link with a hit area.
 *   floating solid, lifted off the surface. For actions that sit ON content
 *            rather than in the layout — FABs, sticky bars, overlays.
 *   glass    translucent, blurs what is behind it. Only legible over a
 *            backdrop; on a flat surface it just looks like a weak outline.
 *
 * `tone` selects a hue from the palette. The solid and tinted recipes
 * resolve per hue, so a yellow button stays bright rather than turning
 * muddy — see tokens/color.css.
 */
type Variant = 'solid' | 'tinted' | 'outline' | 'plain' | 'floating' | 'glass'
type Tone = 'accent' | 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'neutral'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: Variant
  tone?: Tone
  size?: Size
  disabled?: boolean
  loading?: boolean
  block?: boolean
  /** Square button with no label. Requires ariaLabel. */
  iconOnly?: boolean
  /** The accessible name. Mandatory when iconOnly, since the glyph
   *  carries no text for a screen reader to announce. */
  ariaLabel?: string
  /** Renders as <a> when set. */
  href?: string
}>(), {
  variant: 'solid',
  tone: 'accent',
  size: 'md',
})

const tag = computed(() => (props.href ? 'a' : 'button'))
const isDisabled = computed(() => props.disabled || props.loading)

// Enforced rather than documented: an icon-only button with no
// accessible name is announced as "button" and nothing else.
if (import.meta.dev) {
  watchEffect(() => {
    if (props.iconOnly && !props.ariaLabel) {
      console.warn('[UiButton] iconOnly requires ariaLabel — the glyph gives a screen reader nothing to announce.')
    }
  })
}
</script>

<template>
  <component
    :is="tag"
    class="u-btn"
    :class="[
      `u-v-${variant}`,
      `u-s-${size}`,
      { 'u-block': block, 'u-loading': loading, 'u-icon-only': iconOnly }
    ]"
    :data-tone="tone"
    :href="href"
    :disabled="tag === 'button' ? isDisabled : undefined"
    :aria-disabled="tag === 'a' && isDisabled ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :aria-label="ariaLabel"
  >
    <!-- The spinner takes the leading slot's place rather than adding to
         it, so the button does not change width while it works. -->
    <UiSpinner v-if="loading" size="inherit" />
    <slot v-else name="leading" />
    <slot />
    <slot name="trailing" />
  </component>
</template>

<style scoped>
/* Each tone resolves to four local values; every variant below reads only
   these, so adding a hue never means touching a variant.
   NAMESPACED on purpose: --bg and --fg are global tokens, and redefining
   them here shadowed the real ones — neutral/plain resolved to white on
   white. Local custom properties must never reuse a token name. */
/* ACCENT IS THE ROLE, NOT A HUE. This used to share a rule with blue,
   which was invisible for as long as --accent WAS blue: the primary
   button read the blue tokens directly and happened to be right. It is
   only a bug once a consumer re-themes the accent — then every other
   component follows --accent and the primary button alone does not.
   --fg-on-accent rather than --solid-fg for the same reason: the token
   that names the text on an accent fill is the one this ground takes.
   The ground is --accent-solid-bg, not --accent. --accent is graded at
   the 3:1 UI floor, and painted straight it put white on the source
   blue at 4.02:1 on every page with a primary button. The two are a
   pair in check-contrast; --accent and text are not. */
.u-btn[data-tone="accent"] { --btn-bg: var(--accent-solid-bg);  --btn-fg: var(--fg-on-accent);
                           --btn-tint: var(--accent-subtle); --btn-onpage: var(--accent-text);   --btn-ink: var(--accent-text); }
.u-btn[data-tone="blue"]   { --btn-bg: var(--blue-solid-bg);   --btn-fg: var(--solid-fg);
                           --btn-tint: var(--blue-tint-bg); --btn-onpage: var(--blue-text);     --btn-ink: var(--blue-tint-fg); }
.u-btn[data-tone="yellow"] { --btn-bg: var(--yellow-solid-bg); --btn-fg: var(--solid-fg);
                           --btn-tint: var(--yellow-tint-bg); --btn-onpage: var(--yellow-text);   --btn-ink: var(--yellow-tint-fg); }
.u-btn[data-tone="green"]  { --btn-bg: var(--green-solid-bg);  --btn-fg: var(--solid-fg);
                           --btn-tint: var(--green-tint-bg); --btn-onpage: var(--green-text);    --btn-ink: var(--green-tint-fg); }
.u-btn[data-tone="purple"] { --btn-bg: var(--purple-solid-bg); --btn-fg: var(--solid-fg);
                           --btn-tint: var(--purple-tint-bg); --btn-onpage: var(--purple-text);   --btn-ink: var(--purple-tint-fg); }
.u-btn[data-tone="red"]    { --btn-bg: var(--red-solid-bg);    --btn-fg: var(--solid-fg);
                           --btn-tint: var(--red-tint-bg); --btn-onpage: var(--red-text);      --btn-ink: var(--red-tint-fg); }
.u-btn[data-tone="orange"] { --btn-bg: var(--orange-solid-bg); --btn-fg: var(--solid-fg);
                           --btn-tint: var(--orange-tint-bg); --btn-onpage: var(--orange-text);   --btn-ink: var(--orange-tint-fg); }
.u-btn[data-tone="neutral"]{ --btn-bg: var(--fg);   --btn-fg: var(--bg);
                           --btn-tint: var(--fill);
                           --btn-onpage: var(--fg); --btn-ink: var(--fg); }

.u-btn {
  --h: var(--control-md);
  /* PADDING IS A CONTROL TOKEN WITH A SPACING FALLBACK.
     It used to read --s-5 directly, which is a raw spacing step and has
     no relationship to --control-md. That holds only while the height
     never moves: raise the control scale for a denser or a roomier
     product and every button keeps 12px inside it, so the proportion
     drifts and the label ends up pinned to the edges of a tall box.
     The fallback is the value it always had, so a consumer that defines
     nothing renders exactly as before. */
  --pad: var(--control-pad-md, var(--s-5));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-3);
  height: var(--h);
  padding-inline: var(--pad);
  border: var(--border-width) solid transparent;
  /* Capped at 40% of the height so a button can never reach a capsule,
     whatever --r-control is set to or however short the control gets.
     Enforced here rather than by tuning the token, because the rule has
     to survive someone changing the radius later. */
  border-radius: min(var(--r-control), calc(var(--h) * 0.4));
  font: var(--w-medium) var(--fs-body)/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--dur-fast) var(--ease-out),
              border-color     var(--dur-fast) var(--ease-out),
              color            var(--dur-fast) var(--ease-out),
              box-shadow       var(--dur-fast) var(--ease-out),
              transform        var(--dur-instant) var(--ease-out);
}
.u-btn:active:not(:disabled):not([aria-disabled="true"]) { transform: scale(.975); }

/* One focus definition for every control in the system. */
.u-btn:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}

.u-s-sm { --h: var(--control-sm); --pad: var(--control-pad-sm, var(--s-4)); font-size: var(--fs-small); }
.u-s-md { --h: var(--control-md); --pad: var(--control-pad-md, var(--s-5)); }
.u-s-lg { --h: var(--control-lg); --pad: var(--control-pad-lg, var(--s-6)); font-size: var(--fs-lead); }
.u-block { display: flex; width: 100%; }

/* Square: the inline padding collapses to match the block padding, so the
   glyph sits in the middle of a box rather than in a short wide one. */
.u-icon-only { padding-inline: 0; aspect-ratio: 1; }

/* ---- variants ---- */
.u-v-solid   { background: var(--btn-bg); color: var(--btn-fg); }
.u-v-tinted  { background: var(--btn-tint); color: var(--btn-ink); }
.u-v-outline { background: transparent; color: var(--btn-onpage); border-color: var(--border-strong); }
.u-v-plain   { background: transparent; color: var(--btn-onpage); padding-inline: var(--s-3); }

/* Floating — the same solid recipe, lifted. The light is in front, so
   depth reads as SCALE rather than vertical travel: translating upward
   would imply a light source above and fight the even shadow. It grows
   toward the viewer on hover and drops back past its resting shadow on
   press, which is what makes it feel physical rather than decorated. */
.u-v-floating {
  background: var(--btn-bg);
  color: var(--btn-fg);
  box-shadow: var(--shadow-3);
}
.u-v-floating:hover:not(:disabled):not([aria-disabled="true"]) {
  box-shadow: var(--shadow-4);
  transform: scale(1.015);
}
.u-v-floating:active:not(:disabled):not([aria-disabled="true"]) {
  box-shadow: var(--shadow-1);
  transform: scale(.985);
}

/* Glass — tint, blur, rim, and a top highlight. The highlight is what
   separates glass from "a translucent rectangle": real glass catches
   light on its top edge. */
.u-v-glass {
  position: relative;
  background: var(--glass-bg);
  color: var(--btn-onpage);
  border-color: var(--glass-border);
  box-shadow: var(--shadow-2);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
}
.u-v-glass::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 50%;
  border-radius: inherit;
  background: linear-gradient(var(--glass-highlight), transparent);
  opacity: .35;
  pointer-events: none;
}
/* Glass hovers on the RIM and the shadow, for the reason the quiet
   variants hover on their border — and here the ground was losing twice.
   Mixing --glass-bg 30% toward --btn-onpage moved it toward the label
   (5.42:1 down to 3.35:1 over a white backdrop) AND raised its alpha
   from .74 to .82, so the pane it is supposed to be a pane OVER stopped
   showing through. A glass button that gets more opaque under the
   pointer is not hovering, it is curdling.
   The rim is where real glass shows a touch anyway, and lifting the
   shadow is the same physical move --v-floating already makes. */
.u-v-glass:hover:not(:disabled):not([aria-disabled="true"]) {
  border-color: var(--btn-onpage);
  box-shadow: var(--shadow-3);
}

/* Hover shifts toward the foreground so it works on light and dark from
   one declaration, instead of a hand-picked value per theme. */
.u-v-solid:hover:not(:disabled):not([aria-disabled="true"]),
.u-v-floating:hover:not(:disabled):not([aria-disabled="true"]) {
  background: color-mix(in srgb, var(--btn-bg) 88%, var(--btn-fg));
}
/* THE QUIET VARIANTS HOVER WITH A BORDER, NOT A GROUND.

   These three used to deepen their background by mixing it 40% TOWARD
   --btn-ink — the exact colour that has to be read on it. A hover that
   moves the ground toward the foreground always costs contrast, and
   these variants have none to spend: a tinted accent button measures
   4.51:1 at rest, which is AA with nothing left over. Mixed 40% toward
   its own label it lands at 2.50:1, so the hover state was the least
   legible state in the system — on the one variant a pointer is
   guaranteed to be sitting on.

   Nothing caught it because a contrast table lists resting pairs. A
   state that only exists under the pointer is exactly where an unmeasured
   recipe survives longest.

   The border is free. It is already declared at `transparent`, so
   colouring it moves no layout, and --btn-onpage clears 4.5:1 against
   the page where a boundary only needs 3. The ground does not move at
   all, which means the label reads the same before, during and after. */
.u-v-tinted:hover:not(:disabled):not([aria-disabled="true"]),
.u-v-plain:hover:not(:disabled):not([aria-disabled="true"]),
.u-v-outline:hover:not(:disabled):not([aria-disabled="true"]) {
  border-color: var(--btn-onpage);
}

.u-btn:disabled, .u-btn[aria-disabled="true"] {
  opacity: .4;
  cursor: not-allowed;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .u-btn { transition: none; }
}
</style>
