import { afterEach } from 'vitest'
import { config, enableAutoUnmount } from '@vue/test-utils'
import type { Component } from 'vue'

/* Unmount between tests. Clearing document.body is not unmounting: the
   component's teardown never runs, so anything it put on window — a
   command shortcut, a scroll listener — outlives the test that made it
   and answers keys in the next one. Which is also the assertion that
   these components clean up after themselves. */
enableAutoUnmount(afterEach)

/**
 * Two jobs, both of them "be Nuxt".
 *
 * FIRST: register ui/ globally, the way nuxt.config.ts does. A component
 * that reaches for <UiIcon> has no import for it, because in the layer it
 * never needs one. Stubbing them instead would test a Menu that has never
 * met a Popover, which is not the Menu anyone ships.
 *
 * SECOND: fill in the platform. happy-dom has no Popover API, no
 * ResizeObserver and no matchMedia, and this framework leans on all
 * three deliberately — the top layer, measured diagrams, one toggle for
 * two breakpoints. Every stub below is therefore a place where the test
 * stops testing reality, which is why each says what it is standing in
 * for and why nothing here decides an outcome on its own: the popover
 * stubs only record open state, and a test that turns on the answer it
 * wants from a stub is a test of the stub.
 */

/* ---------- ui/ as globals ---------- */

const modules = import.meta.glob('../ui/**/*.vue', { eager: true }) as Record<
  string,
  { default: Component }
>

for (const [path, mod] of Object.entries(modules)) {
  const name = path.split('/').pop()!.replace(/\.vue$/, '')
  config.global.components[`Ui${name}`] = mod.default
}

/* ---------- the platform happy-dom is missing ---------- */

/** The top layer. Real popovers also take focus and light-dismiss; these
 *  only remember whether they were opened, and no assertion depends on
 *  more than that. */
if (!Element.prototype.showPopover) {
  Element.prototype.showPopover = function (this: HTMLElement) {
    this.setAttribute('data-open', '')
  }
  Element.prototype.hidePopover = function (this: HTMLElement) {
    this.removeAttribute('data-open')
  }
}

/** `:popover-open` is a real selector in a browser and unknown here, so
 *  matches() throws on it. Answered from the attribute the stub sets. */
const matches = Element.prototype.matches
Element.prototype.matches = function (this: Element, selector: string) {
  if (selector === ':popover-open') return this.hasAttribute('data-open')
  return matches.call(this, selector)
}

/** Diagram measures itself and re-measures when the box changes. Nothing
 *  changes size in a test, so observing is a no-op — but constructing one
 *  must not throw, or the component never mounts. */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

/** AppShell asks this at the moment of a click rather than caching it.
 *  Tests that care about the breakpoint set `matches` themselves. */
if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false
  })) as unknown as typeof matchMedia
}

/** SearchField escapes generated ids before querying by them. */
if (!globalThis.CSS) {
  globalThis.CSS = { escape: (s: string) => s } as unknown as typeof CSS
} else if (!CSS.escape) {
  CSS.escape = (s: string) => s
}

/** scrollIntoView is called to keep an active option in view. */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
