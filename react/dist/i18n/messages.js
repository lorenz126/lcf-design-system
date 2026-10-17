//#region src/i18n/messages.ts
var plural = (one, other) => (v, locale) => (new Intl.PluralRules(locale).select(Number(v.count)) === "one" ? one : other).replace("{count}", String(v.count));
var en = {
	loading: "Loading",
	dismiss: "Dismiss",
	close: "Close",
	noRows: "No rows.",
	noMatches: "No matches.",
	nothingSelected: "Nothing selected.",
	fixTheFollowing: plural("Please fix the following:", "Please fix the following {count}:"),
	chooseFiles: "Choose files",
	series: "Series",
	required: "Required",
	increment: "Increase",
	decrement: "Decrease",
	backToSuggestion: "Back to suggestion",
	notANumber: "Enter a number.",
	belowMin: "At least {min}.",
	aboveMax: "At most {max}.",
	offStep: "In steps of {step}.",
	stateSuggested: "Suggestion.",
	stateConfirmed: "Confirmed.",
	suggestionWas: "Suggestion: {value}.",
	enterConfirms: "Enter confirms.",
	escapeReverts: "Escape: back to suggestion.",
	confirmValue: "Confirm",
	backToSuggestionValue: "Back to suggestion: {value}",
	originSentence: "Source: {origin}.",
	originCustomer: "Customer",
	originStaff: "Added",
	originStaffBy: "Added by {name}",
	originAssumed: "Assumed",
	originMissing: "Missing",
	originVia: "{source} via {via}",
	viaEmail: "e-mail",
	viaForm: "web form",
	fieldMessage: "{field}: {message}",
	valueWithUnit: "{value} {unit}",
	unitM2: "square metres",
	unitM3: "cubic metres",
	unitM: "metres",
	unitMm: "millimetres",
	unitCm: "centimetres",
	unitKm: "kilometres",
	unitKg: "kilograms",
	unitH: "hours",
	unitPercent: "percent",
	unitChf: "Swiss francs",
	unitEur: "euros"
};
var de = {
	loading: "Wird geladen",
	dismiss: "Ausblenden",
	close: "Schliessen",
	noRows: "Keine Zeilen.",
	noMatches: "Keine Treffer.",
	nothingSelected: "Nichts ausgewählt.",
	fixTheFollowing: plural("Bitte korrigieren:", "Bitte {count} Punkte korrigieren:"),
	chooseFiles: "Dateien wählen",
	series: "Reihe",
	required: "Pflichtfeld",
	increment: "Erhöhen",
	decrement: "Verringern",
	backToSuggestion: "Zurück zum Vorschlag",
	notANumber: "Bitte eine Zahl eingeben.",
	belowMin: "Mindestens {min}.",
	aboveMax: "Höchstens {max}.",
	offStep: "In Schritten von {step}.",
	stateSuggested: "Vorschlag.",
	stateConfirmed: "Bestätigt.",
	suggestionWas: "Vorschlag: {value}.",
	enterConfirms: "Enter bestätigt.",
	escapeReverts: "Escape: zurück zum Vorschlag.",
	confirmValue: "Bestätigen",
	backToSuggestionValue: "Zurück zum Vorschlag: {value}",
	originSentence: "Herkunft: {origin}.",
	originCustomer: "Kunde",
	originStaff: "Ergänzt",
	originStaffBy: "Ergänzt von {name}",
	originAssumed: "Angenommen",
	originMissing: "Fehlt",
	originVia: "{source} per {via}",
	viaEmail: "E-Mail",
	viaForm: "Formular",
	fieldMessage: "{field}: {message}",
	valueWithUnit: "{value} {unit}",
	unitM2: "Quadratmeter",
	unitM3: "Kubikmeter",
	unitM: "Meter",
	unitMm: "Millimeter",
	unitCm: "Zentimeter",
	unitKm: "Kilometer",
	unitKg: "Kilogramm",
	unitH: "Stunden",
	unitPercent: "Prozent",
	unitChf: "Franken",
	unitEur: "Euro"
};
var deDE = {
	close: "Schließen",
	unitChf: "Schweizer Franken"
};
var builtIn = {
	en,
	de,
	"de-DE": deDE,
	"de-AT": deDE
};
/**
* The table for a locale: English underneath, the language over it, the
* region over that, the app's own entries on top. So `de-AT` gets German
* with "Schließen", `de-CH` gets German with "Schliessen", `fr-CH` gets
* English until an app supplies French — and never a missing key.
*/
function resolveMessages(locale, overrides) {
	const lang = locale.split("-")[0];
	return {
		...en,
		...builtIn[lang],
		...builtIn[locale],
		...overrides
	};
}
/**
* The language each resolved entry is WRITTEN in, as a BCP 47 tag — what
* a component puts in `lang` on the element that carries the words.
*
* The provider's own locale when the entry came from the app's
* overrides, the region's table or the language's table: `de-CH`, not a
* bare `de`, because under a correct `<html lang="de-CH">` a bare `de`
* could switch a screen reader's voice for nothing. `'en'` only where it
* fell back to English: `fr-CH` without a French table says "Loading",
* and that word has to be read as English.
*
* Not exported from the i18n entry: components read it through
* `t.lang(key)`, and the map is an implementation detail of that.
*/
function resolveMessageLangs(locale, overrides) {
	const lang = locale.split("-")[0];
	const out = {};
	for (const key of Object.keys(en)) out[key] = overrides?.[key] !== void 0 || builtIn[locale]?.[key] !== void 0 || lang === "en" || builtIn[lang]?.[key] !== void 0 ? locale : "en";
	return out;
}
function interpolate(value, vars, locale) {
	if (typeof value === "function") return value(vars, locale);
	return value.replace(/\{(\w+)\}/g, (_, k) => k in vars ? String(vars[k]) : `{${k}}`);
}
//#endregion
export { builtIn, de, en, interpolate, resolveMessageLangs, resolveMessages };

//# sourceMappingURL=messages.js.map