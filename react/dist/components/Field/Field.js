import { useMessages } from "../../i18n/context.js";
import { mergeRefs } from "../refs.js";
import { announce, ensureAnnouncer, spokenText } from "./announce.js";
import { FieldContext } from "./context.js";
import { joinIds } from "./ids.js";
import { OriginMark, normaliseOrigin, originWords } from "./origin.js";
import { useEffect, useId, useLayoutEffect, useMemo, useRef } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { clsx } from "clsx";
import { Check, CircleCheck, CircleX, RotateCcw } from "lucide-react";
import { flushSync } from "react-dom";
//#region src/components/Field/Field.tsx
var NOT_TEXT = /* @__PURE__ */ new Set([
	"checkbox",
	"radio",
	"button",
	"submit",
	"reset",
	"file",
	"hidden",
	"range",
	"color"
]);
function confirmsOnEnter(el) {
	if (el instanceof HTMLSelectElement) return true;
	return el instanceof HTMLInputElement && !NOT_TEXT.has(el.type);
}
var hasWords = (error) => !(error === void 0 || error === null || error === false || error === true || error === "");
/**
* Field — the label, the words around a control, and where its value came from, wired once for any control.
*
* - **A context, not a bundle.** It renders no control. Any control that
*   calls `useField()` gets its id, its description and
*   required/invalid without the caller wiring ids by hand. That is the
*   Nuxt defect it ends: a label pointing at nothing.
* - **It never touches the value.** State, origin and the suggestion's
*   text are told to it. Emptiness is read only by CSS, from the
*   control's own `data-empty`, so nothing travels upward and nothing
*   flashes on first paint.
* - **Three states, and only two are props.** Suggested is grey italic,
*   with no word, because most of forty fields arrive suggested and a
*   word on each hides the ones that need a person. Text the control
*   holds but could not commit is never drawn as the suggestion.
*   Confirmed is a ✓. Required-and-empty is derived: the word and a
*   caution edge, the one edge that clears 3:1 in colour, shown before
*   any submit because in a review an empty required field is the to-do.
*   The word stays with a hidden label: without it the edge says
*   "required" by hue alone (1.0:1 against the resting edge, measured in
*   light).
* - **One Tab stop per field, and it is the control.** Enter confirms
*   what is in the box, and a confirmable field never submits on Enter.
*   ✓ and ↺ are for the pointer, out of the Tab order; Escape in the
*   control is ↺ for the keyboard, once the control has no edit of its
*   own to undo. Measured when ↺ was a Tab stop before the control: it
*   sat in the forward path of the field ABOVE it, so Enter, Tab, Enter
*   there threw away a typed override nobody had confirmed yet. Focus
*   returns to the control after either action.
* - **A confirm acts on what the box shows.** Before confirming, Field
*   reads the control's `validity`: text NumberField could not read, a
*   number out of range, a required field still empty stop Enter and ✓
*   alike, and the reason is said instead. The app's own `error` does
*   not stop it; that verdict is the app's to act on.
* - **Every mark is said once.** The head row's marks are aria-hidden.
*   Each is spoken by its own sentence ending in a full stop, referenced
*   by `aria-describedby`. Measured: a word beside an aria-hidden icon
*   joined as "Herkunft:Kunde".
* - **The layer's words carry their language.** "Pflichtfeld",
*   "Vorschlag.", "Kunde per E-Mail" are marked with `lang`; the label,
*   description, error and hint are the app's, and are not.
* - **Refuses:**
*   - owning or reading the value;
*   - a suggestion shown as a placeholder (a suggestion is a value that
*     gets submitted and priced);
*   - being invalid without words;
*   - validating (it shows what the app and the control found);
*   - confirming a value the control itself calls wrong;
*   - tracking origin (the app owns it, Field shows it);
*   - inventing the app's words (`hint` is the app's);
*   - colour as the only signal;
*   - being a layout (no horizontal label mode, no grid);
*   - the checkbox family (their label sits beside a control that comes
*     first; the Nuxt finding);
*   - a button in the forward Tab path;
*   - moving focus when something is wrong.
*/
function Field({ label, hideLabel = false, description, error, required = false, disabled = false, readOnly = false, size, block = false, id: idProp, state, origin: originProp, hint, hintIcon, suggestion, onConfirm, onRevert, children, className, onKeyDown, ref, ...rest }) {
	const t = useMessages();
	const auto = useId();
	const id = idProp ?? auto;
	const labelId = `${id}-label`;
	const root = useRef(null);
	const setRef = useMemo(() => mergeRefs(root, ref), [ref]);
	const origin = normaliseOrigin(originProp);
	const hasError = hasWords(error);
	const showConfirm = !!onConfirm && state !== "confirmed" && !disabled && !readOnly;
	const showRevert = !!onRevert && !disabled && !readOnly;
	const showHead = !hideLabel || !!origin || !!hint || showConfirm || showRevert || state === "confirmed";
	const stateKey = state === "suggested" ? "stateSuggested" : state === "confirmed" ? "stateConfirmed" : suggestion !== void 0 ? "suggestionWas" : void 0;
	const stateText = stateKey && t(stateKey, { value: suggestion ?? "" });
	const originText = origin && originWords(origin, t).text;
	const hintText = hint && hint + (/[.!?…:;]$/.test(hint) ? "" : ".");
	const ids = {
		error: hasError ? `${id}-error` : void 0,
		state: stateKey ? `${id}-state` : void 0,
		keys: showConfirm ? `${id}-keys` : void 0,
		escape: showRevert ? `${id}-escape` : void 0,
		origin: origin ? `${id}-origin` : void 0,
		hint: hint ? `${id}-hint` : void 0,
		help: description != null && description !== false && description !== "" ? `${id}-help` : void 0
	};
	const describedBy = joinIds(ids.error, ids.state, ids.keys, ids.escape, ids.origin, ids.hint, ids.help);
	const context = useMemo(() => ({
		id,
		labelId,
		describedBy,
		invalid: hasError,
		required,
		disabled,
		readOnly,
		size
	}), [
		id,
		labelId,
		describedBy,
		hasError,
		required,
		disabled,
		readOnly,
		size
	]);
	useEffect(() => {
		if (process.env.NODE_ENV !== "production" && error === true) console.warn("[lcf] Field: error={true} — a field is never invalid without words. Pass the sentence that says what is wrong.");
	}, [error]);
	useEffect(() => {
		if (onConfirm) ensureAnnouncer();
	}, [onConfirm]);
	const acting = useRef(false);
	const previous = useRef(state);
	useEffect(() => {
		const was = previous.current;
		previous.current = state;
		if (was === "confirmed" || state !== "confirmed") return;
		const doc = root.current?.ownerDocument;
		if (acting.current || doc && root.current?.contains(doc.activeElement)) announce(t("stateConfirmed"), t.lang("stateConfirmed"));
	}, [state, t]);
	const confirmRef = useRef(onConfirm);
	const revertRef = useRef(onRevert);
	useLayoutEffect(() => {
		confirmRef.current = onConfirm;
		revertRef.current = onRevert;
	});
	const control = () => (root.current?.ownerDocument ?? document).getElementById(id);
	const refuses = (el) => {
		const v = el?.validity;
		if (!el || !v || v.valid) return false;
		const name = spokenText(el.ownerDocument.getElementById(labelId)).trim();
		const [message, lang] = v.customError ? [el.validationMessage, t.lang("fieldMessage")] : v.valueMissing ? [t("required"), t.lang("required")] : [el.validationMessage, ""];
		announce(name ? t("fieldMessage", {
			field: name,
			message
		}) : message, lang);
		return true;
	};
	const handleKeyDown = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented) return;
		if (e.key !== "Enter" && e.key !== "Escape") return;
		if (e.nativeEvent.isComposing || e.keyCode === 229) return;
		if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
		const target = e.target;
		if (target.id !== id || disabled || readOnly || target.readOnly || target.disabled) return;
		if (e.key === "Escape") {
			if (!revertRef.current) return;
			e.preventDefault();
			e.stopPropagation();
			act(revertRef.current, "revert");
			return;
		}
		if (!confirmRef.current || !confirmsOnEnter(target)) return;
		e.preventDefault();
		if (refuses(target)) return;
		confirmRef.current();
	};
	const act = (fn, which) => {
		if (!fn) return;
		const doc = root.current?.ownerDocument ?? document;
		const el = control();
		const hadFocus = doc.activeElement !== null && doc.activeElement === el;
		if (which === "confirm" && (el?.readOnly || el?.disabled || refuses(el))) {
			el?.focus();
			return;
		}
		acting.current = true;
		try {
			flushSync(fn);
		} finally {
			acting.current = false;
		}
		const now = doc.activeElement;
		if (!now || now === doc.body || root.current?.contains(now)) control()?.focus();
		if (which === "revert" && hadFocus) announce(t("stateSuggested"), t.lang("stateSuggested"));
	};
	const revertKey = suggestion !== void 0 ? "backToSuggestionValue" : "backToSuggestion";
	const revertName = t(revertKey, { value: suggestion ?? "" });
	const confirmName = t("confirmValue");
	const labelEl = /* @__PURE__ */ jsxs("label", {
		id: labelId,
		htmlFor: id,
		className: clsx("lcf-field-label", hideLabel && "lcf-sr-only"),
		children: [label, required && /* @__PURE__ */ jsx("span", {
			className: "lcf-field-req",
			"aria-hidden": "true",
			children: "*"
		})]
	});
	const hasMarks = !!origin || !!hint || showRevert || showConfirm || state === "confirmed";
	const reqWord = required && /* @__PURE__ */ jsx("span", {
		className: "lcf-field-req-word",
		"data-color": "caution",
		"aria-hidden": "true",
		lang: t.lang("required"),
		children: t("required")
	});
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		ref: setRef,
		className: clsx("lcf-field", className),
		"data-state": state,
		"data-origin": origin?.source,
		"data-required": required || void 0,
		"data-invalid": hasError || void 0,
		"data-block": block || void 0,
		onKeyDown: handleKeyDown,
		children: [
			showHead ? /* @__PURE__ */ jsxs("div", {
				className: "lcf-field-head",
				children: [
					labelEl,
					reqWord,
					hasMarks && /* @__PURE__ */ jsxs("span", {
						className: "lcf-field-marks",
						children: [
							origin && /* @__PURE__ */ jsx(OriginMark, {
								origin,
								t
							}),
							hint && /* @__PURE__ */ jsxs("span", {
								className: "lcf-field-hint",
								"aria-hidden": "true",
								children: [hintIcon, hint]
							}),
							showRevert && /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "lcf-field-action",
								"data-action": "revert",
								tabIndex: -1,
								lang: t.lang(revertKey),
								"aria-label": revertName,
								title: revertName,
								"aria-describedby": labelId,
								onClick: () => act(onRevert, "revert"),
								children: [/* @__PURE__ */ jsx(RotateCcw, { "aria-hidden": "true" }), suggestion !== void 0 && /* @__PURE__ */ jsx("span", {
									className: "lcf-field-action-text",
									children: suggestion
								})]
							}),
							showConfirm && /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "lcf-field-action",
								"data-action": "confirm",
								tabIndex: -1,
								lang: t.lang("confirmValue"),
								"aria-label": confirmName,
								title: confirmName,
								"aria-describedby": labelId,
								onClick: () => act(onConfirm, "confirm"),
								children: /* @__PURE__ */ jsx(Check, { "aria-hidden": "true" })
							}),
							state === "confirmed" && /* @__PURE__ */ jsx("span", {
								className: "lcf-field-confirmed",
								"data-color": "success",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx(CircleCheck, {})
							})
						]
					})
				]
			}) : /* @__PURE__ */ jsxs(Fragment, { children: [labelEl, reqWord] }),
			/* @__PURE__ */ jsx("div", {
				className: "lcf-field-control",
				children: /* @__PURE__ */ jsx(FieldContext.Provider, {
					value: context,
					children
				})
			}),
			ids.error && /* @__PURE__ */ jsxs("div", {
				id: ids.error,
				className: "lcf-field-msg",
				"data-color": "danger",
				children: [/* @__PURE__ */ jsx(CircleX, { "aria-hidden": "true" }), /* @__PURE__ */ jsx("span", { children: error })]
			}),
			ids.help && /* @__PURE__ */ jsx("div", {
				id: ids.help,
				className: "lcf-field-msg",
				children: description
			}),
			ids.state && /* @__PURE__ */ jsx("span", {
				id: ids.state,
				hidden: true,
				lang: t.lang(stateKey),
				children: stateText
			}),
			ids.keys && /* @__PURE__ */ jsx("span", {
				id: ids.keys,
				hidden: true,
				lang: t.lang("enterConfirms"),
				children: t("enterConfirms")
			}),
			ids.escape && /* @__PURE__ */ jsx("span", {
				id: ids.escape,
				hidden: true,
				lang: t.lang("escapeReverts"),
				children: t("escapeReverts")
			}),
			ids.origin && /* @__PURE__ */ jsx("span", {
				id: ids.origin,
				hidden: true,
				lang: t.lang("originSentence"),
				children: t("originSentence", { origin: originText })
			}),
			ids.hint && /* @__PURE__ */ jsx("span", {
				id: ids.hint,
				hidden: true,
				children: hintText
			})
		]
	});
}
//#endregion
export { Field };

//# sourceMappingURL=Field.js.map