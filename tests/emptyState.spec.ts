import { expect, test } from '@playwright/test'

import { LINCOLN, WOODLAWN, setupApp } from './support/fixtures'

test('a court with zero check-ins invites the first one', async ({ page }) => {
  await setupApp(page)

  await page.goto('/c/lincoln')

  await expect(page.getByRole('heading', { name: 'Lincoln Park' })).toBeVisible()
  await expect(page.getByText('No check-ins yet')).toBeVisible()
  await expect(page.getByText('Be the first to check in here')).toBeVisible()

  // An invitation, not an error state — the ask is still right there.
  await expect(
    page.getByRole('button', { name: 'Check in', exact: true }),
  ).toBeEnabled()

  // And the facts still render, so a first visitor learns something.
  await expect(page.getByText('Free lot')).toBeVisible()
})

test('an empty court can be checked into from cold', async ({ page }) => {
  const stub = await setupApp(page)

  await page.goto('/c/lincoln')
  await page.getByRole('button', { name: 'Check in', exact: true }).click()

  const sheet = page.getByRole('dialog')
  await sheet.getByRole('button', { name: 'Small ball' }).click()
  await sheet.getByRole('button', { name: '4', exact: true }).click()
  await sheet.getByRole('button', { name: 'Post check-in' }).click()

  await expect(page).toHaveURL('/')
  expect(stub.posted[0]).toMatchObject({
    court_id: 'lincoln',
    run_type: 'small',
    headcount: 4,
  })
})

test('Home shows every court, sorted by name without geolocation', async ({
  page,
}) => {
  await setupApp(page)

  await page.goto('/')

  const names = page.locator('.court-row__name')
  await expect(names).toHaveText([LINCOLN.name, WOODLAWN.name])

  // Woodlawn's live run surfaces its headcount right on the list row.
  const woodlawnRow = page.locator('.court-row', { hasText: WOODLAWN.name })
  await expect(woodlawnRow).toHaveAttribute('data-status', 'live')
  await expect(woodlawnRow.getByText('10', { exact: true })).toBeVisible()

  const lincolnRow = page.locator('.court-row', { hasText: LINCOLN.name })
  await expect(lincolnRow).toHaveAttribute('data-status', 'none')
  await expect(lincolnRow.getByText('Be the first')).toBeVisible()
})
