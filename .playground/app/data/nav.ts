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
import type { Component } from 'vue'
import { Atom, Blocks, Boxes, Compass, Github, LayoutTemplate, Palette, Type } from 'lucide-vue-next'
import type { SidebarItem } from '../../../ui/organisms/Sidebar.vue'

export interface NavItem { name: string; to: string; note?: string }
export interface NavGroup { label: string; icon: Component; items: NavItem[] }

export const foundations: NavItem[] = [
  { name: 'Principles', to: '/' },
  { name: 'Type', to: '/type' },
  { name: 'Colour', to: '/color' }
]

export const tiers: NavGroup[] = [
  {
    label: 'Atoms',
    icon: Atom,
    items: [
      { name: 'Button', to: '/buttons' },
      { name: 'Icon', to: '/buttons', note: 'shown with Button' },
      { name: 'Badge', to: '/badges' },
      { name: 'Spinner', to: '/buttons' },
      { name: 'Progress', to: '/files' },
      { name: 'Divider', to: '/data' },
      { name: 'Avatar', to: '/templates', note: 'shown with the shell' },
      { name: 'Field', to: '/inputs', note: 'Input and Select use it' },
      { name: 'Input', to: '/inputs' },
      { name: 'Textarea', to: '/inputs' },
      { name: 'Slider', to: '/inputs' },
      { name: 'Checkbox', to: '/controls' },
      { name: 'Radio', to: '/controls' },
      { name: 'Switch', to: '/controls' }
    ]
  },
  {
    label: 'Molecules',
    icon: Blocks,
    items: [
      { name: 'Select', to: '/controls', note: 'uses Icon' },
      { name: 'ToggleGroup', to: '/controls' },
      { name: 'Drawer', to: '/overlays' },
      { name: 'Toaster', to: '/overlays', note: 'useToast() raises them' },
      { name: 'Card', to: '/data' },
      { name: 'Banner', to: '/data' },
      { name: 'EmptyState', to: '/data' },
      { name: 'Pagination', to: '/data' },
      { name: 'Breadcrumb', to: '/templates' },
      { name: 'Tabs', to: '/templates', note: 'not for routes — see the page' },
      { name: 'FormSection', to: '/forms' },
      { name: 'Prose', to: '/docs' },
      { name: 'Tooltip', to: '/overlays' },
      { name: 'Popover', to: '/overlays' },
      { name: 'Menu', to: '/overlays', note: 'uses Popover, Icon' },
      { name: 'SearchField', to: '/inputs' },
      { name: 'CommandPalette', to: '/overlays', note: 'useCommands() fills it' },
      { name: 'Dialog', to: '/overlays' },
      { name: 'TopBar', to: '/templates', note: 'slots only' }
    ]
  },
  {
    label: 'Organisms',
    icon: Boxes,
    items: [
      { name: 'List', to: '/data' },
      { name: 'Table', to: '/data' },
      { name: 'Form', to: '/forms' },
      { name: 'Toc', to: '/docs' },
      { name: 'Attachments', to: '/files' },
      { name: 'Chart', to: '/charts' },
      { name: 'Calendar', to: '/calendar' },
      { name: 'DatePicker', to: '/calendar', note: 'uses Calendar, Field' },
      { name: 'Kanban', to: '/board' },
      { name: 'Diagram', to: '/diagrams' },
      { name: 'Sidebar', to: '/templates', note: 'owns a tree of items' }
    ]
  },
  {
    label: 'Templates',
    icon: LayoutTemplate,
    items: [
      { name: 'AppShell', to: '/templates' },
      { name: 'SplitView', to: '/templates' },
      { name: 'DocLayout', to: '/docs', note: 'used on Docs' }
    ]
  }
]

const ICONS: Record<string, Component> = { Principles: Compass, Type, Colour: Palette }

/**
 * The same data as a Sidebar tree. Notes are dropped here on purpose:
 * in a 260px column a trailing sentence pushes the name into an ellipsis,
 * and the note only ever said which page a component shares — which the
 * sidebar answers anyway, by lighting up every row that page documents.
 */
export const sidebar: SidebarItem[] = [
  ...foundations.map(f => ({ label: f.name, to: f.to, icon: ICONS[f.name] })),
  ...tiers.map((t, i) => ({
    label: t.label,
    icon: t.icon,
    heading: i === 0 ? 'Components' : undefined,
    divider: i === 0,
    badge: String(t.items.length),
    children: t.items.map(x => ({ label: x.name, to: x.to }))
  })),
  {
    label: 'Repository',
    to: 'https://github.com/lorenz126/flechtenmacher-font',
    icon: Github,
    external: true,
    divider: true,
    heading: 'Elsewhere'
  }
]
