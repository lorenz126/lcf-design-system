import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react'
import { createFormat, type Format, type Separators } from './format'
import { interpolate, resolveMessageLangs, resolveMessages, type MessageKey, type Messages } from './messages'

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
  locale: string
  messages: Messages
  format: Format
  /** The router's link. A component, never a string. */
  linkComponent: ComponentType<{ href: string; className?: string; children?: ReactNode }> | 'a'
}

/* What the context carries beyond the public config: the language each
   message is written in, worked out with the table so that t.lang() is
   a lookup. Internal; useLcf() still answers LcfConfig. */
interface LcfContextValue extends LcfConfig {
  messageLangs: Record<MessageKey, string>
}

const DEFAULT_LOCALE = 'en-GB'

const fallback: LcfContextValue = {
  locale: DEFAULT_LOCALE,
  messages: resolveMessages(DEFAULT_LOCALE),
  messageLangs: resolveMessageLangs(DEFAULT_LOCALE),
  format: createFormat(DEFAULT_LOCALE),
  linkComponent: 'a'
}

const Ctx = createContext<LcfContextValue>(fallback)

export interface LcfProviderProps {
  locale?: string
  /** Any entry overrides the built-in table; a language the layer does
   *  not ship is supplied here in full. */
  messages?: Partial<Messages>
  /** Replace the formatter wholesale, or only some of its functions. */
  format?: Partial<Format>
  /** Pin the separators for this app's market. See MARKET_SEPARATORS. */
  separators?: Partial<Separators>
  linkComponent?: LcfConfig['linkComponent']
  children?: ReactNode
}

export function LcfProvider({ locale = DEFAULT_LOCALE, messages, format, separators, linkComponent = 'a', children }: LcfProviderProps) {
  const value = useMemo<LcfContextValue>(() => ({
    locale,
    messages: resolveMessages(locale, messages),
    messageLangs: resolveMessageLangs(locale, messages),
    format: { ...createFormat(locale, separators), ...format },
    linkComponent
  }), [locale, messages, format, separators, linkComponent])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLcf(): LcfConfig {
  return useContext(Ctx)
}

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
  (key: MessageKey, vars?: Record<string, string | number>): string
  /** The BCP 47 tag the resolved entry is written in: the provider's locale, or 'en' when it fell back. */
  lang(key: MessageKey): string
}

/** `t('belowMin', { min: 3 })` — the component's sentence, in the app's language; `t.lang(key)` — the language it is in. */
export function useMessages(): Translate {
  const { messages, messageLangs, locale } = useContext(Ctx)
  return useMemo(
    () => Object.assign(
      (key: MessageKey, vars: Record<string, string | number> = {}) => interpolate(messages[key], vars, locale),
      { lang: (key: MessageKey) => messageLangs[key] }
    ),
    [messages, messageLangs, locale]
  )
}

export function useFormat(): Format {
  return useContext(Ctx).format
}
