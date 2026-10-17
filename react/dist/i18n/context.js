import { createFormat } from "./format.js";
import { interpolate, resolveMessageLangs, resolveMessages } from "./messages.js";
import { createContext, useContext, useMemo } from "react";
import { jsx } from "react/jsx-runtime";
//#region src/i18n/context.tsx
var DEFAULT_LOCALE = "en-GB";
var fallback = {
	locale: DEFAULT_LOCALE,
	messages: resolveMessages(DEFAULT_LOCALE),
	messageLangs: resolveMessageLangs(DEFAULT_LOCALE),
	format: createFormat(DEFAULT_LOCALE),
	linkComponent: "a"
};
var Ctx = createContext(fallback);
function LcfProvider({ locale = DEFAULT_LOCALE, messages, format, separators, linkComponent = "a", children }) {
	const value = useMemo(() => ({
		locale,
		messages: resolveMessages(locale, messages),
		messageLangs: resolveMessageLangs(locale, messages),
		format: {
			...createFormat(locale, separators),
			...format
		},
		linkComponent
	}), [
		locale,
		messages,
		format,
		separators,
		linkComponent
	]);
	return /* @__PURE__ */ jsx(Ctx.Provider, {
		value,
		children
	});
}
function useLcf() {
	return useContext(Ctx);
}
/** `t('belowMin', { min: 3 })` — the component's sentence, in the app's language; `t.lang(key)` — the language it is in. */
function useMessages() {
	const { messages, messageLangs, locale } = useContext(Ctx);
	return useMemo(() => Object.assign((key, vars = {}) => interpolate(messages[key], vars, locale), { lang: (key) => messageLangs[key] }), [
		messages,
		messageLangs,
		locale
	]);
}
function useFormat() {
	return useContext(Ctx).format;
}
//#endregion
export { LcfProvider, useFormat, useLcf, useMessages };

//# sourceMappingURL=context.js.map