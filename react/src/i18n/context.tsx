import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react'
import { createFormat, type Format, type Separators } from './format'
import { interpolate, resolveMessages, type MessageKey, type Messages } from './messages'

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

const DEFAULT_LOCALE = 'en-GB'

const fallback: LcfConfig = {
  locale: DEFAULT_LOCALE,
  messages: resolveMessages(DEFAULT_LOCALE),
  format: createFormat(DEFAULT_LOCALE),
  linkComponent: 'a'
}

const Ctx = createContext<LcfConfig>(fallback)

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
  const value = useMemo<LcfConfig>(() => ({
    locale,
    messages: resolveMessages(locale, messages),
    format: { ...createFormat(locale, separators), ...format },
    linkComponent
  }), [locale, messages, format, separators, linkComponent])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLcf(): LcfConfig {
  return useContext(Ctx)
}

/** `t('belowMin', { min: 3 })` — the component's sentence, in the app's language. */
export function useMessages() {
  const { messages, locale } = useContext(Ctx)
  return useMemo(
    () => (key: MessageKey, vars: Record<string, string | number> = {}) => interpolate(messages[key], vars, locale),
    [messages, locale]
  )
}

export function useFormat(): Format {
  return useContext(Ctx).format
}
