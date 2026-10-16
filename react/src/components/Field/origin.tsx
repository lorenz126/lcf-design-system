import { CircleDashed, ClipboardList, EqualApproximately, Mail, UserRound, UserRoundPen, type LucideIcon } from 'lucide-react'
import type { Translate } from '../../i18n/context'
import type { MessageKey } from '../../i18n/messages'
import type { Origin, OriginSource } from '../types'

/**
 * Where a value came from, said the same way everywhere: by Field now,
 * by MediaPanel and MediaCell when media items arrive. Internal until
 * then; becoming a public component is additive.
 *
 * The mark is NEUTRAL — no data-color. The state says what needs a
 * person; the origin only says who said it. Its icon is --fg-subtle (a
 * graphic, 3:1 or better in both themes), its words --fg-muted.
 */
export const ORIGIN_ICON: Record<OriginSource, LucideIcon> = {
  customer: UserRound,
  staff: UserRoundPen,
  assumed: EqualApproximately,
  missing: CircleDashed
}

const SOURCE_KEY: Record<OriginSource, MessageKey> = {
  customer: 'originCustomer',
  staff: 'originStaff',
  assumed: 'originAssumed',
  missing: 'originMissing'
}

/** The source string is shorthand: origin="assumed". */
export function normaliseOrigin(origin: Origin | OriginSource | undefined): Origin | undefined {
  return typeof origin === 'string' ? { source: origin } : origin
}

/**
 * The origin in words, and the key whose language they are in:
 * "Kunde per E-Mail" (originVia), "Ergänzt von Anna" (originStaffBy),
 * "Angenommen" (originAssumed).
 */
export function originWords(origin: Origin, t: Translate): { text: string; key: MessageKey } {
  const named = origin.source === 'staff' && origin.by
  const sourceKey: MessageKey = named ? 'originStaffBy' : SOURCE_KEY[origin.source]
  const words = t(sourceKey, named ? { name: origin.by! } : {})
  if (!origin.via) return { text: words, key: sourceKey }
  return {
    text: t('originVia', { source: words, via: t(origin.via === 'email' ? 'viaEmail' : 'viaForm') }),
    key: 'originVia'
  }
}

function originIcon(origin: Origin): LucideIcon {
  // A customer's channel is the more useful picture: a letter, a form.
  if (origin.source === 'customer' && origin.via) return origin.via === 'email' ? Mail : ClipboardList
  return ORIGIN_ICON[origin.source]
}

/** The visible mark: an icon and the words. aria-hidden — Field speaks it as a sentence. */
export function OriginMark({ origin, t }: { origin: Origin; t: Translate }) {
  const Icon = originIcon(origin)
  const { text, key } = originWords(origin, t)
  return (
    <span className="lcf-field-origin" data-origin={origin.source} aria-hidden="true" lang={t.lang(key)}>
      <Icon />
      {text}
    </span>
  )
}
