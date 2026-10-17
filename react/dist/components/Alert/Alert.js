import { useMessages } from "../../i18n/context.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { clsx } from "clsx";
import { CircleAlert, CircleCheck, CircleX, Info, Sparkles, TriangleAlert, X } from "lucide-react";
//#region src/components/Alert/Alert.tsx
var MARK = {
	primary: /* @__PURE__ */ jsx(Info, {}),
	secondary: /* @__PURE__ */ jsx(Info, {}),
	info: /* @__PURE__ */ jsx(Info, {}),
	success: /* @__PURE__ */ jsx(CircleCheck, {}),
	warning: /* @__PURE__ */ jsx(TriangleAlert, {}),
	caution: /* @__PURE__ */ jsx(CircleAlert, {}),
	danger: /* @__PURE__ */ jsx(CircleX, {}),
	discovery: /* @__PURE__ */ jsx(Sparkles, {})
};
/**
* Alert — what the page says about itself.
*
* The distinction from a toast is the whole reason both exist. A toast
* is what HAPPENED: it arrives, it is read, it leaves. An alert is what
* IS: this offer is locked, this licence is unresolved, this form is
* read-only. It has no timer because the condition has none, and it
* sits in the layout rather than over it.
*
* SO IT IS USUALLY NOT A LIVE REGION. One that is on the page when the
* page loads is read in order like everything else. `announce` is for the
* other case — one that appears because of something the reader just
* did — and picks the urgency: danger interrupts, the rest waits.
*
* TINT GROUND, FULL-STRENGTH TEXT, COLOURED MARK. The ground already
* says the colour; colouring the words too says it twice and pays in
* legibility — accent text on accent tint fell under AA in dark mode,
* on a raised panel, twice. The mark keeps the colour; it is a graphic,
* held to 3:1.
*
* Several of them in a row is a list of findings — blocks and hints from
* a calculation — and should be one Alert with a list in its body, not a
* stack of boxes.
*
* Its own word — "Dismiss" on the close button — carries `lang`, so a
* German "Ausblenden" under an English document is read as German. The
* title and body are the app's, and are never marked.
*/
function Alert({ color = "secondary", variant = "soft", title, description, actions, indicator, onDismiss, announce, className, children, ...rest }) {
	const t = useMessages();
	const role = announce ? color === "danger" ? "alert" : "status" : void 0;
	const mark = indicator === false ? null : indicator ?? MARK[color];
	const body = children ?? description;
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		role,
		className: clsx("lcf-alert", className),
		"data-color": color,
		"data-variant": variant,
		children: [
			mark && /* @__PURE__ */ jsx("span", {
				className: "lcf-alert-mark",
				"aria-hidden": "true",
				children: mark
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "lcf-alert-text",
				children: [title && /* @__PURE__ */ jsx("p", {
					className: "lcf-alert-title",
					children: title
				}), body && /* @__PURE__ */ jsx("div", {
					className: "lcf-alert-body",
					children: body
				})]
			}),
			actions && /* @__PURE__ */ jsx("div", {
				className: "lcf-alert-actions",
				children: actions
			}),
			onDismiss && /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lcf-alert-x",
				"aria-label": typeof title === "string" ? `${t("dismiss")}: ${title}` : t("dismiss"),
				lang: t.lang("dismiss"),
				onClick: onDismiss,
				children: /* @__PURE__ */ jsx(X, { "aria-hidden": "true" })
			})
		]
	});
}
//#endregion
export { Alert };

//# sourceMappingURL=Alert.js.map