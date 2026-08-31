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
 * Below --bp-md the sidebar leaves the layout and becomes an overlay,
 * because a fixed 260px column on a 700px screen is most of the screen.
 */
withDefaults(defineProps<{
  sidebarWidth?: string
  /** Controls the overlay sidebar on narrow screens. */
  open?: boolean
  /** Defaults to the viewport. Override to embed it — a preview frame,
   *  or an app that already owns the full-height element. */
  height?: string
}>(), { sidebarWidth: '260px', height: '100dvh' })

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <div class="u-shell" :style="{ '--sw': sidebarWidth, '--sh': height }">
    <aside class="u-shell-side" :class="{ 'u-shell-side-open': open }">
      <slot name="sidebar" />
    </aside>

    <!-- Only present while the overlay sidebar is, so it never intercepts
         a click on a wide screen. -->
    <button
      v-if="open"
      class="u-shell-scrim"
      aria-label="Close navigation"
      @click="open = false"
    />

    <div class="u-shell-main">
      <header v-if="$slots.topbar" class="u-shell-top">
        <slot name="topbar" :toggle="() => (open = !open)" />
      </header>
      <main class="u-shell-content">
        <slot />
      </main>
    </div>
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
  height: var(--sh);
  background: var(--bg);
  color: var(--fg);
}

.u-shell-side {
  grid-area: 1 / 1;
  border-inline-end: var(--border-width) solid var(--border);
  background: var(--bg-raised);
  overflow-y: auto;
  min-height: 0;
}

.u-shell-main {
  grid-area: 1 / 2;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  /* BOTH are needed. A grid item defaults to min-height:auto and refuses
     to shrink below its content, so without this the main column grows
     past the shell and the content region never overflows — it just
     spills, and nothing scrolls. */
  min-width: 0;
  min-height: 0;
}
.u-shell-top {
  border-block-end: var(--border-width) solid var(--border);
  background: var(--bg);
}
/* min-height:0 on the row plus overflow here is what makes THIS the
   scroll container rather than the page. */
.u-shell-content { overflow-y: auto; min-height: 0; }

.u-shell-scrim { display: none; }

@media (max-width: 860px) {
  .u-shell { grid-template-columns: minmax(0, 1fr); }
  .u-shell-side {
    position: absolute; inset-block: 0; inset-inline-start: 0;
    width: min(var(--sw), 84vw);
    z-index: var(--z-overlay);
    transform: translateX(-100%);
    transition: transform var(--dur-base) var(--ease-out);
  }
  .u-shell-side-open { transform: none; box-shadow: var(--shadow-4); }
  .u-shell-main { grid-area: 1 / 1; }
  .u-shell-scrim {
    display: block;
    position: absolute; inset: 0; z-index: calc(var(--z-overlay) - 1);
    border: 0; padding: 0;
    background: rgb(0 0 0 / .35);
  }
}
</style>
