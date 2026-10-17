export declare function ensureAnnouncer(): HTMLElement | null;
/**
 * Speak `message`, marked as written in `lang` (from `t.lang(key)`).
 * An empty `lang` claims none: words the browser wrote, in a language
 * the page cannot know.
 */
export declare function announce(message: string, lang: string): void;
/** For tests, and for anything that tears the document down itself. */
export declare function _resetAnnouncer(): void;
/**
 * An element's text as a screen reader would read it as a name: without
 * aria-hidden or hidden parts (a label's "*"). The prefix of a late
 * announcement — "Fläche: Höchstens 500 m²." — is built from it by Field
 * and by NumberField alike, so the same problem said by both is the same
 * sentence and is queued once.
 */
export declare function spokenText(node: Node | null | undefined): string;
