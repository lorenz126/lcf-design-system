/**
 * The platform this framework sits on, ahead of the DOM library.
 *
 * Every declaration here is a real, shipping API that TypeScript's
 * lib.dom has not caught up with — which is the same lag the components
 * already work around at runtime, written down once instead of cast
 * around at each call site.
 *
 * A line leaving this file is a good sign: it means the DOM library
 * learned the API, and the declaration became a duplicate rather than a
 * fill-in. Check before adding one that it is genuinely missing.
 */

interface Element {
  /**
   * The popover API on Element rather than HTMLElement, because
   * tests/setup.ts patches Element.prototype — the layer's own calls all
   * go through HTMLElement, where lib.dom already has it.
   */
  showPopover?: () => void
  hidePopover?: () => void
}

interface CSSStyleDeclaration {
  /** CSS anchor positioning. DatePicker sets both per instance, because
   *  a name in a stylesheet is a name every copy shares. */
  anchorName: string
  positionAnchor: string
}
