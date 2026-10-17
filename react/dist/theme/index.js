import { useSyncExternalStore } from "react";
//#region src/theme/index.ts
var KEY = "theme";
function applyDocumentTheme(theme) {
	document.documentElement.dataset.theme = theme;
}
function getDocumentTheme() {
	if (typeof document === "undefined") return "light";
	return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
function subscribe(onChange) {
	const mo = new MutationObserver(onChange);
	mo.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"]
	});
	return () => mo.disconnect();
}
/** The live theme on <html>. Re-renders when anything changes it. */
function useDocumentTheme() {
	return useSyncExternalStore(subscribe, getDocumentTheme, () => "light");
}
function systemTheme() {
	return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
/**
* Store a preference and apply it. `system` forgets the stored choice and
* follows the OS — including later changes, which the listener below
* picks up for as long as the page is open.
*/
function setThemePreference(pref) {
	try {
		if (pref === "system") localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, pref);
	} catch {}
	applyDocumentTheme(pref === "system" ? systemTheme() : pref);
}
function getThemePreference() {
	try {
		const v = localStorage.getItem(KEY);
		return v === "light" || v === "dark" ? v : "system";
	} catch {
		return "system";
	}
}
/** Follow the OS while the preference is `system`. Returns the unsubscribe. */
function followSystemTheme() {
	const mq = matchMedia("(prefers-color-scheme: dark)");
	const on = () => {
		if (getThemePreference() === "system") applyDocumentTheme(systemTheme());
	};
	mq.addEventListener("change", on);
	return () => mq.removeEventListener("change", on);
}
/**
* The pre-paint script, as a string for a <script> in <head> — before
* any stylesheet has a chance to paint. Same key as the Nuxt layer used,
* so a user's stored choice survives an app's move from one to the other.
*
*   <script dangerouslySetInnerHTML={{ __html: themeScript }} />   // React SSR
*   <script>{themeScript}<\/script>                                 // index.html
*
* Works the same in a static build (`ssr: false`, a plain index.html):
* it runs in <head> before the body exists, whatever rendered the page.
*/
var themeScript = `(()=>{try{var s=localStorage.getItem('${KEY}');document.documentElement.dataset.theme=s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}})()`;
//#endregion
export { applyDocumentTheme, followSystemTheme, getDocumentTheme, getThemePreference, setThemePreference, themeScript, useDocumentTheme };

//# sourceMappingURL=index.js.map