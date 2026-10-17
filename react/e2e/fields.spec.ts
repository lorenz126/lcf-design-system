import { expect, test, type Page } from '@playwright/test'
import { paintSource, type Paint } from './audit'
import { listen, localeOf, signal, storyId } from './sweep'

/**
 * Field, Input, NumberField and Select in a real engine, driven by the
 * keyboard alone — what jsdom cannot show: `:has()` deriving "required
 * and empty" from the control's own attribute, a Tab order with one stop
 * per field, the selection a Tab leaves, a select's typeahead, the
 * suggested grey italic as painted, the focus ring as painted, and
 * forced colours. In all three passes, so the announcement is checked
 * in English and in German.
 */

async function open(page: Page, exportName: string, globals: string) {
  await page.goto(`/iframe.html?id=${storyId('Components/' + exportName.split('/')[0], exportName.split('/')[1]!)}&viewMode=story&globals=${globals}`, { waitUntil: 'networkidle' })
  await page.locator('#storybook-root > *').first().waitFor()
  await page.waitForTimeout(150)
}

const globalsOf = (info: { project: { metadata: unknown } }) => (info.project.metadata as { globals?: string }).globals ?? ''

/** A token's colour as the browser computes it, for comparing with what a property computes to. */
const token = (page: Page, name: string) =>
  page.evaluate(n => {
    const s = document.createElement('span')
    s.style.color = `var(${n})`
    document.body.appendChild(s)
    const c = getComputedStyle(s).color
    s.remove()
    return c
  }, name)

const active = (page: Page) => page.evaluate(() => document.activeElement?.id ?? '')

test('Review, by keyboard: Enter confirms and never submits, typing overrides, Escape goes back', async ({ page }, info) => {
  const said = listen(page)
  const globals = globalsOf(info)
  await open(page, 'Field/Review', globals)
  const form = page.locator('form')
  const fields = page.locator('.lcf-field')
  const control = (i: number) => fields.nth(i).locator('.lcf-field-control input')
  // The story's form counts submits; Enter in a confirmable field must cause none.
  await expect(form).toHaveAttribute('data-submitted', '0')

  // Tab into field 1: the whole value is selected, ready to be typed over.
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await control(0).getAttribute('id'))
  expect(await control(0).evaluate((e: HTMLInputElement) => e.selectionStart === 0 && e.selectionEnd === e.value.length && e.value.length > 0)).toBe(true)

  // Enter confirms — and does not submit the form around it.
  await page.keyboard.press('Enter')
  await expect(fields.nth(0)).toHaveAttribute('data-state', 'confirmed')
  const confirmed = localeOf(globals).startsWith('de') ? 'Bestätigt.' : 'Confirmed.'
  await expect(page.locator('[data-lcf-announcer]')).toHaveText(confirmed)

  // Field 2: type over it, Tab on. It reformats, its ↺ appears, and the
  // forward pass goes to field 3's control.
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await control(1).getAttribute('id'))
  await page.keyboard.type('1200')
  await page.keyboard.press('Tab')
  await expect(control(1)).toHaveValue(localeOf(globals) === 'de-CH' ? "1'200" : '1,200')
  const revert = fields.nth(1).locator('[data-action="revert"]')
  await expect(revert).toBeVisible()
  expect(await active(page)).toBe(await control(2).getAttribute('id'))

  // Back once: field 2's control — ↺ is not a Tab stop. Escape restores
  // the suggestion, and focus stays.
  await page.keyboard.press('Shift+Tab')
  expect(await active(page)).toBe(await control(1).getAttribute('id'))
  await page.keyboard.press('Escape')
  await expect(fields.nth(1)).toHaveAttribute('data-state', 'suggested')
  expect(await active(page)).toBe(await control(1).getAttribute('id'))
  await expect(control(1)).toHaveValue('96')

  // Override field 3 and leave it waiting. From field 2, Enter then Tab
  // lands on field 3's control, so the next Enter confirms the override
  // rather than throwing it away (measured when ↺ was a Tab stop).
  await page.keyboard.press('Tab')
  await page.keyboard.type('90')
  await page.keyboard.press('Tab')
  await expect(fields.nth(2).locator('[data-action="revert"]')).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  expect(await active(page)).toBe(await control(1).getAttribute('id'))
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await control(2).getAttribute('id'))
  await page.keyboard.press('Enter')
  await expect(fields.nth(2)).toHaveAttribute('data-state', 'confirmed')
  await expect(control(2)).toHaveValue('90.00')

  await expect(form).toHaveAttribute('data-submitted', '0')
  expect(signal(said), 'the console').toEqual([])
})

/* A select is driven by typeahead here, not by the arrows: measured in
   Chromium on macOS, the arrows on a closed select open the platform's
   list (which a headless run does not draw) and change nothing, while a
   letter chooses the next option starting with it on every platform. */
test('Select in the Review recipe, by keyboard: Enter confirms, a letter overrides, Escape goes back, an empty required choice is refused', async ({ page }, info) => {
  const said = listen(page)
  const globals = globalsOf(info)
  const de = localeOf(globals).startsWith('de')
  await open(page, 'Select/Review', globals)
  const form = page.locator('form')
  const fields = page.locator('.lcf-field')
  const select = (i: number) => fields.nth(i).locator('select')
  const announcer = page.locator('[data-lcf-announcer]')
  await expect(form).toHaveAttribute('data-submitted', '0')

  // Suggested, as painted: grey and italic until the field has focus.
  const look = (i: number) => select(i).evaluate(e => ({ style: getComputedStyle(e).fontStyle, color: getComputedStyle(e).color }))
  expect(await look(0)).toEqual({ style: 'italic', color: await token(page, '--fg-muted') })

  // Tab lands on the select itself; focused, the suggestion is ordinary text.
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await select(0).getAttribute('id'))
  expect(await look(0)).toEqual({ style: 'normal', color: await token(page, '--fg') })

  // Enter confirms, and does not submit the form around it.
  await page.keyboard.press('Enter')
  await expect(fields.nth(0)).toHaveAttribute('data-state', 'confirmed')
  await expect(announcer).toHaveText(de ? 'Bestätigt.' : 'Confirmed.')

  // Product line: a letter chooses another line — the override. ↺
  // appears, and the forward pass still goes to the next select.
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await select(1).getAttribute('id'))
  await page.keyboard.press('w')
  await expect(select(1)).toHaveValue('panels')
  await expect(fields.nth(1)).not.toHaveAttribute('data-state')
  await expect(fields.nth(1).locator('[data-action="revert"]')).toBeVisible()
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await select(2).getAttribute('id'))

  // Back once — ↺ is not a Tab stop — and Escape restores the suggestion.
  await page.keyboard.press('Shift+Tab')
  expect(await active(page)).toBe(await select(1).getAttribute('id'))
  await page.keyboard.press('Escape')
  await expect(select(1)).toHaveValue('baffles')
  await expect(fields.nth(1)).toHaveAttribute('data-state', 'suggested')
  expect(await active(page)).toBe(await select(1).getAttribute('id'))
  await page.keyboard.press('Enter')
  await expect(fields.nth(1)).toHaveAttribute('data-state', 'confirmed')

  // Article: required and empty — the word and the caution edge, from
  // :has() on the select's own box. Enter is refused, in words.
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await select(3).getAttribute('id'))
  const word = fields.nth(3).locator('.lcf-field-req-word')
  await expect(word).toBeVisible()
  await expect(fields.nth(3).locator('.lcf-input')).toHaveCSS('border-top-color', await token(page, '--caution-border'))
  await page.keyboard.press('Enter')
  await expect(announcer).toHaveText(de ? 'Article: Pflichtfeld' : 'Article: Required')
  await expect(fields.nth(3)).not.toHaveAttribute('data-state')

  // A letter chooses the first gypsum board; the word goes; Enter confirms.
  await page.keyboard.press('g')
  await expect(select(3)).toHaveValue('A511')
  await expect(word).toBeHidden()
  await page.keyboard.press('Enter')
  await expect(fields.nth(3)).toHaveAttribute('data-state', 'confirmed')

  await expect(form).toHaveAttribute('data-submitted', '0')
  expect(signal(said), 'the console').toEqual([])
})

test('NumberField, by keyboard: arrows on the grid, unreadable text kept, Escape back', async ({ page }, info) => {
  const globals = globalsOf(info)
  const de = localeOf(globals).startsWith('de')
  await open(page, 'NumberField/Step', globals)
  const box = page.locator('.lcf-number input:not([type=hidden])')
  await page.keyboard.press('Tab')
  await expect(box).toBeFocused()
  // 84.33 is off a 0.05 grid, and says so at once.
  await expect(page.locator('.lcf-number .lcf-field-msg')).toBeVisible()
  await page.keyboard.press('ArrowUp')
  await expect(box).toHaveValue('84.35')
  await page.keyboard.press('Shift+ArrowUp')
  await expect(box).toHaveValue('84.85')
  await expect(page.locator('.lcf-number .lcf-field-msg')).toHaveCount(0)
  // The step is said with the unit's word, after the run of presses.
  await expect(page.locator('[data-lcf-announcer]')).toHaveText(de ? /84.85 Franken/ : /84.85 Swiss francs/)

  await page.keyboard.press('End')
  await page.keyboard.type('abc')
  await page.keyboard.press('Enter')
  await expect(box).toHaveValue('84.85abc')
  await expect(box).toHaveAttribute('aria-invalid', 'true')
  expect(await box.evaluate((e: HTMLInputElement) => e.validity.customError)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(box).toHaveValue('84.85')
  await expect(box).toHaveAttribute('aria-invalid', 'false')

  // The wheel changes nothing.
  await box.hover()
  await page.mouse.wheel(0, -200)
  await expect(box).toHaveValue('84.85')
})

test('Required: the word and the caution edge come from :has(), and go when it is filled', async ({ page }, info) => {
  await open(page, 'Field/Required', globalsOf(info))
  const frame = page.locator('.lcf-input')
  const word = page.locator('.lcf-field-req-word')
  const star = page.locator('.lcf-field-req')
  await expect(frame).toHaveCSS('border-top-color', await token(page, '--caution-border'))
  await expect(word).toBeVisible()
  await expect(star).toBeHidden()

  await page.keyboard.press('Tab')
  await page.keyboard.type('Anna')
  await page.locator('input').evaluate((e: HTMLInputElement) => e.blur())
  await expect(word).toBeHidden()
  await expect(star).toBeVisible()
  await expect(frame).toHaveCSS('border-top-color', await token(page, '--border-field'))
})

test('the focus ring: on the frame, 2px, 3:1 on its ground, the one ring colour on an invalid field too', async ({ page }, info) => {
  for (const story of ['Field/Base', 'Field/DescriptionAndError', 'Select/Base', 'Select/Invalid']) {
    await open(page, story, globalsOf(info))
    await page.keyboard.press('Tab')
    const ring = await page.locator('.lcf-input').first().evaluate((frame, paintSource) => {
      const { parse, ratio, ground } = new Function(`return (${paintSource})()`)() as Paint
      const cs = getComputedStyle(frame)
      const under = ground(frame.parentElement!)
      return { width: parseFloat(cs.outlineWidth), style: cs.outlineStyle, color: cs.outlineColor, ratio: under ? ratio(parse(cs.outlineColor)!, under) : 0 }
    }, paintSource)
    expect(ring.style, story).not.toBe('none')
    expect(ring.width, story).toBeGreaterThanOrEqual(2)
    expect(ring.ratio, story).toBeGreaterThanOrEqual(3)
    expect(ring.color, story).toBe(await token(page, '--focus-color'))
  }
})

test('forced colours: an invalid field keeps its edge, two pixels wide, and its words', async ({ page }, info) => {
  await page.emulateMedia({ forcedColors: 'active' })
  const edgeOf = async (story: string) => {
    await open(page, story, globalsOf(info))
    return page.locator('.lcf-input').evaluate(e => {
      const cs = getComputedStyle(e)
      return { style: cs.borderTopStyle, width: parseFloat(cs.borderTopWidth), color: cs.borderTopColor, shadow: cs.boxShadow }
    })
  }
  // Forced colours drop the inset shadow that doubles the danger edge,
  // so its width is the one cue left that is not a hue.
  const plain = await edgeOf('Field/Base')
  expect(plain.width).toBe(1)
  const edge = await edgeOf('Field/DescriptionAndError')
  expect(edge.shadow).toBe('none')
  expect(edge.style).not.toBe('none')
  expect(edge.width).toBeGreaterThanOrEqual(2)
  expect(edge.color).not.toBe('rgba(0, 0, 0, 0)')
  await expect(page.locator('.lcf-field-msg[data-color="danger"]')).toBeVisible()
  await expect(page.locator('.lcf-field-msg[data-color="danger"]')).toHaveText(/\S/)
  // A Select is drawn in the same frame, and keeps the same edge.
  const select = await edgeOf('Select/Invalid')
  expect(select.style).not.toBe('none')
  expect(select.width).toBeGreaterThanOrEqual(2)
})

test('Hidden label: required and empty is said by the word, not by the edge alone', async ({ page }, info) => {
  await open(page, 'Field/HiddenLabel', globalsOf(info))
  const field = page.locator('.lcf-field[data-required]')
  const word = field.locator('.lcf-field-req-word')
  await expect(word).toBeVisible()
  await expect(field.locator('label')).toHaveClass(/lcf-sr-only/)
  await field.locator('input').fill('Anna')
  await field.locator('input').evaluate((e: HTMLInputElement) => e.blur())
  await expect(word).toBeHidden()
})

test('Dense at 390: a form section never scrolls sideways', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 760 })
  await open(page, 'Field/Dense', globalsOf(info))
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
