import { expect, test, type Page } from '@playwright/test'
import { listen, localeOf, signal, storyId } from './sweep'

/**
 * Textarea in a real engine, by keyboard alone — what jsdom cannot
 * show: the box growing a row at a time and stopping at maxRows, the
 * fallback giving the same heights as `field-sizing`, a width that
 * stays put while the text grows, the suggested value drawn grey and
 * italic until focus, and Field's confirm on Ctrl+Enter where Enter is a
 * new line. In all three passes, so the announcement is checked in
 * English and in German.
 */

const globalsOf = (info: { project: { metadata: unknown } }) => (info.project.metadata as { globals?: string }).globals ?? ''

async function open(page: Page, exportName: string, globals: string) {
  await page.goto(`/iframe.html?id=${storyId('Components/Textarea', exportName)}&viewMode=story&globals=${globals}`, { waitUntil: 'networkidle' })
  await page.locator('#storybook-root > *').first().waitFor()
  await page.waitForTimeout(150)
}

/** A token's colour as the browser computes it. */
const token = (page: Page, name: string) =>
  page.evaluate(n => {
    const s = document.createElement('span')
    s.style.color = `var(${n})`
    document.body.appendChild(s)
    const c = getComputedStyle(s).color
    s.remove()
    return c
  }, name)

/* The fallback, in Chromium: an unlayered sheet beats the layer's
   `field-sizing: content`, so the computed value is `fixed` — what an
   engine without the property reports as far as Textarea can tell. */
const withoutFieldSizing = (page: Page) =>
  page.addInitScript(() => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync('.lcf-textarea-el { field-sizing: fixed }')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  })

/* The box's height with 1 to 8 lines in it, typed by keyboard into the
   Grows story (rows 2, maxRows 6), then emptied line by line. */
async function heights(page: Page) {
  const box = page.locator('textarea')
  await page.keyboard.press('Tab')
  await expect(box).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
  const h = () => box.evaluate(e => e.getBoundingClientRect().height)
  const up: number[] = [await h()]
  for (let line = 2; line <= 8; line++) {
    await page.keyboard.press('Enter')
    await page.keyboard.type(`line ${line}`)
    up.push(await h())
  }
  const scrolls = await box.evaluate(e => e.scrollHeight > e.clientHeight)
  const down: number[] = []
  for (let line = 8; line >= 2; line--) {
    // "line N" and the break before it.
    for (let i = 0; i < 7; i++) await page.keyboard.press('Backspace')
    down.push(await h())
  }
  return { up, down, scrolls }
}

test('grows a row at a time from rows to maxRows, then scrolls, and shrinks back', async ({ page }, info) => {
  const said = listen(page)
  await open(page, 'Grows', globalsOf(info))
  const { up, down, scrolls } = await heights(page)
  // md: lines of 22px, 6px padding above and below, a 1px edge.
  expect(up).toEqual([58, 58, 80, 102, 124, 146, 146, 146])
  expect(scrolls).toBe(true)
  expect(down).toEqual([146, 146, 124, 102, 80, 58, 58])
  // The engine sizes it: nothing was written into its style.
  expect(await page.locator('textarea').evaluate(e => e.style.height)).toBe('')
  expect(signal(said), 'the console').toEqual([])
})

test('without field-sizing the fallback measures the same heights, to the pixel', async ({ page }, info) => {
  const said = listen(page)
  await withoutFieldSizing(page)
  await open(page, 'Grows', globalsOf(info))
  expect(await page.locator('textarea').evaluate(e => getComputedStyle(e).getPropertyValue('field-sizing'))).toBe('fixed')
  const { up, down, scrolls } = await heights(page)
  expect(up).toEqual([58, 58, 80, 102, 124, 146, 146, 146])
  expect(scrolls).toBe(true)
  expect(down).toEqual([146, 146, 124, 102, 80, 58, 58])
  // This time it was measured and written.
  expect(await page.locator('textarea').evaluate(e => e.style.height)).toBe('58px')
  expect(signal(said), 'the console').toEqual([])
})

test('the width is the layout\'s: the text never sizes it, and in a narrow column the Field and the box shrink to fit', async ({ page }, info) => {
  await open(page, 'Base', globalsOf(info))
  const box = page.locator('textarea')
  const width = () => box.evaluate(e => e.getBoundingClientRect().width)
  // 20rem, with the placeholder, with one word, with a paragraph.
  expect(await width()).toBe(320)
  await page.keyboard.press('Tab')
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Short.')
  expect(await width()).toBe(320)
  await page.keyboard.type(' Remove the old carpet and level the screed before the parquet goes down in the hall. The skirting is oak to match, and the thresholds are brushed steel on the whole ground floor.')
  expect(await width()).toBe(320)
  expect(await box.evaluate(e => e.getBoundingClientRect().height)).toBeGreaterThan(80)

  // Narrower than 20rem: no sideways scroll; the Field holds the box.
  await page.setViewportSize({ width: 300, height: 700 })
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  const [field, inner] = await page.evaluate(() => [
    document.querySelector('.lcf-field')!.getBoundingClientRect().width,
    document.querySelector('textarea')!.getBoundingClientRect().width
  ])
  expect(inner).toBeLessThan(320)
  expect(inner).toBe(field)
})

test('in a Field, by keyboard: suggested, Ctrl+Enter confirms, Enter is a new line, Escape goes back', async ({ page }, info) => {
  const said = listen(page)
  const globals = globalsOf(info)
  const de = localeOf(globals).startsWith('de')
  await open(page, 'InField', globals)
  const field = page.locator('.lcf-field')
  const box = page.locator('textarea')
  const suggestion = await box.inputValue()
  const style = () => box.evaluate(e => ({ color: getComputedStyle(e).color, italic: getComputedStyle(e).fontStyle }))

  // Suggested, and not focused: grey and italic, by the Field's contract.
  await expect(field).toHaveAttribute('data-state', 'suggested')
  expect(await style()).toEqual({ color: await token(page, '--fg-muted'), italic: 'italic' })
  // The field says which key confirms.
  await expect(box).toHaveAccessibleDescription(new RegExp(de ? 'Strg\\+Enter bestätigt\\.' : 'Ctrl\\+Enter confirms\\.'))

  // Tab in: about to be the person's own, so ordinary text.
  await page.keyboard.press('Tab')
  await expect(box).toBeFocused()
  expect(await style()).toEqual({ color: await token(page, '--fg'), italic: 'normal' })

  // Ctrl+Enter confirms, adds no line, and is said.
  await page.keyboard.press('Control+Enter')
  await expect(field).toHaveAttribute('data-state', 'confirmed')
  await expect(box).toHaveValue(suggestion)
  await expect(page.locator('[data-lcf-announcer]')).toHaveText(de ? 'Bestätigt.' : 'Confirmed.')

  // Typing overrides it; Enter is a new line and confirms nothing. (All,
  // then →: the caret at the end, the same keys on every platform.)
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await page.keyboard.type('Bring the long ladder.')
  await expect(box).toHaveValue(`${suggestion}\nBring the long ladder.`)
  await expect(field).not.toHaveAttribute('data-state')
  await expect(field.locator('[data-action="revert"]')).toBeVisible()

  // Escape: back to the suggestion, and focus stays in the box.
  await page.keyboard.press('Escape')
  await expect(box).toHaveValue(suggestion)
  await expect(field).toHaveAttribute('data-state', 'suggested')
  await expect(box).toBeFocused()

  // ⌘ Enter confirms too, on every platform.
  await page.keyboard.press('Meta+Enter')
  await expect(field).toHaveAttribute('data-state', 'confirmed')
  await expect(box).toHaveValue(suggestion)
  expect(signal(said), 'the console').toEqual([])
})

test('the count: what is left is said after a pause; past the limit the count turns danger and nothing stops the typing', async ({ page }, info) => {
  const globals = globalsOf(info)
  const de = localeOf(globals).startsWith('de')
  await open(page, 'CharacterLimit', globals)
  const box = page.locator('textarea').first()
  const count = page.locator('.lcf-textarea-count').first()
  await expect(count).toHaveText('35 / 120')
  await page.keyboard.press('Tab')
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.type(' Delivered on the 14th.')
  await expect(count).toHaveText('58 / 120')
  await expect(page.locator('[data-lcf-announcer]')).toHaveText(de ? 'Noch 62 Zeichen.' : '62 characters left.', { timeout: 3000 })

  // Past it: typed in full, the count danger, the field not invalid.
  await page.keyboard.type(' '.padEnd(70, 'x'))
  await expect(box).toHaveValue(/x{69}$/)
  await expect(count).toHaveText('128 / 120')
  await expect(count).toHaveCSS('color', await token(page, '--danger-text'))
  await expect(box).toHaveAttribute('aria-invalid', 'false')
  await expect(page.locator('[data-lcf-announcer]')).toHaveText(de ? '8 Zeichen zu viel.' : '8 characters too many.', { timeout: 3000 })
})

test('Required: the word and the caution edge come from :has(), and go when it is filled', async ({ page }, info) => {
  await open(page, 'Required', globalsOf(info))
  const box = page.locator('textarea')
  const word = page.locator('.lcf-field-req-word')
  await expect(box).toHaveCSS('border-top-color', await token(page, '--caution-border'))
  await expect(word).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.type('Long-standing customer.')
  await box.evaluate((e: HTMLTextAreaElement) => e.blur())
  await expect(word).toBeHidden()
  await expect(box).toHaveCSS('border-top-color', await token(page, '--border-field'))
})
