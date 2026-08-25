/** Parse a computed colour string ("rgb(r, g, b)" / "rgba(r,g,b,a)") to [r,g,b]. */
export function parseRgb(s: string): [number, number, number] | null {
  const m = s.match(/-?[\d.]+/g)
  if (!m || m.length < 3) return null
  // color-mix() computes to `color(srgb r g b)` with 0–1 channels, while
  // rgb() gives 0–255. Reading one as the other turns light blue into black.
  const scale = s.startsWith('color(') ? 255 : 1
  return [Number(m[0]) * scale, Number(m[1]) * scale, Number(m[2]) * scale]
}

/** Alpha of a computed colour string; 1 when opaque. */
export function parseAlpha(s: string): number {
  const m = s.match(/-?[\d.]+/g)
  if (!m) return 1
  const want = s.startsWith('color(') ? 4 : 4
  return m.length >= want ? Number(m[m.length - 1]) : 1
}

/** Flatten a translucent colour onto an opaque backdrop. Contrast maths
 *  is only meaningful against what the eye actually sees. */
export function composite(
  fg: [number, number, number],
  alpha: number,
  bg: [number, number, number]
): [number, number, number] {
  return [0, 1, 2].map(i => fg[i]! * alpha + bg[i]! * (1 - alpha)) as [number, number, number]
}

export function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')
}

/** WCAG relative luminance. */
function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** WCAG contrast ratio, 1–21. */
export function contrast(
  a: [number, number, number],
  b: [number, number, number]
): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** WCAG grade for normal-size text. */
export function grade(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}
