<script setup lang="ts">
/**
 * AppShell — sidebar, topbar, content. Slots only, no data.
 *
 * The MAIN REGION scrolls, not the page. That is the decision this
 * template makes for you, and it has consequences worth knowing: a
 * position:sticky header inside the content sticks to the main region
 * rather than the viewport, and window scroll listeners see nothing.
 * The alternative — letting the page scroll — means the sidebar scrolls
 * away with it, which is not what an application chrome is for.
 *
 * WHERE THE TOP BAR STOPS is the other decision, and it is not cosmetic.
 * Spanning the full width makes the bar global: the brand belongs to the
 * whole app, and the sidebar toggle sits above the sidebar, over the
 * thing it controls. Stopping at the content makes the sidebar a peer of
 * the page, which suits a shell whose sidebar carries its own brand.
 * Full is the default, because that is where the toggle belongs.
 *
 * Below --bp-md the sidebar leaves the layout and becomes an overlay,
 * because a fixed 260px column on a 700px screen is most of the screen.
 *
 * That gives the sidebar TWO states, not one, and they are genuinely
 * different: wide, it is a column that narrows to a rail; narrow, it is
 * an overlay that opens over the content. `toggle` picks the right one,
 * so a top bar has one button and no idea which case it is in.
 *
 * COLLAPSED IS A RAIL, NOT A DISAPPEARANCE. Folding the column to zero
 * buys 260px and costs every destination in the application — you can no
 * longer see where you might go, only where you are. A rail keeps the
 * icons, and the sidebar slot is handed `collapsed` so what is in it can
 * render for the width it actually has.
 */
withDefaults(defineProps<{
  sidebarWidth?: string
  /** Width of the collapsed rail. Zero would hide it; see above. */
  railWidth?: string
  /** How far the top bar reaches. See above — this is a real choice. */
  topbar?: 'full' | 'main'
  /** Defaults to the viewport. Override to embed it — a preview frame,
   *  or an app that already owns the full-height element. */
  height?: string
}>(), { sidebarWidth: '260px', railWidth: '56px', topbar: 'full', height: '100dvh' })

/** Narrow screens: the overlay. */
const open = defineModel<boolean>('open', { default: false })
/** Wide screens: the column folds away. A different state, not the same
 *  one — which is why there are two models and one toggle. */
const collapsed = defineModel<boolean>('collapsed', { default: false })

/* The same 860px as the media query at the bottom of this file. --bp-md
   records it, but a custom property cannot be read by a media query or
   by matchMedia, so the number is written twice on purpose. */
const NARROW = '(max-width: 860px)'

/**
 * One button, whichever state the screen is in.
 *
 * The breakpoint is READ HERE rather than kept in a ref fed by a change
 * listener. A cached copy is a second source of truth that can be stale —
 * it was, and the toggle silently collapsed a column that the media query
 * had already replaced with an overlay, so the button did nothing.
 * Nothing renders from this value; it is only ever needed at the moment
 * of a click, and at that moment the browser can simply be asked.
 */
function toggle() {
  if (matchMedia(NARROW).matches) open.value = !open.value
  else collapsed.value = !collapsed.value
}
</script>

<template>
  <div
    class="u-shell"
    :class="[`u-shell-${topbar}`, { 'u-shell-collapsed': collapsed }]"
    :style="{ '--sw': sidebarWidth, '--rw': railWidth, '--sh': height }"
  >
    <header v-if="$slots.topbar" class="u-shell-top">
      <slot name="topbar" :toggle="toggle" :collapsed="collapsed" :open="open" />
    </header>

    <aside class="u-shell-side" :class="{ 'u-shell-side-open': open }">
      <slot name="sidebar" :collapsed="collapsed" />
    </aside>

    <!-- Only present while the overlay sidebar is, so it never intercepts
         a click on a wide screen. -->
    <button
      v-if="open"
      class="u-shell-scrim"
      aria-label="Close navigation"
      @click="open = false"
    />

    <main class="u-shell-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.u-shell {
  /* Containing block for the overlay sidebar below. Without it the
     overlay is positioned against the viewport and escapes an embedded
     shell entirely — covering the page around it rather than itself. */
  position: relative;
  display: grid;
  grid-template-columns: var(--sw) minmax(0, 1fr);
  /* The first row is `auto`, so with no topbar slot it collapses to
     nothing rather than reserving a gap. */
  grid-template-rows: auto minmax(0, 1fr);
  transition: grid-template-columns var(--dur-base) var(--ease-out);
  height: var(--sh);
  background: var(--bg);
  color: var(--fg);
}
.u-shell-full { grid-template-areas: "top  top" "side main"; }
.u-shell-main { grid-template-areas: "side top" "side main"; }

.u-shell-top {
  grid-area: top;
  border-block-end: var(--border-width) solid var(--border);
  background: var(--bg);
}

.u-shell-side {
  grid-area: side;
  border-inline-end: var(--border-width) solid var(--border);
  background: var(--bg-raised);
  overflow-y: auto;
  /* Clip sideways while the column is folding, or the sidebar's contents
     spill across the content area on the way in and out. */
  overflow-x: clip;
  min-height: 0;
}

.u-shell-collapsed { grid-template-columns: var(--rw) minmax(0, 1fr); }

/* min-height:0 on the row plus overflow here is what makes THIS the
   scroll container rather than the page. A grid item defaults to
   min-height:auto and refuses to shrink below its content, so without it
   the content never overflows — it just spills, and nothing scrolls. */
.u-shell-content {
  grid-area: main;
  overflow-y: auto;
  min-width: 0;
  min-height: 0;
}

.u-shell-scrim { display: none; }

@media (max-width: 860px) {
  /* The overlay takes over here, so a collapsed column must not also
     apply — otherwise the toggle appears to do nothing after a resize. */
  .u-shell,
  .u-shell-collapsed {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "top" "main";
  }
  .u-shell-side,
  .u-shell-collapsed .u-shell-side {
    position: absolute; inset-block: 0; inset-inline-start: 0;
    width: min(var(--sw), 84vw);
    z-index: var(--z-overlay);
    transform: translateX(-100%);
    transition: transform var(--dur-base) var(--ease-out);
  }
  .u-shell-side-open { transform: none; box-shadow: var(--shadow-4); }
  .u-shell-scrim {
    display: block;
    position: absolute; inset: 0; z-index: calc(var(--z-overlay) - 1);
    border: 0; padding: 0;
    background: rgb(0 0 0 / .35);
  }
}
</style>
