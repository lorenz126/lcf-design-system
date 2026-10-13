import { useSyncExternalStore } from 'react'

/**
 * Light and dark, as an attribute on <html>: `data-theme="dark"`.
 *
 * The app owns the choice and where it is kept; these helpers only read
 * and write the attribute, plus the one piece every app needs and most
 * forget — setting it before first paint. Without that, every cold load
 * of a dark-mode user flashes white.
 *
 * Nesting works: `<div data-theme="light">` inside a dark page is a light
 * island, because the tokens re-derive on every [data-theme] root.
 */
export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

const KEY = 'theme'

export function applyDocumentTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function getDocumentTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}

/** The live theme on <html>. Re-renders when anything changes it. */
export function useDocumentTheme(): Theme {
  return useSyncExternalStore(subscribe, getDocumentTheme, () => 'light')
}

function systemTheme(): Theme {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Store a preference and apply it. `system` forgets the stored choice and
 * follows the OS — including later changes, which the listener below
 * picks up for as long as the page is open.
 */
export function setThemePreference(pref: ThemePreference): void {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch { /* private mode: the choice lasts the page, which is all it can */ }
  applyDocumentTheme(pref === 'system' ? systemTheme() : pref)
}

export function getThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** Follow the OS while the preference is `system`. Returns the unsubscribe. */
export function followSystemTheme(): () => void {
  const mq = matchMedia('(prefers-color-scheme: dark)')
  const on = () => { if (getThemePreference() === 'system') applyDocumentTheme(systemTheme()) }
  mq.addEventListener('change', on)
  return () => mq.removeEventListener('change', on)
}

/**
 * The pre-paint script, as a string for a <script> in <head> — before
 * any stylesheet has a chance to paint. Same key as the Nuxt layer used,
 * so a user's stored choice survives an app's move from one to the other.
 *
 *   <script dangerouslySetInnerHTML={{ __html: themeScript }} />   // React SSR
 *   <script>{themeScript}</script>                                 // index.html
 *
 * Works the same in a static build (`ssr: false`, a plain index.html):
 * it runs in <head> before the body exists, whatever rendered the page.
 */
export const themeScript =
  `(()=>{try{var s=localStorage.getItem('${KEY}');document.documentElement.dataset.theme=s==='light'||s==='dark'?s:` +
  `(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}})()`
