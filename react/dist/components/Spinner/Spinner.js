import { useMessages } from "../../i18n/context.js";
import { jsx } from "react/jsx-runtime";
import { clsx } from "clsx";
//#region src/components/Spinner/Spinner.tsx
/**
* Spinner — work is happening and nobody knows how long it will take.
*
* REDUCED MOTION SLOWS IT, IT DOES NOT STOP IT. Everything else in the
* system collapses to 1ms under prefers-reduced-motion, which is right
* for a transition — the end state is the point. A stopped spinner is
* not a finished spinner, it is a frozen one, and it says the opposite
* of what it is there to say. Two seconds a turn is calm and still
* clearly alive.
*
* Decorative by default: it usually sits beside the word that says what
* is loading. `labelled` gives it a name of its own — the app's word for
* "Loading", from the message table, marked with the language it is
* written in — for when it stands alone.
*
* Not a progress bar. When the share done is known, show the share.
*/
function Spinner({ size = "md", labelled, label, className }) {
	const t = useMessages();
	const name = label ?? (labelled ? t("loading") : void 0);
	return /* @__PURE__ */ jsx("span", {
		className: clsx("lcf-spinner", className),
		"data-size": size,
		"data-motion": "essential",
		role: name ? "status" : void 0,
		"aria-label": name,
		lang: labelled && label === void 0 ? t.lang("loading") : void 0,
		"aria-hidden": name ? void 0 : true
	});
}
//#endregion
export { Spinner };

//# sourceMappingURL=Spinner.js.map