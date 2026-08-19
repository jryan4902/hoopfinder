import { expect, test } from '@playwright/test'

import { setupApp } from './support/fixtures'

test('check-in happy path: three taps from the court page to Home', async ({
  page,
}) => {
  const stub = await setupApp(page)

  await page.goto('/c/woodlawn')
  await expect(
    page.getByRole('heading', { name: 'Woodlawn Lake Park' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Check in', exact: true }).click()

  const sheet = page.getByRole('dialog', { name: /Check in at Woodlawn/ })
  await expect(sheet).toBeVisible()

  await sheet.getByRole('button', { name: 'Full court 5s' }).click()
  await sheet.getByRole('button', { name: '8', exact: true }).click()
  await sheet.getByRole('button', { name: 'Post check-in' }).click()

  // The payoff for checking in is seeing every other court.
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('status')).toContainText(
    'Checked in at Woodlawn Lake Park',
  )
  await expect(page.getByText('Lincoln Park')).toBeVisible()

  expect(stub.posted).toHaveLength(1)
  expect(stub.posted[0]).toMatchObject({
    court_id: 'woodlawn',
    run_type: 'full',
    headcount: 8,
  })
  expect(stub.posted[0]?.device_id).toBeTruthy()
})

test('12+ posts as a headcount of 12', async ({ page }) => {
  const stub = await setupApp(page)

  await page.goto('/c/woodlawn')
  await page.getByRole('button', { name: 'Check in', exact: true }).click()

  const sheet = page.getByRole('dialog')
  await sheet.getByRole('button', { name: 'Shooting around' }).click()
  await sheet.getByRole('button', { name: '12+' }).click()
  await sheet.getByRole('button', { name: 'Post check-in' }).click()

  await expect(page).toHaveURL('/')
  expect(stub.posted[0]).toMatchObject({ headcount: 12, run_type: 'shooting' })
})

test('submit stays disabled until both questions are answered', async ({
  page,
}) => {
  await setupApp(page)

  await page.goto('/c/woodlawn')
  await page.getByRole('button', { name: 'Check in', exact: true }).click()

  const sheet = page.getByRole('dialog')
  const submit = sheet.getByRole('button', { name: 'Post check-in' })

  await expect(submit).toBeDisabled()

  await sheet.getByRole('button', { name: 'Small ball' }).click()
  await expect(submit).toBeDisabled()

  await sheet.getByRole('button', { name: '6', exact: true }).click()
  await expect(submit).toBeEnabled()
})

test('submit stays disabled when only the headcount is answered', async ({
  page,
}) => {
  await setupApp(page)

  await page.goto('/c/woodlawn')
  await page.getByRole('button', { name: 'Check in', exact: true }).click()

  const sheet = page.getByRole('dialog')
  const submit = sheet.getByRole('button', { name: 'Post check-in' })

  await sheet.getByRole('button', { name: '4', exact: true }).click()
  await expect(submit).toBeDisabled()

  await sheet.getByRole('button', { name: 'Full court 5s' }).click()
  await expect(submit).toBeEnabled()
})

test('the court page shows recent check-ins before it asks for one', async ({
  page,
}) => {
  await setupApp(page)

  await page.goto('/c/woodlawn')

  const checkinsHeading = page.getByRole('heading', {
    name: 'Recent check-ins',
  })
  const checkInButton = page.getByRole('button', {
    name: 'Check in',
    exact: true,
  })

  await expect(checkinsHeading).toBeVisible()
  await expect(page.locator('.checkin__age')).toHaveText(['12m ago'])

  const headingBox = await checkinsHeading.boundingBox()
  const buttonBox = await checkInButton.boundingBox()
  expect(headingBox?.y ?? 0).toBeLessThan(buttonBox?.y ?? Infinity)
})
