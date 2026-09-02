import { seed, type Issue, type Status } from '~/data/issues'

/**
 * One list of issues, shared by every page.
 *
 * useState rather than a module-level ref: a module-level one is shared
 * between requests on the server, so two people would edit each other's
 * data. It is also what makes moving a card on the board show up in the
 * table — the whole reason this demo has more than one page.
 */
export function useIssues() {
  const issues = useState<Issue[]>('issues', seed)

  const byId = (id: number) => issues.value.find(i => i.id === id)

  function update(id: number, patch: Partial<Issue>) {
    const i = issues.value.findIndex(x => x.id === id)
    if (i < 0) return
    issues.value = issues.value.map((x, n) =>
      n === i ? { ...x, ...patch, updated: new Date().toISOString() } : x
    )
  }

  function move(id: number, status: Status) {
    update(id, { status })
  }

  function remove(ids: number[]) {
    const gone = new Set(ids)
    issues.value = issues.value.filter(i => !gone.has(i.id))
  }

  return { issues, byId, update, move, remove }
}
