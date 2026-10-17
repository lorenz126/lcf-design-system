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
export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';
export declare function applyDocumentTheme(theme: Theme): void;
export declare function getDocumentTheme(): Theme;
/** The live theme on <html>. Re-renders when anything changes it. */
export declare function useDocumentTheme(): Theme;
/**
 * Store a preference and apply it. `system` forgets the stored choice and
 * follows the OS — including later changes, which the listener below
 * picks up for as long as the page is open.
 */
export declare function setThemePreference(pref: ThemePreference): void;
export declare function getThemePreference(): ThemePreference;
/** Follow the OS while the preference is `system`. Returns the unsubscribe. */
export declare function followSystemTheme(): () => void;
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
export declare const themeScript: string;
