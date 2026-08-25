<script setup lang="ts">
/** Highlights Always/Never without resorting to v-html. */
const props = defineProps<{ text: string }>()
const parts = computed(() => props.text.split(/\b(Always|Never)\b/g))
</script>

<template>
  <span>
    <template v-for="(part, i) in parts" :key="i">
      <span
        v-if="part === 'Always' || part === 'Never'"
        :class="part === 'Always' ? 'kw-always' : 'kw-never'"
      >{{ part }}</span>
      <template v-else>{{ part }}</template>
    </template>
  </span>
</template>

<style scoped>
.kw-always { color: var(--always); font-weight: var(--w-semibold); }
.kw-never  { color: var(--never);  font-weight: var(--w-semibold); }
</style>
