<script setup lang="ts">
import { FileText, Image, FileArchive, File, X, Upload } from 'lucide-vue-next'

/**
 * Attachments — a file list with its own drop zone.
 *
 * The picker is a real <label> wrapping a real <input type="file">. That
 * is what makes the whole zone keyboard-operable and announced as a file
 * control: Enter and Space open the picker with no key handling of our
 * own. A div with a click handler looks identical and is reachable only
 * by mouse.
 *
 * Drag-and-drop is an addition on top, never the only way in — a pointer
 * gesture that cannot be performed by keyboard or on most touch devices.
 */
export interface Attachment {
  id: string | number
  name: string
  size: number
  type?: string
  /** 0–100 while uploading; omit once complete. */
  progress?: number
  error?: string
}

const props = withDefaults(defineProps<{
  accept?: string
  multiple?: boolean
  disabled?: boolean
  /** Bytes. Enforced here so the caller cannot forget to. */
  maxSize?: number
  hint?: string
}>(), { multiple: true })

const files = defineModel<Attachment[]>({ default: () => [] })
const emit = defineEmits<{ add: [File[]]; remove: [Attachment] }>()

const input = useTemplateRef<HTMLInputElement>('input')
const dragging = ref(false)
const rejected = ref<string[]>([])

/** Binary units, because that is what a file manager shows. */
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let n = bytes / 1024
  let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${units[i]}`
}

function iconFor(a: Attachment) {
  const t = a.type ?? ''
  const ext = a.name.split('.').pop()?.toLowerCase() ?? ''
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return Image
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return FileArchive
  if (t.startsWith('text/') || ['pdf', 'md', 'txt', 'doc', 'docx'].includes(ext)) return FileText
  return File
}

/* Named `intake`, not `accept` — there is already an `accept` prop, and
   a setup binding of the same name shadows it in the template. */
function intake(list: FileList | null) {
  if (!list) return
  const ok: File[] = []
  const bad: string[] = []
  for (const f of list) {
    if (props.maxSize && f.size > props.maxSize) bad.push(`${f.name} is over ${formatSize(props.maxSize)}`)
    else ok.push(f)
  }
  rejected.value = bad
  if (ok.length) emit('add', ok)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  if (props.disabled) return
  intake(e.dataTransfer?.files ?? null)
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  intake(el.files)
  // Reset, or picking the same file twice in a row fires nothing.
  el.value = ''
}
</script>

<template>
  <div class="u-att">
    <label
      class="u-att-drop"
      :class="{ 'u-att-over': dragging, 'u-att-off': disabled }"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="input"
        type="file"
        class="u-att-input"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        @change="onInput"
      >
      <UiIcon :is="Upload" size="lg" class="u-att-icon" />
      <span class="u-att-cta">
        <strong>Choose files</strong> or drag them here
      </span>
      <span v-if="hint" class="u-att-hint">{{ hint }}</span>
    </label>

    <p v-for="r in rejected" :key="r" class="u-att-rejected" role="alert">{{ r }}</p>

    <!-- Additions are announced without moving focus, which would yank the
         reader out of the picker they are still using. -->
    <ul v-if="files.length" class="u-att-list" aria-live="polite">
      <li v-for="f in files" :key="f.id" class="u-att-item" :class="{ 'u-att-bad': !!f.error }">
        <UiIcon :is="iconFor(f)" class="u-att-fileicon" />

        <div class="u-att-meta">
          <span class="u-att-name">{{ f.name }}</span>
          <span class="u-att-sub">
            <template v-if="f.error">{{ f.error }}</template>
            <template v-else-if="f.progress != null">{{ f.progress }}% · {{ formatSize(f.size) }}</template>
            <template v-else>{{ formatSize(f.size) }}</template>
          </span>
          <UiProgress
            v-if="f.progress != null && !f.error"
            class="u-att-bar"
            size="sm"
            :value="f.progress"
            :label="`Uploading ${f.name}`"
          />
        </div>

        <UiButton
          variant="plain"
          tone="neutral"
          size="sm"
          icon-only
          :aria-label="`Remove ${f.name}`"
          :disabled="disabled"
          @click="emit('remove', f)"
        >
          <UiIcon :is="X" size="sm" />
        </UiButton>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.u-att { display: flex; flex-direction: column; gap: var(--s-5); }

.u-att-drop {
  display: flex; flex-direction: column; align-items: center; gap: var(--s-2);
  padding: var(--s-9) var(--s-7);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-lg);
  background: var(--bg-raised);
  cursor: pointer;
  text-align: center;
  transition: border-color var(--dur-fast) var(--ease-out),
              background-color var(--dur-fast) var(--ease-out);
}
.u-att-drop:hover { border-color: var(--fg-subtle); }
.u-att-over { border-color: var(--accent); background: var(--accent-subtle); }
.u-att-off { opacity: .5; cursor: not-allowed; }

/* Hidden from sight, not from the accessibility tree or the keyboard —
   display:none would take the label's control away with it. */
.u-att-input {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap;
}
.u-att-input:focus-visible + .u-att-icon { outline: none; }
.u-att-drop:has(.u-att-input:focus-visible) {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
}

.u-att-icon { color: var(--fg-subtle); }
.u-att-cta {
  font: var(--w-regular) var(--fs-body)/1.4 var(--font-sans);
  letter-spacing: var(--tr-body);
}
.u-att-cta strong { color: var(--accent-text); font-weight: var(--w-medium); }
.u-att-hint {
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
  color: var(--fg-muted);
}

.u-att-rejected {
  margin: 0;
  font: var(--w-regular) var(--fs-small)/1.5 var(--font-sans);
  color: var(--danger-text);
}

.u-att-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.u-att-item {
  display: flex; align-items: center; gap: var(--s-5);
  padding: var(--s-4) var(--s-5);
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-md);
}
.u-att-item + .u-att-item { margin-block-start: var(--s-3); }
.u-att-bad { border-color: var(--danger-text); }

.u-att-fileicon { color: var(--fg-muted); }
.u-att-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.u-att-name {
  font: var(--w-regular) var(--fs-body)/1.3 var(--font-sans);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.u-att-sub {
  font: var(--w-regular) var(--fs-caption)/1.3 var(--font-sans);
  color: var(--fg-muted);
}
.u-att-bad .u-att-sub { color: var(--danger-text); }

.u-att-bar { margin-block-start: var(--s-2); }
</style>
