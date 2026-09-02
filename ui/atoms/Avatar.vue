<script setup lang="ts">
/**
 * Avatar — a small square or round mark standing in for someone or
 * something.
 *
 * SHAPE CARRIES MEANING: circles are people, squares are things. Both a
 * user and a workspace need a mark, and if they look the same the sidebar
 * stops telling you which is which. That is the whole reason `shape`
 * exists rather than one house style.
 *
 * COLOUR IS DERIVED, NOT CONFIGURED. With no `tone`, the hue comes from
 * the name — so the same workspace is the same colour on every screen it
 * appears on, and nobody has to maintain a map of thing-to-colour. Pass a
 * tone explicitly when the colour means something (a status, a brand).
 *
 * Decorative by default, like Icon: it is nearly always sitting next to
 * the name it depicts, and announcing that name twice helps no one. Pass
 * `label` when the avatar stands alone.
 */
type Tone = 'neutral' | 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange'

const props = withDefaults(defineProps<{
  /** Used for the initials, and for the derived colour. */
  name?: string
  src?: string
  /** Shown instead of initials — an emoji or a single glyph. */
  text?: string
  /** Omit to derive it from the name. */
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
  shape?: 'circle' | 'square'
  /** Accessible name. Omit when the adjacent text already says it. */
  label?: string
}>(), { size: 'md', shape: 'circle' })

const HUES = ['blue', 'green', 'purple', 'orange', 'red', 'yellow'] as const

/**
 * Stable across reloads and machines: the same name is the same hue.
 *
 * A multiplicative hash, not a sum of character codes. Summing puts
 * names of similar length and alphabet into neighbouring totals, and
 * mod six they collapse onto two or three colours — which defeats the
 * only thing the derived colour is for, telling two rows apart.
 */
const tone = computed<Tone>(() => {
  if (props.tone) return props.tone
  const n = props.name ?? props.text ?? ''
  if (!n) return 'neutral'
  let h = 5381
  for (const ch of n) h = (Math.imul(h, 33) ^ ch.codePointAt(0)!) >>> 0
  return HUES[h % HUES.length]!
})

/** First letters of the first two words. "dewa commercial" -> DC. */
const initials = computed(() => {
  if (props.text) return props.text
  return (props.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => [...w][0]!.toUpperCase())
    .join('')
})
</script>

<template>
  <span
    class="u-av"
    :class="[`u-av-${size}`, `u-av-${shape}`]"
    :data-tone="tone"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <img v-if="src" class="u-av-img" :src="src" alt="">
    <span v-else class="u-av-text">{{ initials }}</span>
  </span>
</template>

<style scoped>
.u-av {
  flex: none;
  display: inline-grid;
  place-items: center;
  overflow: clip;
  width: var(--av);
  height: var(--av);
  background: var(--av-bg, var(--fill));
  color: var(--av-fg, var(--fg-muted));
  user-select: none;
}

/* Sized off the control scale, so an avatar in a row lines up with the
   buttons and fields beside it instead of being its own scale. */
.u-av-sm { --av: var(--control-sm); font-size: 9px; }
.u-av-md { --av: var(--control-md); font-size: 10px; }
.u-av-lg { --av: var(--control-lg); font-size: var(--fs-caption); }

.u-av-circle { border-radius: var(--r-full); }
.u-av-square { border-radius: var(--r-sm); }
.u-av-lg.u-av-square { border-radius: var(--r-md); }

.u-av-text {
  font-family: var(--font-sans);
  font-weight: var(--w-semibold);
  letter-spacing: .02em;
  line-height: 1;
}
.u-av-img { width: 100%; height: 100%; object-fit: cover; }

/* The measured tint recipe, the same one Badge uses. */
.u-av[data-tone="blue"]   { --av-bg: var(--blue-tint-bg);   --av-fg: var(--blue-tint-fg); }
.u-av[data-tone="green"]  { --av-bg: var(--green-tint-bg);  --av-fg: var(--green-tint-fg); }
.u-av[data-tone="purple"] { --av-bg: var(--purple-tint-bg); --av-fg: var(--purple-tint-fg); }
.u-av[data-tone="orange"] { --av-bg: var(--orange-tint-bg); --av-fg: var(--orange-tint-fg); }
.u-av[data-tone="red"]    { --av-bg: var(--red-tint-bg);    --av-fg: var(--red-tint-fg); }
.u-av[data-tone="yellow"] { --av-bg: var(--yellow-tint-bg); --av-fg: var(--yellow-tint-fg); }
</style>
