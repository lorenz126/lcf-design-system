/**
 * One formatter for numbers, money, units and dates, per locale.
 *
 * WHY NOT toLocaleString(). It answers with whatever ICU the runtime
 * happens to carry, and ICU versions disagree. Measured on Node 22
 * (ICU 77): de-CH groups with U+2019 (’), where older data and other
 * runtimes give U+0027 ('), so a server render and a client hydrate can
 * print the same price two ways. de-AT is worse — the same ICU groups a
 * plain number with a no-break space (10 410,00) and a currency amount
 * with a dot (CHF 10.410,00).
 *
 * So the SEPARATORS are pinned where it matters, by market, and every
 * number goes through formatToParts with those substituted. The rest —
 * digit grouping positions, currency placement, percent spacing — is
 * Intl's, because Intl gets those right and identical everywhere.
 *
 * Every function here can be replaced through LcfProvider's `format`
 * prop. An app with its own rule for a market supplies it there, once,
 * and every component that prints a number follows.
 */
export interface Separators {
    group: string;
    decimal: string;
}
/**
 * Pinned where runtimes disagree, and only there. Every other locale
 * gets what Intl says. The two that were asked for: `10'410.00` in
 * Switzerland, `10.410,00` in Austria.
 */
export declare const MARKET_SEPARATORS: Record<string, Separators>;
/** Units the app domain needs. Intl has no square metre, so these are
 *  printed as number + no-break space + symbol, except where Intl has a
 *  real unit or a currency, which then speaks for itself. */
export type Unit = 'm2' | 'm3' | 'm' | 'mm' | 'cm' | 'km' | 'kg' | 'h' | 'percent' | 'CHF' | 'EUR';
export interface Format {
    locale: string;
    separators: Separators;
    number(value: number, options?: Intl.NumberFormatOptions): string;
    money(value: number, currency: string, options?: Intl.NumberFormatOptions): string;
    percent(ratio: number, options?: Intl.NumberFormatOptions): string;
    unit(value: number, unit: Unit, options?: Intl.NumberFormatOptions): string;
    /** ISO `yyyy-mm-dd` in, the locale's date out. Never a Date in: a Date
     *  carries a time zone, and a date in a form has none. */
    date(iso: string, style?: 'short' | 'medium' | 'long'): string;
    /** The locale's text back to a number; null when it is not one. */
    parseNumber(text: string): number | null;
    /** The symbol a field shows beside its value. */
    unitSymbol(unit: Unit): string;
}
/** What Intl itself uses for this locale, read once from a sample. */
export declare function intlSeparators(locale: string): Separators;
export declare function createFormat(locale: string, overrides?: Partial<Separators>): Format;
