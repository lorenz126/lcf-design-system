//#region src/i18n/format.ts
/**
* Pinned where runtimes disagree, and only there. Every other locale
* gets what Intl says. The two that were asked for: `10'410.00` in
* Switzerland, `10.410,00` in Austria.
*/
var MARKET_SEPARATORS = {
	"de-CH": {
		group: "'",
		decimal: "."
	},
	"it-CH": {
		group: "'",
		decimal: "."
	},
	"fr-CH": {
		group: "'",
		decimal: "."
	},
	"de-AT": {
		group: ".",
		decimal: ","
	}
};
var SYMBOL = {
	m2: "m²",
	m3: "m³",
	m: "m",
	mm: "mm",
	cm: "cm",
	km: "km",
	kg: "kg",
	h: "h"
};
var CURRENCY = {
	CHF: "CHF",
	EUR: "EUR"
};
/** What Intl itself uses for this locale, read once from a sample. */
function intlSeparators(locale) {
	const parts = new Intl.NumberFormat(locale).formatToParts(11111.1);
	return {
		group: parts.find((p) => p.type === "group")?.value ?? ",",
		decimal: parts.find((p) => p.type === "decimal")?.value ?? "."
	};
}
var halfWidth = (text) => text.replace(/[\uff01-\uff5e]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 65248)).replace(/\u3000/g, " ");
var wellGrouped = (runs) => /^[1-9]\d{0,2}$/.test(runs[0]) && runs.slice(1).every((r) => /^\d{3}$/.test(r));
function integerDigits(int, group = "") {
	const runs = int.split(new RegExp(`[\\s'’${group}]`));
	if (runs.length === 1) return /^\d*$/.test(int) ? int : null;
	return wellGrouped(runs) ? runs.join("") : null;
}
function createFormat(locale, overrides = {}) {
	const separators = {
		...intlSeparators(locale),
		...MARKET_SEPARATORS[locale],
		...overrides
	};
	const swap = (nf, value) => nf.formatToParts(value).map((p) => p.type === "group" ? separators.group : p.type === "decimal" ? separators.decimal : p.value).join("");
	const number = (value, options) => swap(new Intl.NumberFormat(locale, options), value);
	const money = (value, currency, options) => swap(new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		...options
	}), value);
	const percent = (ratio, options) => swap(new Intl.NumberFormat(locale, {
		style: "percent",
		maximumFractionDigits: 1,
		...options
	}), ratio);
	const unitSymbol = (unit) => {
		if (unit === "percent") return "%";
		return SYMBOL[unit] ?? CURRENCY[unit] ?? unit;
	};
	const unit = (value, u, options) => {
		if (u === "percent") return percent(value / 100, options);
		if (CURRENCY[u]) return money(value, CURRENCY[u], options);
		return `${number(value, options)} ${unitSymbol(u)}`;
	};
	const date = (iso, style = "medium") => {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
		if (!m) return iso;
		const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
		return new Intl.DateTimeFormat(locale, {
			dateStyle: style,
			timeZone: "UTC"
		}).format(d);
	};
	/**
	* What a person typed, back to a number — or null, which a field shows
	* as "Bitte eine Zahl eingeben." and keeps the text. A reading that
	* could be 1000 times off is refused, never guessed.
	*
	* 1. Both `.` and `,` appear: the rightmost is the decimal, once; the
	*    other is grouping, in groups of three, before it. "12.500,00" is
	*    12500 in de-CH as in de-AT — a German supplier's price pasted into
	*    a Swiss offer. Measured before: 12.5, silently.
	* 2. Only one of them appears, and it is the locale's decimal: the
	*    decimal, once.
	* 3. Only the OTHER one appears. Grouping when it is this locale's own
	*    group separator and the groups are well formed — "12.500" in de-AT
	*    is twelve thousand five hundred, "1,000" in en-GB is a thousand.
	*    Otherwise, if it occurs once, a decimal: "12.5" typed into a
	*    German form is twelve and a half, and in de-CH, whose group
	*    separator is the apostrophe, "2,450" is the decimal comma Swiss
	*    usage writes on quantities — two metres forty-five, not 2450.
	*    "0,125" is never grouping anywhere.
	* 4. Neither: an integer.
	*
	* Spaces of every width and both apostrophes are grouping whatever the
	* locale says — a number pasted from a PDF carries whichever one its
	* author's software chose — but only in well-formed groups before the
	* decimal: "12 5" is not 125.
	*/
	const parseNumber = (text) => {
		let s = halfWidth(text).trim().replace(/^\+/, "").replace(/[\u2212\u2013]/g, "-");
		const sign = s.startsWith("-") ? "-" : "";
		s = s.slice(sign.length).trim();
		const dec = separators.decimal === "," ? "," : ".";
		const other = dec === "," ? "." : ",";
		let point = "";
		let group = "";
		if (s.includes(".") && s.includes(",")) {
			point = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
			group = point === "." ? "," : ".";
		} else if (s.includes(dec)) point = dec;
		else if (s.includes(other)) {
			if (separators.group === other && integerDigits(s, other) !== null) group = other;
			else point = other;
		}
		const parts = point ? s.split(point) : [s];
		if (parts.length > 2) return null;
		const int = integerDigits(parts[0], group);
		const frac = parts[1] ?? "";
		if (int === null || !/^\d*$/.test(frac) || int + frac === "") return null;
		const n = Number(`${sign}${int || "0"}.${frac || "0"}`);
		return Number.isFinite(n) ? n : null;
	};
	return {
		locale,
		separators,
		number,
		money,
		percent,
		unit,
		date,
		parseNumber,
		unitSymbol
	};
}
//#endregion
export { MARKET_SEPARATORS, createFormat, intlSeparators };

//# sourceMappingURL=format.js.map