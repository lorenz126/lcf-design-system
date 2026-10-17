/**
 * Every sentence a component says on its own, in one table per language.
 *
 * A component never writes English into its markup: it asks for a key,
 * and the key is looked up in the table for the locale the app set on
 * LcfProvider. An app overrides any entry — or supplies a whole language
 * the layer does not ship — through the provider's `messages` prop. The
 * check-strings guard fails the build on visible text in a component
 * that does not go through here.
 *
 * A value is a string with `{name}` placeholders, or a function for the
 * cases a placeholder cannot say: plurals, mostly. The function gets the
 * locale so it can ask Intl.PluralRules rather than guess.
 */
export type MessageValue = string | ((vars: Record<string, string | number>, locale: string) => string)

export interface Messages {
  loading: MessageValue
  dismiss: MessageValue
  close: MessageValue
  noRows: MessageValue
  noMatches: MessageValue
  nothingSelected: MessageValue
  fixTheFollowing: MessageValue
  chooseFiles: MessageValue
  series: MessageValue
  required: MessageValue
  increment: MessageValue
  decrement: MessageValue
  backToSuggestion: MessageValue
  notANumber: MessageValue
  belowMin: MessageValue
  aboveMax: MessageValue
  offStep: MessageValue

  /* Field: what a value is and where it came from. Each is said once,
     as a sentence of the control's description, so each ends in a full
     stop; the visible marks beside the label are aria-hidden. */
  stateSuggested: MessageValue
  stateConfirmed: MessageValue
  suggestionWas: MessageValue
  enterConfirms: MessageValue
  /* In a textarea Enter is a new line, so Ctrl+Enter confirms there.
     ⌘ Enter does too, on every platform, so this one sentence is true
     everywhere and the same on the server. */
  ctrlEnterConfirms: MessageValue
  escapeReverts: MessageValue
  confirmValue: MessageValue
  backToSuggestionValue: MessageValue
  originSentence: MessageValue
  originCustomer: MessageValue
  originStaff: MessageValue
  originStaffBy: MessageValue
  originAssumed: MessageValue
  originMissing: MessageValue
  originVia: MessageValue
  viaEmail: MessageValue
  viaForm: MessageValue
  /* A late announcement, prefixed with the field it is about. */
  fieldMessage: MessageValue

  /* NumberField: a unit is part of the field's NAME, spoken as a word.
     Intl has no square metre, and falls back to English without a word
     of warning, so the words live here. Plural, because a field's name
     is about the quantity, not one of it. */
  valueWithUnit: MessageValue
  unitM2: MessageValue
  unitM3: MessageValue
  unitM: MessageValue
  unitMm: MessageValue
  unitCm: MessageValue
  unitKm: MessageValue
  unitKg: MessageValue
  unitH: MessageValue
  unitPercent: MessageValue
  unitChf: MessageValue
  unitEur: MessageValue

  /* Textarea's character count. It reports and never blocks. The
     visible count is aria-hidden; the limit is said once, with the
     field's description, and what is left after the person stops
     typing. `{count}` and `{limit}` arrive formatted ("1'830"); `n` is
     the number itself, for choosing a plural. */
  characterCount: MessageValue
  characterLimit: MessageValue
  characterLimitLeft: MessageValue
  characterLimitOver: MessageValue
}

export type MessageKey = keyof Messages

/* The plural is chosen on `n` where the caller passes the number apart
   from its formatted text ("1'830" is no number to Intl.PluralRules),
   else on `count`. */
const plural = (one: string, other: string) =>
  (v: Record<string, string | number>, locale: string) =>
    (new Intl.PluralRules(locale).select(Number(v.n ?? v.count)) === 'one' ? one : other).replace('{count}', String(v.count))

export const en: Messages = {
  loading: 'Loading',
  dismiss: 'Dismiss',
  close: 'Close',
  noRows: 'No rows.',
  noMatches: 'No matches.',
  nothingSelected: 'Nothing selected.',
  fixTheFollowing: plural('Please fix the following:', 'Please fix the following {count}:'),
  chooseFiles: 'Choose files',
  series: 'Series',
  required: 'Required',
  increment: 'Increase',
  decrement: 'Decrease',
  backToSuggestion: 'Back to suggestion',
  notANumber: 'Enter a number.',
  belowMin: 'At least {min}.',
  aboveMax: 'At most {max}.',
  offStep: 'In steps of {step}.',

  stateSuggested: 'Suggestion.',
  stateConfirmed: 'Confirmed.',
  suggestionWas: 'Suggestion: {value}.',
  enterConfirms: 'Enter confirms.',
  ctrlEnterConfirms: 'Ctrl+Enter confirms.',
  escapeReverts: 'Escape: back to suggestion.',
  confirmValue: 'Confirm',
  backToSuggestionValue: 'Back to suggestion: {value}',
  originSentence: 'Source: {origin}.',
  originCustomer: 'Customer',
  originStaff: 'Added',
  originStaffBy: 'Added by {name}',
  originAssumed: 'Assumed',
  originMissing: 'Missing',
  originVia: '{source} via {via}',
  viaEmail: 'e-mail',
  viaForm: 'web form',
  fieldMessage: '{field}: {message}',

  valueWithUnit: '{value} {unit}',
  unitM2: 'square metres',
  unitM3: 'cubic metres',
  unitM: 'metres',
  unitMm: 'millimetres',
  unitCm: 'centimetres',
  unitKm: 'kilometres',
  unitKg: 'kilograms',
  unitH: 'hours',
  unitPercent: 'percent',
  unitChf: 'Swiss francs',
  unitEur: 'euros',

  characterCount: '{count} / {limit}',
  characterLimit: 'Up to {limit} characters.',
  characterLimitLeft: plural('{count} character left.', '{count} characters left.'),
  characterLimitOver: plural('{count} character too many.', '{count} characters too many.')
}

/* Swiss and German usage differ in one letter that matters here: ß.
   The Swiss table is a separate entry only where the words differ, and
   inherits the rest — see resolveMessages. */
export const de: Messages = {
  loading: 'Wird geladen',
  dismiss: 'Ausblenden',
  close: 'Schliessen',
  noRows: 'Keine Zeilen.',
  noMatches: 'Keine Treffer.',
  nothingSelected: 'Nichts ausgewählt.',
  fixTheFollowing: plural('Bitte korrigieren:', 'Bitte {count} Punkte korrigieren:'),
  chooseFiles: 'Dateien wählen',
  series: 'Reihe',
  required: 'Pflichtfeld',
  increment: 'Erhöhen',
  decrement: 'Verringern',
  backToSuggestion: 'Zurück zum Vorschlag',
  notANumber: 'Bitte eine Zahl eingeben.',
  belowMin: 'Mindestens {min}.',
  aboveMax: 'Höchstens {max}.',
  offStep: 'In Schritten von {step}.',

  stateSuggested: 'Vorschlag.',
  stateConfirmed: 'Bestätigt.',
  suggestionWas: 'Vorschlag: {value}.',
  enterConfirms: 'Enter bestätigt.',
  ctrlEnterConfirms: 'Strg+Enter bestätigt.',
  escapeReverts: 'Escape: zurück zum Vorschlag.',
  confirmValue: 'Bestätigen',
  backToSuggestionValue: 'Zurück zum Vorschlag: {value}',
  originSentence: 'Herkunft: {origin}.',
  originCustomer: 'Kunde',
  originStaff: 'Ergänzt',
  originStaffBy: 'Ergänzt von {name}',
  originAssumed: 'Angenommen',
  originMissing: 'Fehlt',
  originVia: '{source} per {via}',
  viaEmail: 'E-Mail',
  viaForm: 'Formular',
  fieldMessage: '{field}: {message}',

  valueWithUnit: '{value} {unit}',
  unitM2: 'Quadratmeter',
  unitM3: 'Kubikmeter',
  unitM: 'Meter',
  unitMm: 'Millimeter',
  unitCm: 'Zentimeter',
  unitKm: 'Kilometer',
  unitKg: 'Kilogramm',
  unitH: 'Stunden',
  unitPercent: 'Prozent',
  /* In Switzerland the franc needs no country; elsewhere it does. */
  unitChf: 'Franken',
  unitEur: 'Euro',

  characterCount: '{count} / {limit}',
  characterLimit: 'Höchstens {limit} Zeichen.',
  characterLimitLeft: 'Noch {count} Zeichen.',
  characterLimitOver: '{count} Zeichen zu viel.'
}

const deDE: Partial<Messages> = { close: 'Schließen', unitChf: 'Schweizer Franken' }

export const builtIn: Record<string, Partial<Messages>> = { en, de, 'de-DE': deDE, 'de-AT': deDE }

/**
 * The table for a locale: English underneath, the language over it, the
 * region over that, the app's own entries on top. So `de-AT` gets German
 * with "Schließen", `de-CH` gets German with "Schliessen", `fr-CH` gets
 * English until an app supplies French — and never a missing key.
 */
export function resolveMessages(locale: string, overrides?: Partial<Messages>): Messages {
  const lang = locale.split('-')[0]!
  return { ...en, ...builtIn[lang], ...builtIn[locale], ...overrides }
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
export function resolveMessageLangs(locale: string, overrides?: Partial<Messages>): Record<MessageKey, string> {
  const lang = locale.split('-')[0]!
  const out = {} as Record<MessageKey, string>
  for (const key of Object.keys(en) as MessageKey[]) {
    const own = overrides?.[key] !== undefined
      || builtIn[locale]?.[key] !== undefined
      || lang === 'en'
      || builtIn[lang]?.[key] !== undefined
    out[key] = own ? locale : 'en'
  }
  return out
}

export function interpolate(value: MessageValue, vars: Record<string, string | number>, locale: string): string {
  if (typeof value === 'function') return value(vars, locale)
  return value.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`))
}
