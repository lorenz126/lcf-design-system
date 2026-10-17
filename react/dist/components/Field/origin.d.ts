import { type LucideIcon } from 'lucide-react';
import type { Translate } from '../../i18n/context';
import type { MessageKey } from '../../i18n/messages';
import type { Origin, OriginSource } from '../types';
/**
 * Where a value came from, said the same way everywhere: by Field now,
 * by MediaPanel and MediaCell when media items arrive. Internal until
 * then; becoming a public component is additive.
 *
 * The mark is NEUTRAL — no data-color. The state says what needs a
 * person; the origin only says who said it. Its icon is --fg-subtle (a
 * graphic, 3:1 or better in both themes), its words --fg-muted.
 */
export declare const ORIGIN_ICON: Record<OriginSource, LucideIcon>;
/** The source string is shorthand: origin="assumed". */
export declare function normaliseOrigin(origin: Origin | OriginSource | undefined): Origin | undefined;
/**
 * The origin in words, and the key whose language they are in:
 * "Kunde per E-Mail" (originVia), "Ergänzt von Anna" (originStaffBy),
 * "Angenommen" (originAssumed).
 */
export declare function originWords(origin: Origin, t: Translate): {
    text: string;
    key: MessageKey;
};
/** The visible mark: an icon and the words. aria-hidden — Field speaks it as a sentence. */
export declare function OriginMark({ origin, t }: {
    origin: Origin;
    t: Translate;
}): import("react").JSX.Element;
