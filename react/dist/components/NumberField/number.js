//#region src/components/NumberField/number.ts
/** The spoken word for each unit — part of the field's name. */
var UNIT_WORD = {
	m2: "unitM2",
	m3: "unitM3",
	m: "unitM",
	mm: "unitMm",
	cm: "unitCm",
	km: "unitKm",
	kg: "unitKg",
	h: "unitH",
	percent: "unitPercent",
	CHF: "unitChf",
	EUR: "unitEur"
};
var ALIASES = {
	m2: ["m²", "m2"],
	m3: ["m³", "m3"],
	m: ["m"],
	mm: ["mm"],
	cm: ["cm"],
	km: ["km"],
	kg: ["kg"],
	h: ["h"],
	percent: ["%"],
	CHF: [
		"SFr.",
		"CHF",
		"Fr."
	],
	EUR: ["EUR", "€"]
};
var escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
* The text, ready for parseNumber: trimmed; the field's own unit taken
* off the start or the end ("CHF 1'200", "12 %", "118 m2"); and a
* trailing zero-cents dash dropped ("1'200.–"). Done on the raw text:
* parseNumber reads digits and separators only, and refuses "118 m²"
* (under the NFKC it once ran, "²" became "2" and that was 1182).
*
* Another unit is not taken off: "12 kg" in a square-metre field is not
* a number, and saying so is better than guessing.
*/
function preParse(text, unit) {
	let s = text.trim();
	if (unit) for (const alias of ALIASES[unit]) {
		const a = escape(alias);
		const start = new RegExp(`^${a}\\s*`, "i");
		const end = new RegExp(`\\s*${a}$`, "i");
		if (start.test(s)) {
			s = s.replace(start, "");
			break;
		}
		if (end.test(s)) {
			s = s.replace(end, "");
			break;
		}
	}
	return s.trim().replace(/[.,]\s*[-–—]$/, "").trim();
}
/** Fraction digits of a double as written: 0.05 → 2, 1e-7 → 7, 1.5e-7 → 8. */
function decimals(x) {
	const s = String(x);
	const exp = /e-(\d+)$/.exec(s);
	const frac = (exp ? s.slice(0, s.indexOf("e")) : s).split(".")[1]?.length ?? 0;
	return exp ? Number(exp[1]) + frac : frac;
}
var MAX_SCALE = 15;
/** Whether `n` sits on the grid `base + k × step`. Exact, in scaled integers: 0.3 is on a 0.1 grid. */
function onGrid(n, step, base = 0) {
	const d = Math.max(decimals(n), decimals(step), decimals(base));
	if (d > MAX_SCALE) {
		const k = (n - base) / step;
		return Math.abs(k - Math.round(k)) < 1e-9;
	}
	const S = 10 ** d;
	const si = Math.round(step * S);
	if (si === 0) return true;
	return (Math.round(n * S) - Math.round(base * S)) % si === 0;
}
/** What is wrong with a committed number, if anything: below, above, then off the grid. */
function rangeProblem(n, { min, max, step }) {
	if (n === null) return null;
	if (min !== void 0 && n < min) return {
		key: "belowMin",
		value: min
	};
	if (max !== void 0 && n > max) return {
		key: "aboveMax",
		value: max
	};
	if (step !== void 0 && step > 0 && !onGrid(n, step, min ?? 0)) return {
		key: "offStep",
		value: step
	};
	return null;
}
/**
* One arrow press (or ten, with Shift or Page keys) from `cur`.
*
* - Off the grid, the first move lands on the next grid point in the
*   direction pressed (12.3 → 12.5 on a 0.5 grid), the rest add steps.
* - From empty, the first press SETS a value and adds nothing: 0, or the
*   nearest bound, snapped up onto the grid.
* - The result is clamped to min and max, and with a step to the highest
*   grid value at or below max. Arrows are gestures, not data, so they
*   may clamp; what was typed never is.
* - Scaled integers throughout: 0.1 + 0.2 by arrows is 0.3, not
*   0.30000000000000004.
*/
function stepFrom(cur, dir, mult, { min, max, step }) {
	const s = step !== void 0 && step > 0 ? step : 1;
	const g = min ?? 0;
	const S = 10 ** Math.min(MAX_SCALE, Math.max(decimals(s), decimals(g), cur === null ? 0 : decimals(cur), max === void 0 ? 0 : decimals(max)));
	const gi = Math.round(g * S);
	const si = Math.round(s * S);
	const gridded = step !== void 0 && step > 0;
	const off = (x) => ((x - gi) % si + si) % si;
	let next;
	if (cur === null) {
		let v = Math.round(Math.min(Math.max(0, min ?? -Infinity), max ?? Infinity) * S);
		if (gridded && off(v) !== 0) v += si - off(v);
		next = v;
	} else {
		const ci = Math.round(cur * S);
		if (gridded && off(ci) !== 0) next = (dir > 0 ? ci + si - off(ci) : ci - off(ci)) + dir * si * (mult - 1);
		else next = ci + dir * si * mult;
	}
	if (min !== void 0 && next < Math.round(min * S)) next = Math.round(min * S);
	if (max !== void 0) {
		const mi = Math.round(max * S);
		if (next > mi) next = gridded ? mi - off(mi) : mi;
	}
	return next / S + 0;
}
/**
* The number as the field shows it: the reader's own separators, at
* least `minFractionDigits`, and never rounded — `toPrecision(15)` is a
* double's honest precision, so 0.1 + 0.2 shows as 0.3 rather than
* 0.30000000000000004, and 10.555 CHF stays 10.555.
*/
function displayText(n, format, minFractionDigits) {
	return format.number(Number(n.toPrecision(15)), {
		minimumFractionDigits: minFractionDigits,
		maximumFractionDigits: 20
	});
}
/**
* The phone keyboard. iOS's decimal pad has no minus key, so it is only
* offered where a minus can never be needed: with `min` at 0 or above.
*/
function inputModeFor(min) {
	return min !== void 0 && min >= 0 ? "decimal" : "text";
}
/** What committing `text` would give: a number or null (empty), or unreadable. */
function readText(text, unit, format) {
	const pre = preParse(text, unit);
	if (pre === "") return {
		ok: true,
		value: null
	};
	const n = format.parseNumber(pre);
	if (n === null) return { ok: false };
	return {
		ok: true,
		value: n + 0
	};
}
//#endregion
export { UNIT_WORD, decimals, displayText, inputModeFor, onGrid, preParse, rangeProblem, readText, stepFrom };

//# sourceMappingURL=number.js.map