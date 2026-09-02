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

const pct = ref(38)
const busy = ref(true)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A file list that knows what a file is.</p>
      <p class="t-body body">
        An <strong>organism</strong> because it owns a data shape — name, size, type,
        progress, error — and decides what each of those becomes on a row. The bar in
        each row is <NuxtLink to="/atoms/progress">Progress</NuxtLink>, which was lifted
        out of here once it turned out everything else needed it too.
      </p>
    </div>

    <section>
      <div class="sec-label">Uploading, done and failed</div>
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
.col { max-width: 520px; gap: var(--s-7); }
.row { gap: var(--s-4); }
</style>
