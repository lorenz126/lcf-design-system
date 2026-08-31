export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  // tokens/ is the artifact and stays framework-agnostic — the Nuxt app
  // consumes it exactly the way a real project would.
  css: [
    '~~/tokens/type.css',
    '~~/tokens/color.css',
    '~~/tokens/geometry.css',
    '~~/tokens/elevation.css',
    '~~/tokens/motion.css',
    '~/assets/css/site.css'
  ],
  // ui/ is the framework's own components — product, not viewer. Kept out
  // of app/ so the eventual Nuxt layer ships exactly this directory.
  components: [
    { path: '~~/ui', prefix: 'Ui', pathPrefix: false },
    { path: '~/components', pathPrefix: false }
  ],
  app: {
    head: {
      title: 'Design Framework',
      script: [{
        // Set the theme before first paint to avoid a flash.
        innerHTML: `(()=>{try{const s=localStorage.getItem('theme');
          document.documentElement.dataset.theme = s ||
            (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
        }catch(e){document.documentElement.dataset.theme='light'}})()`,
        tagPosition: 'head'
      }]
    }
  }
})
