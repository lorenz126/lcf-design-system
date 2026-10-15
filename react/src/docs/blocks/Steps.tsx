import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import './Steps.css'

/**
 * Numbered steps: each a heading with its number in a disc, and a rail
 * down the left of what belongs to it, so a code block reads as part of
 * step 3 and not as the start of something new.
 *
 *   <Steps>
 *   <Step title="Install">
 *
 *   ```bash
 *   pnpm add …
 *   ```
 *
 *   </Step>
 *   </Steps>
 *
 * The blank lines matter: without them MDX reads the body as text, not
 * as Markdown.
 *
 * THE NUMBER IS TEXT, given by <Steps> in order, so a step inserted in
 * the middle renumbers the rest. A CSS counter drew the same disc, but
 * Chromium leaves generated content out of the heading's accessible name
 * — measured: "Install", where the page before had "1. Install". As text
 * with a visually hidden ". ", a screen reader and the "On this page"
 * box both read "1. Install", as they did when the steps were Markdown.
 *
 * The heading is our own <h2>, with its own id for "On this page". A
 * Markdown "## Install" inside the step would be Storybook's heading,
 * whose text sits in a block-level wrapper beside a copy-link button: no
 * line to lay a number on.
 */
export function Steps({ children }: { children: ReactNode }) {
  let n = 0
  return (
    <div className="lcf-steps">
      {Children.map(children, c => (isValidElement<StepProps>(c) && c.type === Step ? cloneElement(c, { n: ++n }) : c))}
    </div>
  )
}

interface StepProps {
  title: string
  children: ReactNode
  /** Set by <Steps>. */
  n?: number
}

export function Step({ title, children, n }: StepProps) {
  return (
    <div className="lcf-step">
      {/* sb-unstyled on the heading alone: Storybook's raw-h2 rule stays
          off it, while the Markdown inside the body keeps its styles. */}
      <h2 className="sb-unstyled lcf-step-title" id={slug(title)}>
        {n !== undefined && (
          <span className="lcf-step-num">
            {n}
            <span className="lcf-step-dot">.</span>
          </span>
        )}
        {title}
      </h2>
      <div className="lcf-step-body">{children}</div>
    </div>
  )
}

/** An anchor for this page only — nothing else derives it. */
const slug = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
