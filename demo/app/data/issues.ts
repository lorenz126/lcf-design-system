export type Status = 'todo' | 'doing' | 'review' | 'done'
export type Priority = 'low' | 'normal' | 'high'

export interface Issue {
  id: number
  key: string
  title: string
  body: string
  status: Status
  priority: Priority
  assignee: string | null
  label: string
  updated: string
}

export const STATUS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'doing', label: 'In progress' },
  { value: 'review', label: 'In review' },
  { value: 'done', label: 'Done' }
]

export const PRIORITY: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' }
]

export const PEOPLE = ['Anna Weber', 'Tom Krause', 'Lorenz Flechtenmacher', 'Mira Sund']
export const LABELS = ['Platform', 'Design', 'Docs', 'Infra']

const T = (n: number) => new Date(Date.now() - n * 36e5).toISOString()

/* Enough rows that pagination is a real thing rather than a decoration,
   and enough variety that a filter can come back empty. */
const raw: [string, Status, Priority, number, number, number][] = [
  ['Sidebar collapses to nothing on narrow screens', 'doing', 'high', 0, 0, 2],
  ['Tooltip escapes the card on the settings page', 'todo', 'normal', 1, 1, 5],
  ['Contrast check fails for the warning badge', 'review', 'high', 2, 0, 7],
  ['Table header stops sticking inside a dialog', 'todo', 'normal', 0, 3, 9],
  ['Search returns nothing for hyphenated names', 'doing', 'normal', 3, 2, 11],
  ['Dark theme flashes on a cold load', 'done', 'high', 1, 3, 26],
  ['Kanban card loses focus after a keyboard move', 'review', 'normal', 2, 0, 30],
  ['Date picker refuses the last day of February', 'todo', 'low', 0, 1, 34],
  ['Chart axis reads NaN when a series is empty', 'doing', 'high', 3, 3, 38],
  ['Attachments list has no empty state', 'todo', 'low', 1, 1, 44],
  ['Breadcrumb wraps badly at 400px', 'review', 'low', 2, 1, 50],
  ['Form summary links to the wrong field', 'done', 'high', 0, 0, 58],
  ['Menu typeahead ignores repeated letters', 'done', 'normal', 3, 0, 63],
  ['Popover closes when clicking its own trigger', 'todo', 'high', 1, 2, 70],
  ['Avatar colours collide for similar names', 'doing', 'low', 2, 1, 76],
  ['Pagination window jumps at the last page', 'review', 'normal', 0, 3, 82],
  ['Spinner keeps spinning after an error', 'todo', 'normal', 3, 2, 90],
  ['Switch label is not clickable', 'done', 'low', 1, 1, 96],
  ['Prose code blocks overflow on mobile', 'todo', 'normal', 2, 2, 104],
  ['Diagram edges drift after a font swap', 'doing', 'normal', 0, 1, 110],
  ['Select shows the placeholder as an option', 'review', 'low', 3, 3, 118],
  ['Dialog does not return focus to its trigger', 'done', 'high', 1, 0, 126],
  ['Empty state text is centred but the button is not', 'todo', 'low', 2, 1, 132],
  ['Radio group loses its name inside a fieldset', 'todo', 'normal', 0, 2, 140],
  ['Toc highlights two sections at once', 'doing', 'normal', 3, 1, 148],
  ['Checkbox indeterminate state is not announced', 'review', 'high', 1, 3, 155],
  ['Card shadow clips on a rounded corner', 'done', 'low', 2, 0, 163],
  ['Input help text is read before the label', 'todo', 'normal', 0, 2, 170]
]

export const seed = (): Issue[] =>
  raw.map(([title, status, priority, person, label, hours], i) => ({
    id: i + 1,
    key: `TRK-${101 + i}`,
    title,
    body:
      'Reported from the workshop. Reproduce it, decide whether the fix belongs ' +
      'in the component or in the page that uses it, and write down which — the ' +
      'answer is the interesting part.',
    status,
    priority,
    assignee: i % 7 === 3 ? null : PEOPLE[person]!,
    label: LABELS[label]!,
    updated: T(hours)
  }))

export const statusLabel = (s: Status) => STATUS.find(x => x.value === s)!.label

export const statusTone = (s: Status) =>
  ({ todo: 'neutral', doing: 'blue', review: 'purple', done: 'green' } as const)[s]

export const priorityTone = (p: Priority) =>
  ({ low: 'neutral', normal: 'blue', high: 'red' } as const)[p]

/** "4 hours ago" — enough for a list, and no library. */
export function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 6e4)
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}
