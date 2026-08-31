// The workshop. Consumes the layer exactly the way a real project would,
// so anything broken about the layer's public surface breaks here first.
export default defineNuxtConfig({
  extends: ['..'],
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  css: ['~/assets/css/site.css'],
  components: [{ path: '~/components', pathPrefix: false }]
})
