/**
 * The navigation is organised by TIER, not by page, because "which tier
 * is Select in" is the question the structure has to answer. Several
 * pages demonstrate more than one tier — /data shows Card (molecule)
 * beside List and Table (organisms) — so a page-shaped menu would hide
 * exactly what the atomic split is for.
 *
 * Keep this in step with ui/. scripts/check-layers.mjs enforces the
 * dependency direction; nothing enforces that this list is complete.
 */
export interface NavItem { name: string; to: string; note?: string }
export interface NavGroup { label: string; items: NavItem[] }

export const foundations: NavItem[] = [
  { name: 'Principles', to: '/' },
  { name: 'Type', to: '/type' },
  { name: 'Colour', to: '/color' }
]

export const tiers: NavGroup[] = [
  {
    label: 'Atoms',
    items: [
      { name: 'Button', to: '/buttons' },
      { name: 'Icon', to: '/buttons', note: 'shown with Button' },
      { name: 'Badge', to: '/badges' },
      { name: 'Input', to: '/inputs' },
      { name: 'Checkbox', to: '/controls' },
      { name: 'Radio', to: '/controls' },
      { name: 'Switch', to: '/controls' }
    ]
  },
  {
    label: 'Molecules',
    items: [
      { name: 'Select', to: '/controls', note: 'uses Icon' },
      { name: 'Card', to: '/data' },
      { name: 'FormSection', to: '/forms' },
      { name: 'Prose', to: '/docs' },
      { name: 'Tooltip', to: '/overlays' },
      { name: 'Popover', to: '/overlays' },
      { name: 'Dialog', to: '/overlays' }
    ]
  },
  {
    label: 'Organisms',
    items: [
      { name: 'List', to: '/data' },
      { name: 'Table', to: '/data' },
      { name: 'Form', to: '/forms' },
      { name: 'Toc', to: '/docs' },
      { name: 'Attachments', to: '/files' },
      { name: 'Chart', to: '/charts' }
    ]
  },
  {
    label: 'Templates',
    items: [
      { name: 'AppShell', to: '/templates' },
      { name: 'SplitView', to: '/templates' },
      { name: 'DocLayout', to: '/docs', note: 'used on Docs' }
    ]
  }
]
