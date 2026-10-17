/**
 * `useBreakpoint('md')` — true at that width and above. Mobile first:
 * the base is the phone, and a breakpoint is where more room arrives.
 *
 * The widths are the ones the tokens document and the Tailwind preset
 * exposes, so a utility class and this hook agree on where `md` begins.
 * On the server, and on the first client render, the answer is false —
 * the phone layout — so hydration never disagrees with what was sent.
 */
export declare const BREAKPOINTS: {
    readonly sm: 640;
    readonly md: 860;
    readonly lg: 1100;
    readonly xl: 1440;
};
export type Breakpoint = keyof typeof BREAKPOINTS;
export declare function useBreakpoint(bp: Breakpoint): boolean;
