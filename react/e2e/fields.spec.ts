import { expect, test, type Page } from '@playwright/test'
import { paintSource, type Paint } from './audit'
import { listen, localeOf, signal, storyId } from './sweep'

/**
 * Field, Input and NumberField in a real engine, driven by the keyboard
 * alone — what jsdom cannot show: `:has()` deriving "required and empty"
 * from the control's own attribute, Tab order with ↺ before the control,
 * the selection a Tab leaves, the focus ring as painted, and forced
 * colours. In all three passes, so the announcement is checked in
 * English and in German.
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

test('Review, by keyboard: Enter confirms, typing overrides, ↺ goes back', async ({ page }, info) => {
  const said = listen(page)
  const globals = globalsOf(info)
  await open(page, 'Field/Review', globals)
  const url = page.url()
  const fields = page.locator('.lcf-field')
  const control = (i: number) => fields.nth(i).locator('.lcf-field-control input')

  // Tab into field 1: the whole value is selected, ready to be typed over.
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await control(0).getAttribute('id'))
  expect(await control(0).evaluate((e: HTMLInputElement) => e.selectionStart === 0 && e.selectionEnd === e.value.length && e.value.length > 0)).toBe(true)

  // Enter confirms — and does not submit or navigate.
  await page.keyboard.press('Enter')
  await expect(fields.nth(0)).toHaveAttribute('data-state', 'confirmed')
  expect(page.url()).toBe(url)
  const confirmed = localeOf(globals).startsWith('de') ? 'Bestätigt.' : 'Confirmed.'
  await expect(page.locator('[data-lcf-announcer]')).toHaveText(confirmed)

  // Field 2: type over it, Tab on. It reformats, its ↺ appears, and the
  // forward pass goes to field 3's control — never to ↺.
  await page.keyboard.press('Tab')
  expect(await active(page)).toBe(await control(1).getAttribute('id'))
  await page.keyboard.type('1200')
  await page.keyboard.press('Tab')
  await expect(control(1)).toHaveValue(localeOf(globals) === 'de-CH' ? "1'200" : '1,200')
  const revert = fields.nth(1).locator('[data-action="revert"]')
  await expect(revert).toBeVisible()
  expect(await active(page)).toBe(await control(2).getAttribute('id'))

  // Back twice: field 2's control, then its ↺. Enter restores the suggestion.
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(revert).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(fields.nth(1)).toHaveAttribute('data-state', 'suggested')
  expect(await active(page)).toBe(await control(1).getAttribute('id'))
  await expect(control(1)).toHaveValue('96')

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
  await expect(box).not.toHaveAttribute('aria-invalid')

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
  for (const story of ['Field/Base', 'Field/DescriptionAndError']) {
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

test('forced colours: an invalid field keeps its edge and its words', async ({ page }, info) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await open(page, 'Field/DescriptionAndError', globalsOf(info))
  const edge = await page.locator('.lcf-input').evaluate(e => {
    const cs = getComputedStyle(e)
    return { style: cs.borderTopStyle, width: parseFloat(cs.borderTopWidth), color: cs.borderTopColor }
  })
  expect(edge.style).not.toBe('none')
  expect(edge.width).toBeGreaterThanOrEqual(1)
  expect(edge.color).not.toBe('rgba(0, 0, 0, 0)')
  await expect(page.locator('.lcf-field-msg[data-color="danger"]')).toBeVisible()
  await expect(page.locator('.lcf-field-msg[data-color="danger"]')).toHaveText(/\S/)
})

test('Dense at 390: a form section never scrolls sideways', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 760 })
  await open(page, 'Field/Dense', globalsOf(info))
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
