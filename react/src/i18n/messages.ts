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
}

export type MessageKey = keyof Messages

const plural = (one: string, other: string) =>
  (v: Record<string, string | number>, locale: string) =>
    (new Intl.PluralRules(locale).select(Number(v.count)) === 'one' ? one : other).replace('{count}', String(v.count))

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
  offStep: 'In steps of {step}.'
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
  offStep: 'In Schritten von {step}.'
}

const deDE: Partial<Messages> = { close: 'Schließen' }

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

export function interpolate(value: MessageValue, vars: Record<string, string | number>, locale: string): string {
  if (typeof value === 'function') return value(vars, locale)
  return value.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`))
}
