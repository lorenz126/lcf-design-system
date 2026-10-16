import { useId, type MouseEvent, type ReactNode } from 'react'
import { docsHref, followInSite } from './links'
import './Cards.css'

/**
 * A grid of link cards for the overview pages: a title, one sentence,
 * and where it goes. Two columns where a column holds 18rem, one below
 * that — at 390 a single column, never a sideways scroll.
 *
 * A LIST OF REAL LINKS. The site this follows builds its cards from
 * divs with a click handler, which a keyboard cannot reach; here each
 * card is an <a>, so Tab reaches it, Enter follows it, and a
 * middle-click opens it in a new tab. The list says how many there are.
 *
 * The title is a span, not an h3: the "On this page" box lists every h2
 * and h3, and would list each card; and workshop.css sets every h3 in
 * the docs to section-heading size with !important.
 *
 * `sb-unstyled` keeps Storybook's typography for raw elements (ul, li,
 * a) off the grid; everything it shows is set in Cards.css, from
 * tokens.
 */
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    // role="list": Safari drops the list role from a list without bullets.
    <ul className="sb-unstyled lcf-doc-cards" role="list">
      {children}
    </ul>
  )
}

export interface CardProps {
  title: string
  /** One sentence. A string, so MDX cannot wrap it in a <p> inside the link. */
  description?: string
  icon?: ReactNode
  /** A docs page: the title its Meta gives it ('Overview/Installation'), or a component meta's id. */
  to?: string
  /** An anchor on this page ('#components'), instead of `to`. */
  href?: string
}

export function Card({ title, description, icon, to, href }: CardProps) {
  const id = useId()
  // An in-page anchor must say _self: the iframe's <base target="_parent">
  // would otherwise load iframe.html#components into the manager's place.
  // A page of the site is followed inside it (links.ts says why); its
  // href stays for a middle click, cmd-click, and iframe.html on its own.
  const link = to
    ? { href: docsHref(to), target: '_top', onClick: (e: MouseEvent<HTMLAnchorElement>) => followInSite(e, to) }
    : { href, target: '_self' }
  return (
    <li className="lcf-doc-card">
      {/* The name is the title; the sentence is its description, read after it. */}
      <a className="lcf-doc-card-link" {...link} aria-labelledby={`${id}-t`} aria-describedby={description ? `${id}-d` : undefined}>
        {icon && <span className="lcf-doc-card-icon" aria-hidden="true">{icon}</span>}
        <span className="lcf-doc-card-title" id={`${id}-t`}>{title}</span>
        {description && <span className="lcf-doc-card-text" id={`${id}-d`}>{description}</span>}
      </a>
    </li>
  )
}
