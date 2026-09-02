/**
 * The navigation is organised by TIER, and now so are the routes.
 *
 * Every component has its own page at `/<tier>/<name>`, which is why
 * there is no `to` on an item any more — a hand-written path was a
 * second place for the answer to live, and it drifted every time a
 * component moved. The tier is the parent because the tier is the
 * structural fact this framework actually enforces: `check-layers`
 * refuses an atom that reaches for a molecule. "Inputs" and "Overlays"
 * were categories that existed in the workshop and nowhere else, and a
 * component sitting under one of them said nothing you could check.
 *
 * Keep this list in step with ui/. check-layers enforces the dependency
 * direction; nothing enforces that this list is complete.
 */
import type { Component } from 'vue'
import { Atom, Blocks, Boxes, Compass, Github, LayoutTemplate, Palette, Type } from 'lucide-vue-next'
import type { SidebarItem } from '../../../ui/organisms/Sidebar.vue'

export interface NavItem { name: string; to: string; note?: string }
export interface NavGroup { label: string; icon: Component; dir: string; items: NavItem[] }

/** PascalCase to the file name Nuxt routed: ToggleGroup → toggle-group. */
const slug = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const group = (label: string, dir: string, icon: Component, names: [string, string?][]): NavGroup => ({
  label,
  dir,
  icon,
  items: names.map(([name, note]) => ({ name, to: `/${dir}/${slug(name)}`, note }))
})

export const foundations: NavItem[] = [
  { name: 'Principles', to: '/' },
  { name: 'Type', to: '/type' },
  { name: 'Colour', to: '/color' }
]

export const tiers: NavGroup[] = [
  group('Atoms', 'atoms', Atom, [
    ['Button'],
    ['Icon'],
    ['Badge'],
    ['Spinner'],
    ['Progress'],
    ['Divider'],
    ['Avatar'],
    ['Field', 'Input, Textarea and Slider use it'],
    ['Input'],
    ['Textarea'],
    ['Slider'],
    ['Checkbox'],
    ['Radio'],
    ['Switch']
  ]),
  group('Molecules', 'molecules', Blocks, [
    ['Card'],
    ['Banner'],
    ['EmptyState'],
    ['Pagination'],
    ['Breadcrumb'],
    ['Tabs'],
    ['TopBar', 'slots only'],
    ['FormSection'],
    ['Prose'],
    ['Select', 'uses Icon'],
    ['ToggleGroup'],
    ['SearchField'],
    ['Combobox', 'a form one; SearchField is chrome'],
    ['CommandPalette', 'useCommands() fills it'],
    ['Tooltip'],
    ['Popover'],
    ['Menu', 'uses Popover, Icon'],
    ['Dialog'],
    ['Drawer'],
    ['Toaster', 'useToast() raises them']
  ]),
  group('Organisms', 'organisms', Boxes, [
    ['List'],
    ['Table'],
    ['Form'],
    ['Toc'],
    ['Attachments'],
    ['Chart'],
    ['Calendar'],
    ['DatePicker', 'uses Calendar, Field'],
    ['Kanban'],
    ['Diagram'],
    ['Sidebar', 'owns a tree of items'],
    ['TreeView', 'the depth Sidebar refuses']
  ]),
  group('Templates', 'templates', LayoutTemplate, [
    ['AppShell', 'shown with TopBar and Sidebar'],
    ['SplitView'],
    ['DocLayout']
  ])
]

const ICONS: Record<string, Component> = { Principles: Compass, Type, Colour: Palette }

/**
 * The same data as a Sidebar tree. Notes are dropped here on purpose: in
 * a 260px column a trailing sentence pushes the name into an ellipsis.
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
