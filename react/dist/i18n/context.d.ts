import { type ComponentType, type ReactNode } from 'react';
import { type Format, type Separators } from './format';
import { type MessageKey, type Messages } from './messages';
/**
 * What the app sets ONCE, at the root, and every component reads.
 *
 * Without a provider a component still works — English, en-GB, plain
 * <a> links — so a component in isolation (a test, a story) needs no
 * set-up. With one, everything below follows its locale: the texts, the
 * numbers, the dates, and the link component that Sidebar and Breadcrumb
 * render.
 */
export interface LcfConfig {
    /** BCP 47. `de-CH`, `de-AT`, `fr-CH`, `en-GB`. */
    locale: string;
    messages: Messages;
    format: Format;
    /** The router's link. A component, never a string. */
    linkComponent: ComponentType<{
        href: string;
        className?: string;
        children?: ReactNode;
    }> | 'a';
}
export interface LcfProviderProps {
    locale?: string;
    /** Any entry overrides the built-in table; a language the layer does
     *  not ship is supplied here in full. */
    messages?: Partial<Messages>;
    /** Replace the formatter wholesale, or only some of its functions. */
    format?: Partial<Format>;
    /** Pin the separators for this app's market. See MARKET_SEPARATORS. */
    separators?: Partial<Separators>;
    linkComponent?: LcfConfig['linkComponent'];
    children?: ReactNode;
}
export declare function LcfProvider({ locale, messages, format, separators, linkComponent, children }: LcfProviderProps): import("react").JSX.Element;
export declare function useLcf(): LcfConfig;
/**
 * What useMessages() returns: a function for the words, and `lang` for
 * the language they are in.
 *
 * `t('belowMin', { min: 3 })` is the component's sentence, in the app's
 * language. `t.lang('belowMin')` is the BCP 47 tag that sentence is
 * written in — the provider's locale, or `'en'` where the table fell
 * back to English — for the `lang` attribute of the element that carries
 * it. A screen reader reads text in the language the document declares
 * unless an element says otherwise, so German words under an English
 * `<html lang>` are read with English rules unless their element says so.
 */
export interface Translate {
    (key: MessageKey, vars?: Record<string, string | number>): string;
    /** The BCP 47 tag the resolved entry is written in: the provider's locale, or 'en' when it fell back. */
    lang(key: MessageKey): string;
}
/** `t('belowMin', { min: 3 })` — the component's sentence, in the app's language; `t.lang(key)` — the language it is in. */
export declare function useMessages(): Translate;
export declare function useFormat(): Format;
