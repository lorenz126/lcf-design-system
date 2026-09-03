#!/usr/bin/env bash
#
# The tarball test, as a script.
#
# check-package says what `files` WOULD ship. This is the other half: pack
# it, install the tarball into an empty project with nothing but Nuxt and
# Vue, build a page that uses the awkward components, and typecheck it
# from the consumer's side. A tarball, not a link — a link ignores
# `files`, and the whole point is to install what a stranger would get.
#
# Done by hand it took ten minutes and found that vue-tsc dies on
# TypeScript 7. Run it before a tag.
#
#   pnpm verify:consumer            # uses a temp dir, cleans up
#   KEEP=1 pnpm verify:consumer     # leaves the project behind to look at
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap '[ -n "${KEEP:-}" ] && echo "kept: $work" || rm -rf "$work"' EXIT

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

say "pack"
cd "$root"
tgz="$(npm pack --pack-destination "$work" 2>/dev/null | tail -1)"
echo "  $tgz ($(du -h "$work/$tgz" | cut -f1)), $(tar tzf "$work/$tgz" | wc -l | tr -d ' ') files"

say "an empty project"
mkdir "$work/consumer" && cd "$work/consumer"
npm init -y >/dev/null && npm pkg set type=module
# typescript@^5 on purpose: vue-tsc reads typescript/lib/tsc, which 7 no
# longer exports. A fresh install brings 7 today.
npm i "$work/$tgz" >/dev/null 2>&1
npm i -D nuxt vue lucide-vue-next vue-tsc "typescript@^5" >/dev/null 2>&1
echo "  $(node -p "Object.keys(require('./package.json').devDependencies).join(', ')")"

say "one copy of nuxt and of vue, at the top"
for p in nuxt vue; do
  n=$(find node_modules -type d -name "$p" -path "*node_modules/$p" -not -path "*/.pnpm/*" -not -path "*/.cache/*" | wc -l | tr -d ' ')
  [ "$n" = "1" ] && echo "  $p: 1" || { echo "  $p: $n copies"; exit 1; }
done

say "a page that uses the awkward ones"
cat > nuxt.config.ts <<'TS'
export default defineNuxtConfig({ extends: ['@lcf/design'] })
TS
mkdir -p app
cat > app/app.vue <<'VUE'
<script setup lang="ts">
import { Folder, Plus } from 'lucide-vue-next'
const when = ref<string | null>(null)
const country = ref<string | null>('de')
const vol = ref(40)
const opened = ref<(string | number)[]>(['src'])
const picked = ref<string | number | null>(null)
const dlg = ref(false)
const board = ref([
  { id: 'todo', label: 'To do', cards: [{ id: 1, title: 'Pack' }] },
  { id: 'done', label: 'Done', cards: [{ id: 2, title: 'Install' }] }
])
const rows = [{ id: 'a', name: 'api-gateway', reqs: 1284900 }]
const cols = [{ key: 'name', label: 'Service' }, { key: 'reqs', label: 'Requests', numeric: true }]
const nodes = [{ id: 'a', label: 'Pack' }, { id: 'b', label: 'Build' }]
const edges = [{ from: 'a', to: 'b' }]
const tree = [{ id: 'src', label: 'src', icon: Folder, children: [{ id: 'ui', label: 'ui' }] }]
const countries = [{ value: 'de', label: 'Germany' }, { value: 'ch', label: 'Switzerland' }]
</script>
<template>
  <div style="padding:40px;display:flex;flex-direction:column;gap:24px">
    <UiButton><template #leading><UiIcon :is="Plus" /></template>Solid</UiButton>
    <UiCombobox v-model="country" :options="countries" label="Combobox" />
    <UiDatePicker v-model="when" label="DatePicker" />
    <UiSlider v-model="vol" label="Slider" :ticks="[25, 50, 75]" show-value />
    <UiTable :columns="cols" :rows="rows" selectable />
    <UiCalendar />
    <UiTreeView v-model="picked" v-model:expanded="opened" :items="tree" label="Files" />
    <UiDiagram :nodes="nodes" :edges="edges" label="Flow" />
    <UiKanban v-model="board" label="Board" />
    <UiButton @click="dlg = true">Dialog</UiButton>
    <UiDialog v-model:open="dlg" title="Top layer">From the tarball.</UiDialog>
    <UiToaster /><UiCommandPalette />
  </div>
</template>
VUE

say "build"
npx nuxt build >/dev/null 2>&1 && echo "  built"

say "typecheck, from the consumer's side"
cat > tsconfig.json <<'JSON'
{ "extends": "./.nuxt/tsconfig.json" }
JSON
errors=$(npx nuxt typecheck 2>&1 | grep -c "error TS" || true)
[ "$errors" = "0" ] && echo "  0 errors" || { npx nuxt typecheck 2>&1 | grep "error TS"; exit 1; }

say "serve, and read the head"
PORT=3400 node .output/server/index.mjs >/dev/null 2>&1 &
pid=$!
sleep 4
html="$(curl -s http://localhost:3400/)"
kill $pid 2>/dev/null || true
theme=$(printf '%s' "$html" | grep -bo "localStorage.getItem('theme')" | head -1 | cut -d: -f1)
sheet=$(printf '%s' "$html" | grep -bo 'rel="stylesheet"' | head -1 | cut -d: -f1)
if [ -n "$theme" ] && { [ -z "$sheet" ] || [ "$theme" -lt "$sheet" ]; }; then
  echo "  theme script at byte $theme, ahead of every stylesheet"
else
  echo "  theme script: ${theme:-MISSING}; first stylesheet: ${sheet:-none}"; exit 1
fi
for c in u-btn u-cb u-dp u-sl-track u-tbl u-cal u-tv u-kb dialog; do
  printf '%s' "$html" | grep -q "$c" && echo "  $c rendered" || { echo "  $c MISSING from the server HTML"; exit 1; }
done

say "consumable"
