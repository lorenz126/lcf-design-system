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
    group: 'Status · fill',
    scope: 'Badges, dots, bars. Not graded — these are grounds, not text.',
    tokens: ['--success', '--warning', '--danger']
  },
  {
    group: 'Status · text',
    scope: 'Graded against --bg. Must clear 4.5:1.',
    checkContrast: true,
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
    group: 'Accent',
    tokens: ['--accent-100', '--accent-300', '--accent-500', '--accent-600', '--accent-700']
  },
  {
    group: 'Status',
    tokens: [
      '--green-300', '--green-500', '--green-700',
      '--amber-300', '--amber-500', '--amber-700',
      '--red-300', '--red-500', '--red-700'
    ]
  }
]
