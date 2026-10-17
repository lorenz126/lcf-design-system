import { jsx, jsxs } from "react/jsx-runtime";
import { CircleDashed, ClipboardList, EqualApproximately, Mail, UserRound, UserRoundPen } from "lucide-react";
//#region src/components/Field/origin.tsx
/**
* Where a value came from, said the same way everywhere: by Field now,
* by MediaPanel and MediaCell when media items arrive. Internal until
* then; becoming a public component is additive.
*
* The mark is NEUTRAL — no data-color. The state says what needs a
* person; the origin only says who said it. Its icon is --fg-subtle (a
* graphic, 3:1 or better in both themes), its words --fg-muted.
*/
var ORIGIN_ICON = {
	customer: UserRound,
	staff: UserRoundPen,
	assumed: EqualApproximately,
	missing: CircleDashed
};
var SOURCE_KEY = {
	customer: "originCustomer",
	staff: "originStaff",
	assumed: "originAssumed",
	missing: "originMissing"
};
/** The source string is shorthand: origin="assumed". */
function normaliseOrigin(origin) {
	return typeof origin === "string" ? { source: origin } : origin;
}
/**
* The origin in words, and the key whose language they are in:
* "Kunde per E-Mail" (originVia), "Ergänzt von Anna" (originStaffBy),
* "Angenommen" (originAssumed).
*/
function originWords(origin, t) {
	const named = origin.source === "staff" && origin.by;
	const sourceKey = named ? "originStaffBy" : SOURCE_KEY[origin.source];
	const words = t(sourceKey, named ? { name: origin.by } : {});
	if (!origin.via) return {
		text: words,
		key: sourceKey
	};
	return {
		text: t("originVia", {
			source: words,
			via: t(origin.via === "email" ? "viaEmail" : "viaForm")
		}),
		key: "originVia"
	};
}
function originIcon(origin) {
	if (origin.source === "customer" && origin.via) return origin.via === "email" ? Mail : ClipboardList;
	return ORIGIN_ICON[origin.source];
}
/** The visible mark: an icon and the words. aria-hidden — Field speaks it as a sentence. */
function OriginMark({ origin, t }) {
	const Icon = originIcon(origin);
	const { text, key } = originWords(origin, t);
	return /* @__PURE__ */ jsxs("span", {
		className: "lcf-field-origin",
		"data-origin": origin.source,
		"aria-hidden": "true",
		lang: t.lang(key),
		children: [/* @__PURE__ */ jsx(Icon, {}), text]
	});
}
//#endregion
export { ORIGIN_ICON, OriginMark, normaliseOrigin, originWords };

//# sourceMappingURL=origin.js.map