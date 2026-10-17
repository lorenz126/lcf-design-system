import { useLcf } from "../../i18n/context.js";
import { Spinner } from "../Spinner/Spinner.js";
import { useEffect } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { clsx } from "clsx";
//#region src/components/Button/Button.tsx
/**
* Button — the first control, and the one every other one is measured
* against.
*
* `color` says what it means, `variant` how loud it is:
*
* - `solid` — one per view. The thing you want pressed. White text, always.
* - `soft` — secondary actions that still carry a colour.
* - `outline` — neutral secondary: a hairline and the colour as text.
* - `ghost` — tertiary. Reads as a link with a hit area.
* - `floating` — solid, lifted off the surface: for actions that sit ON
*   content rather than in the layout — a sticky bar, an overlay.
* - `glass` — translucent over a backdrop. Its contrast is whatever is
*   behind it, so it is for photographs and maps, never a page.

*
* NEVER A CAPSULE. The radius is capped at 40% of the height, whatever
* --r-control says, so that a capsule keeps meaning "a label, not a thing
* you press" — Badge is fully round, and the two must stay told apart.
* That is why there is no `pill` here, though the SDK this vocabulary
* follows has one.
*
* Hover on the quiet variants moves the BORDER, not the ground: a ground
* that shifts toward its own label costs contrast exactly where the
* pointer is guaranteed to be, and a soft primary at rest is 4.51:1 with
* nothing to spare.
*
* Refuses: a disabled button that does not say why. Disable it and put
* the reason beside it, or leave it enabled and say the reason on press.
*/
function Button({ color = "primary", variant = "solid", size = "md", block, loading, uniform, selected, startIcon, endIcon, href, disabled, className, children, type = "button", ...rest }) {
	const { linkComponent: Link } = useLcf();
	const inert = disabled || loading;
	useEffect(() => {
		if (process.env.NODE_ENV !== "production" && uniform && !rest["aria-label"] && !rest["aria-labelledby"]) console.warn("[lcf] Button: `uniform` needs an aria-label — the glyph gives a screen reader nothing to announce.");
	}, [uniform, rest]);
	const cls = clsx("lcf-button", className);
	const data = {
		"data-color": color,
		"data-variant": variant,
		"data-size": size,
		"data-block": block || void 0,
		"data-uniform": uniform || void 0
	};
	const inner = /* @__PURE__ */ jsxs(Fragment, { children: [
		loading ? /* @__PURE__ */ jsx(Spinner, { size: "inherit" }) : startIcon,
		children,
		endIcon
	] });
	if (href !== void 0) {
		if (inert) return /* @__PURE__ */ jsx("span", {
			className: cls,
			...data,
			"aria-disabled": "true",
			"aria-busy": loading || void 0,
			children: inner
		});
		return /* @__PURE__ */ jsx(Link, {
			href,
			className: cls,
			...data,
			children: inner
		});
	}
	return /* @__PURE__ */ jsx("button", {
		...rest,
		type,
		className: cls,
		...data,
		disabled: inert,
		"aria-busy": loading || void 0,
		"aria-pressed": selected,
		children: inner
	});
}
//#endregion
export { Button };

//# sourceMappingURL=Button.js.map