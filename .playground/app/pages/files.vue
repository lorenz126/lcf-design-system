<script setup lang="ts">
useHead({ title: 'Attachments — Design Framework' })

interface Att { id: number; name: string; size: number; type?: string; progress?: number; error?: string }

const files = ref<Att[]>([
  { id: 1, name: 'brand-guidelines.pdf', size: 2_418_000, type: 'application/pdf' },
  { id: 2, name: 'hero-shot.png', size: 8_940_000, type: 'image/png', progress: 62 },
  { id: 3, name: 'archive.zip', size: 141_000_000, error: 'Upload failed — file is too large.' }
])
let next = 4

function add(incoming: File[]) {
  for (const f of incoming) {
    const item: Att = { id: next++, name: f.name, size: f.size, type: f.type, progress: 0 }
    files.value.push(item)
    // Stand-in for a real upload, so the progress element can be seen working.
    const tick = setInterval(() => {
      const found = files.value.find(x => x.id === item.id)
      if (!found) return clearInterval(tick)
      found.progress = Math.min(100, (found.progress ?? 0) + 12)
      if (found.progress >= 100) { clearInterval(tick); delete found.progress }
    }, 220)
  }
}

function remove(f: Att) {
  files.value = files.value.filter(x => x.id !== f.id)
}
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">The drop zone is a label, not a div.</p>
      <p class="t-body body">
        It wraps a real <code>&lt;input type="file"&gt;</code>, which is what makes the
        whole area keyboard-operable and announced as a file control — Enter and Space
        open the picker with no key handling of our own. A div with a click handler
        looks identical and is reachable only by mouse.
      </p>
    </div>

    <section>
      <div class="sec-label">Attachments</div>
      <div class="col">
        <UiAttachments
          v-model="files"
          :max-size="100 * 1024 * 1024"
          hint="PDF, images or archives up to 100 MB"
          @add="add"
          @remove="remove"
        />
      </div>
      <p class="t-caption hint">
        Drag a file in, or tab to the zone and press Enter. Drag-and-drop is an
        addition on top — never the only way in, since it is a pointer gesture that
        cannot be performed by keyboard and works on almost no touch device.
      </p>
      <p class="t-caption hint">
        Progress is a real <code>&lt;progress&gt;</code> element: the value is
        announced, and the platform still draws it if our styling never arrives. The
        size limit is enforced inside the component rather than left to the caller —
        try dropping something over 100 MB.
      </p>
    </section>
  </div>
</template>

<style scoped>
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0; color: var(--ink-2); max-width: 68ch; }
code { font-family: var(--font-mono); font-size: 11px; }
section { margin-bottom: 64px; }
.col { max-width: 520px; }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
</style>
