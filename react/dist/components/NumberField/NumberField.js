import { useFormat, useMessages } from "../../i18n/context.js";
import { mergeRefs } from "../refs.js";
import { announce, ensureAnnouncer, spokenText } from "../Field/announce.js";
import { useField } from "../Field/context.js";
import { joinIds } from "../Field/ids.js";
import { InputFrame, resolveControl } from "../Input/InputFrame.js";
import { UNIT_WORD, decimals, displayText, inputModeFor, rangeProblem, readText, stepFrom } from "./number.js";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { clsx } from "clsx";
import { CircleX, Minus, Plus } from "lucide-react";
import { flushSync } from "react-dom";
//#region src/components/NumberField/NumberField.tsx
var MONEY = ["CHF", "EUR"];
/**
* NumberField — a quantity with its unit, typed in the reader's own separators and kept as a number.
*
* - **NOT `type="number"`, and that is a cost.** The native field
*   parses in the browser's locale, not the app's. It cannot show
*   "10'410.50", sanitises "12," to "", accepts `e`, and changes on the
*   wheel. So this one owns its parsing (`useFormat().parseNumber`), and
*   with it the debt.
* - **NOT `role="spinbutton"`.** Measured: an empty spinbutton reports
*   0, missing min/max report as 0..0, and `aria-valuetext` is ignored.
*   It stays a textbox. The unit is part of its name ("Fläche
*   Quadratmeter"), and steps are announced.
* - **THE TEXT IS NOT A NUMBER YET.** It commits on blur, Enter, arrows
*   and the stepper, never per keystroke. A field that drives a price
*   would otherwise recalculate on 1, 12 and 120. "12," mid-typing is not
*   an error; problems are removed as soon as the text would commit
*   cleanly, and added only when it commits.
* - **IT NEVER CLAMPS, SNAPS OR ROUNDS WHAT WAS TYPED.** It says what is
*   wrong (`setCustomValidity` included, so the form agrees) and keeps
*   the number. Arrows clamp because they are gestures. Unreadable text
*   keeps the last good value and emits nothing — emptying a field to
*   punish a typo destroys data.
* - **The unit sits at the end in every locale.** A column of "m²", "%"
*   and "CHF" fields lines its numbers up on one edge; printed text still
*   uses `format.money`. Pasted units are understood: "CHF 1'200.–" is
*   1200 in a franc field.
* - **It posts the canonical number.** With `name`, a hidden input
*   carries 1234.5, never "1'234.5"; the visible box has no name. `form`
*   reaches both, so a field outside the form it names is still
*   validated by it; a form reset puts an uncontrolled field back to
*   `defaultValue`.
* - **`className` and `style` sit on its outer box**, which holds the
*   frame, the problem line and the hidden input.
* - **Refuses:**
*   - `type="number"`;
*   - `spinbutton`;
*   - the wheel;
*   - per-keystroke values (there is no `onChange`);
*   - clamping, snapping, rounding or emptying what was typed;
*   - emitting text it cannot read;
*   - unit arithmetic or conversion;
*   - units outside `Unit`;
*   - steppers at sm;
*   - being a slider.
*/
function NumberField({ value, defaultValue = null, onValueChange, unit, min, max, step, minimumFractionDigits, stepper = false, size: sizeProp, invalid = false, block = false, className, style, id: idProp, name, form, disabled, readOnly, onKeyDown, onFocus, onBlur, ref, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, "aria-describedby": ariaDescribedBy, ...rest }) {
	const field = useField();
	const t = useMessages();
	const f = useFormat();
	const auto = useId();
	const id = field?.id ?? idProp ?? auto;
	const { size, disabled: isDisabled, readOnly: isReadOnly } = resolveControl(field, {
		size: sizeProp,
		disabled,
		readOnly
	});
	const input = useRef(null);
	const setRef = useMemo(() => mergeRefs(input, ref), [ref]);
	const [text, setText] = useState("");
	const [dirty, setDirty] = useState(false);
	const [parseFailed, setParseFailed] = useState(false);
	const [inner, setInner] = useState(defaultValue ?? null);
	const [focused, setFocused] = useState(false);
	const committed = value !== void 0 ? value : inner;
	const [seen, setSeen] = useState(value);
	if (!Object.is(value, seen)) {
		setSeen(value);
		if (!focused && dirty) {
			setDirty(false);
			setParseFailed(false);
		}
	}
	const bounds = {
		min,
		max,
		step
	};
	const mfd = minimumFractionDigits ?? (unit && MONEY.includes(unit) ? 2 : 0);
	const display = (n) => displayText(n, f, mfd);
	const displayed = dirty ? text : committed == null ? "" : display(committed);
	const empty = displayed.trim() === "";
	let problem;
	const read = dirty ? readText(text, unit, f) : null;
	if (read?.ok && !rangeProblem(read.value, bounds)) problem = null;
	else if (dirty && parseFailed) problem = { key: "notANumber" };
	else problem = rangeProblem(committed, bounds);
	const amount = (x) => {
		const digits = Math.min(20, decimals(x));
		return unit ? f.unit(x, unit, { maximumFractionDigits: Math.max(digits, unit && MONEY.includes(unit) ? 2 : 0) }) : f.number(x, { maximumFractionDigits: digits });
	};
	const problemMessage = (p) => t(p.key, p.value === void 0 ? {} : {
		min: amount(p.value),
		max: amount(p.value),
		step: amount(p.value)
	});
	const problemText = problem && problemMessage(problem);
	useLayoutEffect(() => {
		input.current?.setCustomValidity(problemText ?? "");
	}, [problemText]);
	useEffect(() => {
		ensureAnnouncer();
	}, []);
	useEffect(() => {
		if (process.env.NODE_ENV !== "production" && stepper && size === "sm") console.warn("[lcf] NumberField: no stepper at size sm — its buttons would be under 24px (WCAG 2.5.8). Arrow keys step at every size.");
	}, [stepper, size]);
	const lastSaid = useRef(null);
	const labelText = () => {
		const el = input.current;
		if (!el) return "";
		if (field) return spokenText(el.ownerDocument.getElementById(field.labelId)).trim();
		if (ariaLabel) return ariaLabel;
		return spokenText(el.labels?.[0]).trim();
	};
	const sayProblem = (p) => {
		if (!p) {
			lastSaid.current = null;
			return;
		}
		const message = problemMessage(p);
		const label = labelText();
		const said = label ? t("fieldMessage", {
			field: label,
			message
		}) : message;
		if (said === lastSaid.current) return;
		lastSaid.current = said;
		announce(said, t.lang(p.key));
	};
	const stepTimer = useRef(void 0);
	useEffect(() => () => clearTimeout(stepTimer.current), []);
	const sayStep = (v) => {
		clearTimeout(stepTimer.current);
		const message = unit ? t("valueWithUnit", {
			value: display(v),
			unit: t(UNIT_WORD[unit])
		}) : display(v);
		const lang = unit ? t.lang(UNIT_WORD[unit]) : f.locale;
		stepTimer.current = setTimeout(() => announce(message, lang), 250);
	};
	const emit = (n) => {
		if (value === void 0) setInner(n);
		if (!Object.is(n, committed)) onValueChange?.(n);
	};
	const commit = (reason) => {
		if (!dirty) return "ok";
		const r = readText(text, unit, f);
		if (!r.ok) {
			setParseFailed(true);
			if (reason !== "step") sayProblem({ key: "notANumber" });
			return "failed";
		}
		setParseFailed(false);
		setDirty(false);
		emit(r.value);
		if (reason !== "step") sayProblem(rangeProblem(r.value, bounds));
		return "ok";
	};
	const stepBy = (dir, mult) => {
		if (isDisabled || isReadOnly) return;
		let base = committed;
		if (dirty) {
			const r = readText(text, unit, f);
			if (!r.ok) {
				commit("step");
				return;
			}
			base = r.value;
		}
		const v = stepFrom(base, dir, mult, bounds);
		setDirty(false);
		setParseFailed(false);
		emit(v);
		lastSaid.current = null;
		sayStep(v);
	};
	const handleKeyDown = (e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented) return;
		if (e.nativeEvent.isComposing || e.keyCode === 229) return;
		if (isDisabled || isReadOnly) return;
		switch (e.key) {
			case "ArrowUp":
			case "ArrowDown":
				e.preventDefault();
				stepBy(e.key === "ArrowUp" ? 1 : -1, e.shiftKey ? 10 : 1);
				break;
			case "PageUp":
			case "PageDown":
				e.preventDefault();
				stepBy(e.key === "PageUp" ? 1 : -1, 10);
				break;
			case "Enter":
				if (flushSync(() => commit("enter")) === "failed") e.preventDefault();
				break;
			case "Escape": if (dirty) {
				setDirty(false);
				setParseFailed(false);
				lastSaid.current = null;
				e.preventDefault();
				e.stopPropagation();
			}
		}
	};
	const handleBlur = (e) => {
		onBlur?.(e);
		setFocused(false);
		commit("blur");
	};
	const uncontrolled = value === void 0;
	useEffect(() => {
		const owner = input.current?.form;
		if (!uncontrolled || !owner) return;
		let timer;
		const onReset = () => {
			timer = setTimeout(() => {
				setInner(defaultValue ?? null);
				setDirty(false);
				setParseFailed(false);
				lastSaid.current = null;
			}, 0);
		};
		owner.addEventListener("reset", onReset);
		return () => {
			owner.removeEventListener("reset", onReset);
			clearTimeout(timer);
		};
	}, [
		uncontrolled,
		defaultValue,
		form
	]);
	const unitId = `${id}-unit`;
	const problemId = problem ? `${id}-problem` : void 0;
	let labelledBy = ariaLabelledBy;
	let unitDescId;
	if (unit) {
		if (field) labelledBy = `${field.labelId} ${unitId}`;
		else if (ariaLabelledBy) labelledBy = `${ariaLabelledBy} ${unitId}`;
		else if (ariaLabel) labelledBy = `${id} ${unitId}`;
		else unitDescId = unitId;
	}
	const atMin = min !== void 0 && committed != null && committed <= min;
	const atMax = max !== void 0 && committed != null && committed >= max;
	const showStepper = stepper && size !== "sm";
	const stepButton = (dir) => {
		const key = dir > 0 ? "increment" : "decrement";
		const own = `${id}-${dir > 0 ? "inc" : "dec"}`;
		return /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lcf-number-step",
			tabIndex: -1,
			id: own,
			"aria-label": t(key),
			"aria-labelledby": field ? `${own} ${field.labelId}` : void 0,
			"aria-controls": id,
			lang: t.lang(key),
			disabled: isDisabled || isReadOnly || (dir > 0 ? atMax : atMin),
			onPointerDown: (e) => e.preventDefault(),
			onMouseDown: (e) => e.preventDefault(),
			onClick: () => stepBy(dir, 1),
			children: dir > 0 ? /* @__PURE__ */ jsx(Plus, { "aria-hidden": "true" }) : /* @__PURE__ */ jsx(Minus, { "aria-hidden": "true" })
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: clsx("lcf-number", className),
		style,
		"data-block": block || void 0,
		"data-empty": empty || void 0,
		"data-dirty": dirty ? "true" : void 0,
		children: [
			/* @__PURE__ */ jsx(InputFrame, {
				...rest,
				ref: setRef,
				id: field ? idProp : id,
				form,
				type: "text",
				size,
				block,
				invalid: invalid || !!problem,
				disabled,
				readOnly,
				empty,
				value: displayed,
				onChange: (e) => {
					setText(e.currentTarget.value);
					setDirty(true);
					lastSaid.current = null;
				},
				onKeyDown: handleKeyDown,
				onFocus: (e) => {
					onFocus?.(e);
					setFocused(true);
				},
				onBlur: handleBlur,
				inputMode: inputModeFor(min),
				autoComplete: "off",
				autoCorrect: "off",
				spellCheck: false,
				lang: f.locale,
				"aria-label": ariaLabel,
				labelledBy,
				"aria-describedby": joinIds(problemId, unitDescId, ariaDescribedBy),
				frameProps: { "data-dirty": dirty ? "true" : void 0 },
				endAdornment: (unit || showStepper) && /* @__PURE__ */ jsxs(Fragment, { children: [unit && /* @__PURE__ */ jsx("span", {
					className: "lcf-number-unit",
					"aria-hidden": "true",
					children: f.unitSymbol(unit)
				}), showStepper && /* @__PURE__ */ jsxs("span", {
					className: "lcf-number-steps",
					children: [stepButton(-1), stepButton(1)]
				})] })
			}),
			unit && /* @__PURE__ */ jsx("span", {
				id: unitId,
				hidden: true,
				lang: t.lang(UNIT_WORD[unit]),
				children: t(UNIT_WORD[unit])
			}),
			problem && /* @__PURE__ */ jsxs("div", {
				id: problemId,
				className: "lcf-field-msg",
				"data-color": "danger",
				lang: t.lang(problem.key),
				children: [/* @__PURE__ */ jsx(CircleX, { "aria-hidden": "true" }), /* @__PURE__ */ jsx("span", { children: problemText })]
			}),
			name && /* @__PURE__ */ jsx("input", {
				type: "hidden",
				name,
				form,
				disabled: isDisabled,
				value: committed == null ? "" : String(committed)
			})
		]
	});
}
//#endregion
export { NumberField };

//# sourceMappingURL=NumberField.js.map