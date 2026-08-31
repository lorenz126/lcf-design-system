<script setup lang="ts">
/**
 * Prose — typography for long-form content.
 *
 * Styles slotted markup rather than taking props, because the content
 * comes from somewhere else: markdown, a CMS, a docs pipeline. That makes
 * it a molecule — it knows no data shape, it only sets the rules the
 * content is read under.
 *
 * The vertical rhythm is asymmetric on purpose. A heading belongs to the
 * text BELOW it, so its top margin is large and its bottom margin small.
 * Equal margins make a heading float between two blocks and belong to
 * neither.
 */
withDefaults(defineProps<{
  /** `tight` for sidebars and cards, `wide` for a full article. */
  measure?: 'tight' | 'default' | 'wide' | 'full'
  size?: 'sm' | 'md'
}>(), { measure: 'default', size: 'md' })
</script>

<template>
  <div class="u-prose" :class="[`u-prose-${measure}`, `u-prose-${size}`]">
    <slot />
  </div>
</template>

<style scoped>
.u-prose {
  color: var(--fg);
  font: var(--w-regular) var(--fs-body)/1.65 var(--font-sans);
  letter-spacing: var(--tr-body);
}
.u-prose-sm { font-size: var(--fs-small); }

/* Only the text measure is constrained, not the container — a code block
   or an image should still be able to run full width. */
.u-prose-tight   :deep(> *) { max-width: 52ch; }
.u-prose-default :deep(> *) { max-width: 68ch; }
.u-prose-wide    :deep(> *) { max-width: 82ch; }
.u-prose-full    :deep(> *) { max-width: none; }

/* --- rhythm --- */
.u-prose :deep(> * + *) { margin-block-start: var(--s-6); }
.u-prose :deep(> :first-child) { margin-block-start: 0; }
.u-prose :deep(> :last-child) { margin-block-end: 0; }

/* --- headings --- */
.u-prose :deep(h1),
.u-prose :deep(h2),
.u-prose :deep(h3),
.u-prose :deep(h4) {
  color: var(--fg);
  font-weight: var(--w-semibold);
  text-wrap: balance;
}
.u-prose :deep(h1) {
  font-size: var(--fs-title-lg); line-height: 1.15;
  letter-spacing: var(--tr-title-lg);
}
.u-prose :deep(h2) {
  font-size: var(--fs-title); line-height: 1.25;
  letter-spacing: var(--tr-title);
}
.u-prose :deep(h3) {
  font-size: var(--fs-title-sm); line-height: 1.3;
  letter-spacing: var(--tr-title-sm);
}
.u-prose :deep(h4) {
  font-size: var(--fs-lead); line-height: 1.4;
  letter-spacing: var(--tr-lead);
}

/* A heading belongs to what follows it. */
.u-prose :deep(> h1 + *),
.u-prose :deep(> h2 + *),
.u-prose :deep(> h3 + *),
.u-prose :deep(> h4 + *) { margin-block-start: var(--s-4); }

.u-prose :deep(> * + h1) { margin-block-start: var(--s-11); }
.u-prose :deep(> * + h2) { margin-block-start: var(--s-10); }
.u-prose :deep(> * + h3) { margin-block-start: var(--s-9); }
.u-prose :deep(> * + h4) { margin-block-start: var(--s-8); }

/* Two headings in a row are one unit, not two blocks. */
.u-prose :deep(> h1 + h2),
.u-prose :deep(> h2 + h3),
.u-prose :deep(> h3 + h4) { margin-block-start: var(--s-5); }

/* --- inline --- */
.u-prose :deep(a) {
  color: var(--accent-text);
  text-decoration: underline;
  /* Sits clear of descenders instead of striking through them. */
  text-underline-offset: 0.15em;
  text-decoration-thickness: 0.06em;
}
.u-prose :deep(strong) { font-weight: var(--w-semibold); color: var(--fg); }
.u-prose :deep(code) {
  font-family: var(--font-mono);
  /* Mono runs optically larger at the same nominal size. */
  font-size: 0.9em;
  background: var(--fill);
  padding: 0.12em 0.35em;
  border-radius: var(--r-xs);
}

/* --- blocks --- */
.u-prose :deep(ul), .u-prose :deep(ol) { padding-inline-start: var(--s-7); }
.u-prose :deep(li + li) { margin-block-start: var(--s-2); }
.u-prose :deep(li::marker) { color: var(--fg-subtle); }

.u-prose :deep(blockquote) {
  margin-inline: 0;
  padding-inline-start: var(--s-6);
  border-inline-start: 2px solid var(--border-strong);
  color: var(--fg-muted);
}

.u-prose :deep(pre) {
  overflow-x: auto;
  padding: var(--s-6);
  border-radius: var(--r-md);
  background: var(--bg-sunken);
  border: var(--border-width) solid var(--border);
  font: var(--w-regular) var(--fs-small)/1.6 var(--font-mono);
  letter-spacing: 0;
}
.u-prose :deep(pre code) { background: none; padding: 0; font-size: inherit; }

.u-prose :deep(hr) {
  border: 0;
  border-top: var(--border-width) solid var(--border);
  margin-block: var(--s-10);
}

.u-prose :deep(img) { border-radius: var(--r-md); }
.u-prose :deep(figcaption) {
  margin-block-start: var(--s-3);
  font-size: var(--fs-caption);
  color: var(--fg-muted);
}

.u-prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-small);
}
.u-prose :deep(th), .u-prose :deep(td) {
  padding: var(--s-3) var(--s-5);
  border-bottom: var(--border-width) solid var(--border);
  text-align: start;
}
.u-prose :deep(th) { font-weight: var(--w-medium); color: var(--fg-muted); }
</style>
