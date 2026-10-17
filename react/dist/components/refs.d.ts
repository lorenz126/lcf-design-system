import type { Ref, RefCallback } from 'react';
/**
 * One callback ref that sets several: a component's own ref (to read the
 * element) and the one its caller passed (React 19: `ref` is a prop).
 * React 19 runs the returned cleanup on detach, so each object ref is
 * cleared and each callback ref gets its own cleanup or null.
 */
export declare function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T>;
