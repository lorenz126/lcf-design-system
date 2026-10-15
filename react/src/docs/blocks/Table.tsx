import type { ReactNode } from 'react'
import './Table.css'

/**
 * A table on a docs page, from plain JSX rows:
 *
 *   <Table>
 *     <thead><tr><th>color</th><th>means</th></tr></thead>
 *     <tbody><tr><td>`primary`</td><td>the app's own colour</td></tr></tbody>
 *   </Table>
 *
 * WHY NOT A MARKDOWN TABLE. Storybook 10 compiles MDX 3 without GFM, and
 * nothing in main.ts adds remark-gfm — measured: the tables on Colors
 * and Locale rendered as one paragraph of pipes. The site-wide fix is
 * that plugin; until then this renders the same rows. Backticks inside a
 * cell still become code.
 *
 * `sb-unstyled` keeps Storybook's table styles off: they paint rows in
 * the manager theme's fixed light colours, which would stay white on the
 * dark page. Everything here is from tokens, so it follows the theme.
 */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="sb-unstyled lcf-doc-table">
      <table>{children}</table>
    </div>
  )
}
