// Tracker — a small application that USES the framework rather than
// exhibiting it. It consumes the layer the same way any other project
// would, which makes it a second consumer test that runs every day.
export default defineNuxtConfig({
  extends: ['..'],
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false }
})
