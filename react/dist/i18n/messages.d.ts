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
export type MessageValue = string | ((vars: Record<string, string | number>, locale: string) => string);
export interface Messages {
    loading: MessageValue;
    dismiss: MessageValue;
    close: MessageValue;
    noRows: MessageValue;
    noMatches: MessageValue;
    nothingSelected: MessageValue;
    fixTheFollowing: MessageValue;
    chooseFiles: MessageValue;
    series: MessageValue;
    required: MessageValue;
    increment: MessageValue;
    decrement: MessageValue;
    backToSuggestion: MessageValue;
    notANumber: MessageValue;
    belowMin: MessageValue;
    aboveMax: MessageValue;
    offStep: MessageValue;
    stateSuggested: MessageValue;
    stateConfirmed: MessageValue;
    suggestionWas: MessageValue;
    enterConfirms: MessageValue;
    escapeReverts: MessageValue;
    confirmValue: MessageValue;
    backToSuggestionValue: MessageValue;
    originSentence: MessageValue;
    originCustomer: MessageValue;
    originStaff: MessageValue;
    originStaffBy: MessageValue;
    originAssumed: MessageValue;
    originMissing: MessageValue;
    originVia: MessageValue;
    viaEmail: MessageValue;
    viaForm: MessageValue;
    fieldMessage: MessageValue;
    valueWithUnit: MessageValue;
    unitM2: MessageValue;
    unitM3: MessageValue;
    unitM: MessageValue;
    unitMm: MessageValue;
    unitCm: MessageValue;
    unitKm: MessageValue;
    unitKg: MessageValue;
    unitH: MessageValue;
    unitPercent: MessageValue;
    unitChf: MessageValue;
    unitEur: MessageValue;
}
export type MessageKey = keyof Messages;
export declare const en: Messages;
export declare const de: Messages;
export declare const builtIn: Record<string, Partial<Messages>>;
/**
 * The table for a locale: English underneath, the language over it, the
 * region over that, the app's own entries on top. So `de-AT` gets German
 * with "Schließen", `de-CH` gets German with "Schliessen", `fr-CH` gets
 * English until an app supplies French — and never a missing key.
 */
export declare function resolveMessages(locale: string, overrides?: Partial<Messages>): Messages;
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
export declare function resolveMessageLangs(locale: string, overrides?: Partial<Messages>): Record<MessageKey, string>;
export declare function interpolate(value: MessageValue, vars: Record<string, string | number>, locale: string): string;
