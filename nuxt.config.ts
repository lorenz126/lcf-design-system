import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Paths are resolved against this file, not the consumer's cwd — a layer
// is read from wherever it happens to be installed.
const layer = dirname(fileURLToPath(import.meta.url))
const token = (f: string) => join(layer, 'tokens', f)

export default defineNuxtConfig({
  css: [
    token('type.css'),
    token('color.css'),
    token('geometry.css'),
    token('elevation.css'),
    token('motion.css'),
    // Last: base APPLIES the tokens above, so it must resolve after them.
    join(layer, 'styles', 'base.css')
  ],

  components: [
    { path: join(layer, 'ui'), prefix: 'Ui', pathPrefix: false }
  ],

  app: {
    head: {
      script: [
        {
          // Set the theme before first paint. Shipped with the layer
          // rather than left to each consumer, because every app that
          // uses these tokens needs it and forgetting it means a flash
          // of the wrong theme on every cold load.
          innerHTML: `(()=>{try{const s=localStorage.getItem('theme');
            document.documentElement.dataset.theme = s ||
              (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
          }catch(e){document.documentElement.dataset.theme='light'}})()`,
          tagPosition: 'head'
        }
      ]
    }
  }
})
