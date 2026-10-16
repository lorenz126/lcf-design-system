#!/usr/bin/env bash
# The package, from the outside.
#
# Everything else in this repo runs against src/. This runs against what
# a consumer would install: `pnpm pack`, then a fresh Vite + React app in
# a temp directory that knows nothing about this repo, built for
# production and typechecked, then served STATICALLY and read in a real
# browser:
#
#   - the theme script set data-theme before the body painted
#   - a Button got its colour from the shipped CSS, through the layer
#   - the Tailwind preset turned a token into a utility
#   - de-CH printed 10'410.00, not whatever ICU the browser carries
#   - a NumberField imported from its own path found the Field imported
#     from another: one context instance survived preserveModules, so
#     the label names it and the description describes it; it shows
#     1'234.5, posts 1234.5, and marks its number lang="de-CH"
#
# Static on purpose. "Does it work without a server" is a question a
# consumer asked, and a `vite preview` of `dist/` is exactly that: an
# index.html and some files.
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill ${server:-0} 2>/dev/null || true' EXIT

echo "  packing"
(cd "$here" && pnpm pack --pack-destination "$tmp" >/dev/null)
tgz="$(ls "$tmp"/*.tgz)"
echo "  $(tar -tzf "$tgz" | wc -l | tr -d ' ') files in $(basename "$tgz")"

app="$tmp/app"
mkdir -p "$app/src"
cd "$app"

cat > package.json <<EOF
{
  "name": "consumer", "private": true, "type": "module",
  "dependencies": { "@lcf/design": "file:$tgz", "react": "^19.3.0", "react-dom": "^19.3.0" },
  "devDependencies": {
    "@types/react": "^19.3.0", "@types/react-dom": "^19.3.0", "@vitejs/plugin-react": "^6.1.0",
    "@tailwindcss/vite": "^4.3.0", "tailwindcss": "^4.3.0", "typescript": "^5.9.0", "vite": "^8.3.0"
  }
}
EOF

cat > tsconfig.json <<'EOF'
{ "compilerOptions": { "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler", "jsx": "react-jsx",
  "strict": true, "skipLibCheck": false, "noEmit": true, "types": [] }, "include": ["src"] }
EOF

cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwind()] })
EOF

cat > src/main.css <<'EOF'
@import "tailwindcss";
@import "@lcf/design/css";
@import "@lcf/design/tailwind";
EOF

cat > src/main.tsx <<'EOF'
import './main.css'
import { createRoot } from 'react-dom/client'
import { LcfProvider } from '@lcf/design/components/LcfProvider'
import { Button } from '@lcf/design/components/Button'
import { Badge } from '@lcf/design/components/Badge'
import { Alert } from '@lcf/design/components/Alert'
import { Field } from '@lcf/design/components/Field'
import { NumberField } from '@lcf/design/components/NumberField'
import { useFormat } from '@lcf/design/i18n'
import { useBreakpoint } from '@lcf/design/hooks/useBreakpoint'
import { useDocumentTheme } from '@lcf/design/theme'

function Price() {
  const f = useFormat()
  return <p id="price">{f.number(10410, { minimumFractionDigits: 2 })}</p>
}

function App() {
  const theme = useDocumentTheme()
  const wide = useBreakpoint('md')
  return (
    <LcfProvider locale="de-CH">
      <Button id="save" color="primary">Speichern</Button>
      <Badge color="success">Gewonnen</Badge>
      <Alert color="caution" title="Preis offen" onDismiss={() => {}} />
      <Price />
      <form id="offer"><Field label="Fläche" description="Netto"><NumberField unit="m2" defaultValue={1234.5} name="area" /></Field></form>
      <div id="tw" className="bg-danger-soft text-danger heading-md">Tailwind</div>
      <p>{theme} {String(wide)}</p>
    </LcfProvider>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
EOF

echo "  installing into an empty app"
pnpm install --silent >/dev/null 2>&1 || pnpm install

# The theme script, inlined into <head> as the docs say — read from the
# installed package, so it is the shipped string and not a copy.
script="$(node --input-type=module -e "import('@lcf/design/theme').then(m=>process.stdout.write(m.themeScript))")"
cat > index.html <<EOF
<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>consumer</title><script>$script</script></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
EOF

echo "  typechecking the app against the shipped declarations"
pnpm exec tsc -p tsconfig.json

echo "  building for production"
pnpm exec vite build --logLevel error

echo "  serving dist/ statically"
pnpm exec vite preview --port 6050 --strictPort >/dev/null 2>&1 &
server=$!
for _ in $(seq 1 50); do curl -sf http://localhost:6050 >/dev/null && break; sleep 0.2; done

cat > probe.mjs <<'EOF'
import { chromium } from '@playwright/test'
const b = await chromium.launch()
const ctx = await b.newContext()
await ctx.addInitScript(() => localStorage.setItem('theme', 'dark'))
const p = await ctx.newPage()
// What <html> said at the moment the body started to exist — before any
// stylesheet or module could have run.
let early = null
await p.exposeFunction('report', v => { early = v })
await ctx.addInitScript(() => {
  new MutationObserver((_, mo) => {
    if (document.body) { window.report(document.documentElement.dataset.theme ?? 'unset'); mo.disconnect() }
  }).observe(document, { childList: true, subtree: true })
})
const errors = []
p.on('pageerror', e => errors.push(e.message))
await p.goto('http://localhost:6050', { waitUntil: 'networkidle' })
const out = await p.evaluate(() => ({
  button: getComputedStyle(document.getElementById('save')).backgroundColor,
  tw: getComputedStyle(document.getElementById('tw')).color,
  twSize: getComputedStyle(document.getElementById('tw')).fontSize,
  price: document.getElementById('price').textContent,
  close: document.querySelector('.lcf-alert-x')?.getAttribute('aria-label'),
  field: (() => {
    const input = document.querySelector('#offer .lcf-number input:not([type=hidden])')
    return {
      labelId: document.querySelector('#offer .lcf-field-label')?.id,
      labelledBy: input?.getAttribute('aria-labelledby') ?? '',
      describedBy: input?.getAttribute('aria-describedby') ?? '',
      value: input?.value,
      posted: new FormData(document.getElementById('offer')).get('area'),
      lang: input?.getAttribute('lang')
    }
  })()
}))
await b.close()
const fail = []
if (early !== 'dark') fail.push(`theme before first paint: ${early}`)
if (!/rgb|color/.test(out.button) || out.button === 'rgba(0, 0, 0, 0)') fail.push(`button has no colour: ${out.button}`)
if (out.tw === 'rgb(0, 0, 0)' || out.twSize !== '24px') fail.push(`tailwind preset not applied: ${out.tw} ${out.twSize}`)
if (out.price !== "10'410.00") fail.push(`price: ${out.price}`)
if (out.close !== 'Ausblenden: Preis offen') fail.push(`message table: ${out.close}`)
const f = out.field
if (!f.labelId || !f.labelledBy.split(' ').includes(f.labelId)) fail.push(`NumberField did not find its Field (two contexts?): aria-labelledby="${f.labelledBy}", label id ${f.labelId}`)
if (!f.describedBy.split(' ').some(id => id.endsWith('-help'))) fail.push(`Field's description not wired: aria-describedby="${f.describedBy}"`)
if (f.value !== "1'234.5") fail.push(`NumberField shows ${f.value}`)
if (f.posted !== '1234.5') fail.push(`NumberField posts ${f.posted}`)
if (f.lang !== 'de-CH') fail.push(`NumberField lang ${f.lang}`)
if (errors.length) fail.push(...errors)
console.log(`  theme before paint: ${early} · button ${out.button} · tailwind ${out.tw} ${out.twSize} · price ${out.price} · "${out.close}"`)
console.log(`  field: "${f.value}" posts ${f.posted} · lang ${f.lang} · labelled by ${f.labelledBy} · described by ${f.describedBy}`)
if (fail.length) { console.error('  FAILED\n    ' + fail.join('\n    ')); process.exit(1) }
EOF
# Run from the package directory, where @playwright/test is installed;
# the app under test has no reason to depend on it.
cp probe.mjs "$here/.verify-probe.mjs"
trap 'kill ${server:-0} 2>/dev/null || true; rm -f "$here/.verify-probe.mjs"' EXIT
node "$here/.verify-probe.mjs"

echo "  the package works from outside, statically served"
