import type { Component } from 'vue'

/**
 * The queue behind Toaster.
 *
 * A module-level store rather than provide/inject, so that anything can
 * raise one — a composable, an error handler, a route guard — without
 * being inside a particular component. The cost of that is a store
 * shared between requests on a server, which is why `show` does nothing
 * when there is no window: a toast rendered during SSR is one nobody
 * ever sees, and one that could arrive in somebody else's page.
 */
export type ToastTone = 'neutral' | 'green' | 'blue' | 'orange' | 'red'

export interface Toast {
  id: number
  title: string
  description?: string
  tone: ToastTone
  icon?: Component
  /**
   * A way out, not the only one. A toast disappears; anything that can
   * ONLY be done from here is a thing that can be missed by looking
   * away, so this is for shortcuts to somewhere else — never for the
   * single route to an outcome.
   */
  action?: { label: string; onClick: () => void }
  /** Milliseconds. 0 stays until dismissed. */
  duration: number
}

export interface ToastInput extends Partial<Omit<Toast, 'id' | 'title'>> {
  title: string
}

const items = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function show(input: ToastInput | string) {
    if (typeof window === 'undefined') return -1
    const t = typeof input === 'string' ? { title: input } : input
    const id = ++seq
    items.value = [
      ...items.value,
      {
        id,
        tone: 'neutral',
        /* Long enough to read a sentence, and something that stays put
           when it carries a way out — an action you have to race is not
           an action. */
        duration: t.action ? 10000 : 5000,
        ...t
      }
    ]
    return id
  }

  const dismiss = (id: number) => {
    items.value = items.value.filter(t => t.id !== id)
  }
  const clear = () => { items.value = [] }

  return {
    items,
    show,
    dismiss,
    clear,
    /* Sugar for the two that carry a tone by definition. Nothing else
       gets one: a toast that is always green stops meaning green. */
    success: (input: ToastInput | string) =>
      show({ ...(typeof input === 'string' ? { title: input } : input), tone: 'green' }),
    error: (input: ToastInput | string) =>
      show({ ...(typeof input === 'string' ? { title: input } : input), tone: 'red' })
  }
}
