export interface TokenGroup {
  group: string
  scope?: string
  /** Semantic tokens are contrast-checked against --bg. */
  checkContrast?: boolean
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
    scope: 'Graded as foreground against --bg.',
    checkContrast: true,
    tokens: ['--accent', '--accent-hover']
  },
  {
    group: 'Status',
    scope: 'Graded for text use.',
    checkContrast: true,
    tokens: ['--success', '--warning', '--danger']
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
    group: 'Accent',
    tokens: ['--accent-100', '--accent-300', '--accent-500', '--accent-600', '--accent-700']
  },
  {
    group: 'Status',
    tokens: ['--green-500', '--amber-500', '--red-500']
  }
]
