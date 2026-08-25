<script setup lang="ts">
import type { PrincipleGroup } from '~/data/principles'
defineProps<{ group: PrincipleGroup }>()
</script>

<template>
  <section class="group">
    <div class="head">
      <h2>{{ group.group }}</h2>
      <span class="count">{{ group.items.length || '—' }}</span>
    </div>
    <p v-if="group.scope" class="scope">{{ group.scope }}</p>

    <div v-if="group.items.length">
      <div v-for="(p, i) in group.items" :key="p.rule" class="p">
        <div class="num">{{ String(i + 1).padStart(2, '0') }}</div>
        <div>
          <div class="rule"><RuleText :text="p.rule" /></div>
          <div v-if="p.why" class="why">{{ p.why }}</div>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      Not yet defined. Add entries to the <code>{{ group.group }}</code> group in
      <code>app/data/principles.ts</code>.
    </div>
  </section>
</template>

<style scoped>
.group { margin-bottom: 56px; }
.head {
  display: flex; align-items: baseline; gap: 12px;
  padding-bottom: 12px; border-bottom: 1px solid var(--rule);
}
h2 {
  margin: 0;
  font: var(--w-semibold) var(--fs-title-sm)/1.2 var(--font-sans);
  letter-spacing: var(--tr-title-sm);
}
.count { color: var(--ink-3); font-family: var(--font-mono); font-size: 11px; }
.scope {
  color: var(--ink-3);
  font: var(--w-regular) var(--fs-small)/1.5 var(--font-sans);
  margin: 10px 0 0;
}
.p {
  display: grid; grid-template-columns: 32px 1fr; gap: 16px;
  padding: 20px 0; border-bottom: 1px solid var(--rule);
}
.p:last-child { border-bottom: 0; }
.num { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); padding-top: 5px; }
.rule {
  font: var(--w-medium) var(--fs-lead)/1.45 var(--font-sans);
  letter-spacing: var(--tr-lead); margin-bottom: 6px;
}
.why {
  color: var(--ink-2);
  font: var(--w-regular) var(--fs-body)/1.55 var(--font-sans);
  letter-spacing: var(--tr-body);
  max-width: 68ch;
}
.empty {
  border: 1px dashed var(--rule); border-radius: 10px;
  padding: 22px; margin-top: 16px;
  color: var(--ink-3);
  font: var(--w-regular) var(--fs-small)/1.6 var(--font-sans);
}
code { font-family: var(--font-mono); font-size: 11px; color: var(--ink-2); }
</style>
