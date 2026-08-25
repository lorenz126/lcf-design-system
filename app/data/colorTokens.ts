export interface TokenGroup {
  group: string
  scope?: string
  /** Contrast-check this group. */
  checkContrast?: boolean
  /** What to grade against: the page ('bg', default) or the token's own
   *  fill ('fill' — for badge text, which never sits on the page). */
  against?: 'bg' | 'fill'
  tokens: string[]
}

/** Tier 2 — the only tokens components are allowed to use. */
export const semantic: TokenGroup[] = [
  {
    group: 'Text',
    scope: 'Checked against --bg.',
    checkContrast: true,
    tokens: ['--fg', '--fg-muted', '--fg-subtle']
  },
  {
    group: 'Surfaces',
    scope: 'Page, cards, wells. Not contrast-graded — these ARE the ground.',
    tokens: ['--bg', '--bg-raised', '--bg-sunken', '--accent-subtle']
  },
  {
    group: 'Borders',
    tokens: ['--border', '--border-strong']
  },
  {
    group: 'Accent',
    scope: 'Mapped onto blue. Graded against --bg.',
    checkContrast: true,
    tokens: ['--accent-text', '--accent', '--accent-hover']
  },
  {
    group: 'Palette · solid',
    scope: 'Apple system tones. Fills, dots, bars, icons — not graded.',
    tokens: ['--yellow', '--green', '--blue', '--purple', '--red', '--orange']
  },
  {
    group: 'Palette · text',
    scope: 'Graded against --bg. Must clear 4.5:1.',
    checkContrast: true,
    tokens: ['--yellow-text', '--green-text', '--blue-text',
             '--purple-text', '--red-text', '--orange-text']
  },
  {
    group: 'Palette · fill',
    scope: 'The tone at low alpha. Badge grounds — not graded.',
    tokens: ['--yellow-fill', '--green-fill', '--blue-fill',
             '--purple-fill', '--red-fill', '--orange-fill']
  },
  {
    group: 'Status roles',
    scope: 'Graded against their own fill — that is where they sit.',
    checkContrast: true,
    against: 'fill',
    tokens: ['--success-text', '--warning-text', '--danger-text']
  }
]

/** Tier 1 — never referenced by components. */
export const primitives: TokenGroup[] = [
  {
    group: 'Neutral',
    tokens: [
      '--gray-0', '--gray-50', '--gray-100', '--gray-200', '--gray-300',
      '--gray-400', '--gray-500', '--gray-600', '--gray-700', '--gray-800',
      '--gray-900', '--gray-950', '--gray-1000'
    ]
  },
  {
    group: 'Apple system hues',
    tokens: ['--yellow', '--green', '--blue', '--purple', '--red', '--orange']
  }
]
