import { mergeRefs } from "../refs.js";
import { useField } from "../Field/context.js";
import { joinIds } from "../Field/ids.js";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { clsx } from "clsx";
//#region src/components/Input/InputFrame.tsx
var TYPES = [
	"text",
	"email",
	"tel",
	"url",
	"password"
];
var warn = (msg) => {
	if (process.env.NODE_ENV !== "production") console.warn(`[lcf] ${msg}`);
};
/**
* The Field contract's arithmetic, once, for every control built on the
* frame (NumberField reads it too, for its stepper and its hidden input):
* the control's own size wins, then the Field's, then 'md'; required,
* disabled and read-only are OR'ed.
*/
function resolveControl(field, own) {
	return {
		size: own.size ?? field?.size ?? "md",
		required: !!(own.required || field?.required),
		disabled: !!(own.disabled || field?.disabled),
		readOnly: !!(own.readOnly || field?.readOnly)
	};
}
/**
* The box every one-line control is drawn in, and the Field contract
* (`useField`'s doc comment) kept once: Input is this with nothing
* added, NumberField builds on it. Internal.
*/
function InputFrame({ type = "text", size: sizeProp, invalid: invalidProp, block, startAdornment, endAdornment, frameProps, labelledBy, empty: emptyProp, className, style, id: idProp, required: requiredProp, disabled: disabledProp, readOnly: readOnlyProp, value, defaultValue, onChange, ref, ...rest }) {
	const field = useField();
	const auto = useId();
	const id = field?.id ?? idProp ?? auto;
	const inner = useRef(null);
	const setRef = useMemo(() => mergeRefs(inner, ref), [ref]);
	const { size, required, disabled, readOnly } = resolveControl(field, {
		size: sizeProp,
		required: requiredProp,
		disabled: disabledProp,
		readOnly: readOnlyProp
	});
	const ariaInvalid = rest["aria-invalid"];
	const invalid = !!(invalidProp || field?.invalid || ariaInvalid === true || ariaInvalid === "true");
	const controlled = value !== void 0;
	const [uncontrolledEmpty, setUncontrolledEmpty] = useState(() => String(defaultValue ?? "") === "");
	const empty = emptyProp ?? (controlled ? String(value ?? "") === "" : uncontrolledEmpty);
	useEffect(() => {
		if (controlled) return;
		const form = inner.current?.form;
		if (!form) return;
		let timer;
		const onReset = () => {
			timer = setTimeout(() => {
				if (inner.current) setUncontrolledEmpty(inner.current.value === "");
			}, 0);
		};
		form.addEventListener("reset", onReset);
		return () => {
			form.removeEventListener("reset", onReset);
			clearTimeout(timer);
		};
	}, [controlled]);
	const color = invalid ? "danger" : field?.required && empty ? "caution" : void 0;
	const ariaLabel = rest["aria-label"];
	const ariaLabelledBy = labelledBy ?? rest["aria-labelledby"];
	useEffect(() => {
		if (field || ariaLabel || ariaLabelledBy) return;
		if ((inner.current?.labels?.length ?? 0) > 0) return;
		warn("Input has no name: put it in a Field, or give it aria-label or a <label for>. A placeholder is not a name.");
	}, [
		field,
		ariaLabel,
		ariaLabelledBy
	]);
	useEffect(() => {
		if (field && idProp !== void 0 && idProp !== field.id) warn("an `id` on a control inside a Field is ignored — set the Field's `id`; it names the control.");
	}, [field, idProp]);
	const inField = !!field;
	useEffect(() => {
		if (!inField) return;
		const own = [
			requiredProp && "required",
			disabledProp && "disabled",
			readOnlyProp && "readOnly"
		].filter(Boolean);
		if (own.length) warn(`${own.join(", ")} on a control inside a Field — set it on the Field; it owns the word, the asterisk and the actions.`);
	}, [
		inField,
		requiredProp,
		disabledProp,
		readOnlyProp
	]);
	useEffect(() => {
		if (!TYPES.includes(type)) warn(`Input: type="${type}" is not one of ${TYPES.join(", ")}. Numbers, dates and search have components of their own.`);
	}, [type]);
	const onFrameMouseDown = (e) => {
		const el = inner.current;
		if (!el || disabled || e.button !== 0) return;
		const target = e.target;
		if (target === el || target.closest("button, a, input, select, textarea")) return;
		e.preventDefault();
		el.focus();
	};
	const handleChange = (e) => {
		if (!controlled) setUncontrolledEmpty(e.currentTarget.value === "");
		onChange?.(e);
	};
	return /* @__PURE__ */ jsxs("span", {
		className: clsx("lcf-input", className),
		style,
		"data-size": size,
		"data-block": block || void 0,
		"data-color": color,
		"data-empty": empty || void 0,
		"data-readonly": readOnly || void 0,
		"data-disabled": disabled || void 0,
		...frameProps,
		onMouseDown: onFrameMouseDown,
		children: [
			startAdornment != null && startAdornment !== false && /* @__PURE__ */ jsx("span", {
				className: "lcf-input-adornment",
				children: startAdornment
			}),
			/* @__PURE__ */ jsx("input", {
				...rest,
				ref: setRef,
				id,
				type,
				className: "lcf-input-el",
				value,
				defaultValue,
				onChange: handleChange,
				required,
				disabled,
				readOnly,
				"aria-invalid": invalid ? "true" : "false",
				"aria-labelledby": ariaLabelledBy,
				"aria-describedby": joinIds(rest["aria-describedby"], field?.describedBy)
			}),
			endAdornment != null && endAdornment !== false && /* @__PURE__ */ jsx("span", {
				className: "lcf-input-adornment",
				children: endAdornment
			})
		]
	});
}
//#endregion
export { InputFrame, resolveControl };

//# sourceMappingURL=InputFrame.js.map