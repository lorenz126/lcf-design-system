import { useSyncExternalStore } from 'react'

/**
 * `useBreakpoint('md')` — true at that width and above. Mobile first:
 * the base is the phone, and a breakpoint is where more room arrives.
 *
 * The widths are the ones the tokens document and the Tailwind preset
 * exposes, so a utility class and this hook agree on where `md` begins.
 * On the server, and on the first client render, the answer is false —
 * the phone layout — so hydration never disagrees with what was sent.
 */
export const BREAKPOINTS = { sm: 640, md: 860, lg: 1100, xl: 1440 } as const
export type Breakpoint = keyof typeof BREAKPOINTS

export function useBreakpoint(bp: Breakpoint): boolean {
  const query = `(min-width: ${BREAKPOINTS[bp]}px)`
  return useSyncExternalStore(
    onChange => {
      const mq = matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => matchMedia(query).matches,
    () => false
  )
}
