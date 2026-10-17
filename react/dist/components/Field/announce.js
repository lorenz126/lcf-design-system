//#region src/components/Field/announce.ts
/**
* Say something to a screen reader that is not on the screen — the Nuxt
* layer's useAnnounce, carried over with its two measured rules.
*
* - THE REGION HAS TO EXIST BEFORE THE MESSAGE DOES. A live region that
*   arrives already holding text is usually not announced at all; what
*   is announced is a change inside a region already being watched. So
*   it is created empty, in an effect (never during render, so a server
*   render has nothing to disagree with), before there is anything to say.
* - THE SAME SENTENCE TWICE IS NOT A CHANGE. It is cleared first and
*   filled on the next frame, so "Bestätigt." after "Bestätigt." is
*   still heard.
* - EVERYTHING SAID IN ONE EVENT IS SAID. Messages that arrive before
*   the frame are queued and rendered together, in order, each in its
*   own <span lang>. Measured when the second replaced the first: Enter
*   in a confirmable field committed 20 against a max of 15, NumberField
*   said "Rabatt: Höchstens 15%." and Field's "Bestätigt." cancelled it
*   before it reached the DOM. A sentence already queued in the same
*   frame is not queued twice (Field and NumberField saying one problem).
*
* One region per document: a page with forty fields would otherwise
* have forty, and a screen reader watching several announces whichever
* wins. Each message is a <span lang> in the language its words are in.
*
* Internal, not under src/hooks (which build.mjs makes public): it moves
* there as `useAnnounce` when Toast needs it.
*/
var region = null;
var pending;
var queue = [];
function ensureAnnouncer() {
	if (typeof document === "undefined") return null;
	if (region?.isConnected) return region;
	region = document.createElement("div");
	region.setAttribute("role", "status");
	region.setAttribute("aria-live", "polite");
	region.setAttribute("aria-atomic", "true");
	region.setAttribute("data-lcf-announcer", "");
	Object.assign(region.style, {
		position: "absolute",
		width: "1px",
		height: "1px",
		padding: "0",
		margin: "-1px",
		overflow: "hidden",
		clipPath: "inset(50%)",
		whiteSpace: "nowrap",
		border: "0"
	});
	document.body.appendChild(region);
	return region;
}
/**
* Speak `message`, marked as written in `lang` (from `t.lang(key)`).
* An empty `lang` claims none: words the browser wrote, in a language
* the page cannot know.
*/
function announce(message, lang) {
	const r = ensureAnnouncer();
	if (!r) return;
	if (queue.some((q) => q.message === message)) return;
	queue.push({
		message,
		lang
	});
	if (pending !== void 0) return;
	r.textContent = "";
	pending = requestAnimationFrame(() => {
		pending = void 0;
		const items = queue;
		queue = [];
		const doc = r.ownerDocument;
		const nodes = [];
		items.forEach((item, i) => {
			if (i > 0) nodes.push(doc.createTextNode(" "));
			const span = doc.createElement("span");
			if (item.lang) span.lang = item.lang;
			span.textContent = item.message;
			nodes.push(span);
		});
		r.replaceChildren(...nodes);
	});
}
/**
* An element's text as a screen reader would read it as a name: without
* aria-hidden or hidden parts (a label's "*"). The prefix of a late
* announcement — "Fläche: Höchstens 500 m²." — is built from it by Field
* and by NumberField alike, so the same problem said by both is the same
* sentence and is queued once.
*/
function spokenText(node) {
	if (!node) return "";
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
	if (node instanceof Element && (node.getAttribute("aria-hidden") === "true" || node.hasAttribute("hidden"))) return "";
	return [...node.childNodes].map(spokenText).join("");
}
//#endregion
export { announce, ensureAnnouncer, spokenText };

//# sourceMappingURL=announce.js.map