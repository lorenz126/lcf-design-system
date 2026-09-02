import { NuxtLink } from '#components'
import { defineNuxtPlugin } from '#app'

/**
 * Hand every component in the layer a link component that routes.
 *
 * A plain <a> reloads the document, which throws away the application it
 * is navigating. Sidebar and Breadcrumb therefore take a `link` prop —
 * and three separate times, in this framework's own workshop and its own
 * demo, that prop was passed a NAME instead of a component, or a symbol
 * that was never imported. Both fall back to <a> silently: the rows look
 * right, they highlight right, and they reload the page.
 *
 * The prop cannot defend itself. `undefined` is indistinguishable from
 * "not given", so there is nothing to warn about at runtime. What can be
 * fixed is the default, which is what this does: the components inject
 * `uiLink` and fall back to 'a' only when nothing provided one, so a
 * plain Vue app still works and a Nuxt app stops having to remember.
 *
 * This file is the only place in the layer that knows it is in Nuxt.
 * The components stay framework-agnostic; they just take what they are
 * given.
 */
export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.provide('uiLink', NuxtLink)
})
