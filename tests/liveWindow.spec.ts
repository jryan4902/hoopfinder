import { expect, test } from '@playwright/test'

import { LINCOLN, minutesAgo, setupApp } from './support/fixtures'
import { makeCheckin, makeCourt, type StubData } from './support/supabaseStub'

const ONE_MINUTE_MS = 60_000

const FRESH_RUN: StubData = {
  courts: [
    makeCourt({
      id: 'woodlawn',
      name: 'Woodlawn Lake Park',
      area: 'Near West Side',
    }),
    LINCOLN,
  ],
  checkins: {
    woodlawn: [
      makeCheckin({
        id: '22222222-2222-4222-8222-222222222222',
        court_id: 'woodlawn',
        headcount: 10,
        run_type: 'full',
        created_at: minutesAgo(1),
      }),
    ],
    lincoln: [],
  },
}

test('an active check-in ages out of live after 90 minutes', async ({
  page,
}) => {
  await setupApp(page, FRESH_RUN)

  await page.goto('/c/woodlawn')

  // A minute old: live, with the headcount as the loudest thing on screen.
  await expect(page.getByText('Run going on')).toBeVisible()
  await expect(page.locator('.count--hero')).toHaveText('10')
  await expect(page.getByText('Full court 5s').first()).toBeVisible()

  // Still live at 89 minutes.
  await page.clock.fastForward(88 * ONE_MINUTE_MS)
  await expect(page.getByText('Run going on')).toBeVisible()

  // Past 90, the run is over — no stale headcount left on screen.
  await page.clock.fastForward(3 * ONE_MINUTE_MS)
  await expect(page.getByText('Run going on')).toHaveCount(0)
  await expect(page.getByText('Quiet')).toBeVisible()
  await expect(page.locator('.count--hero')).toHaveCount(0)

  // The raw log still shows the check-in that happened — it just isn't "now".
  await expect(page.locator('.checkin')).toHaveCount(1)
  await expect(page.locator('.checkin__age')).toHaveText(['1h ago'])
})

test('Home stops advertising a run once it ages out', async ({ page }) => {
  await setupApp(page, FRESH_RUN)

  await page.goto('/')

  const woodlawnRow = page.locator('.court-row', { hasText: 'Woodlawn' })
  await expect(woodlawnRow).toHaveAttribute('data-status', 'live')

  await page.clock.fastForward(91 * ONE_MINUTE_MS)

  await expect(woodlawnRow).toHaveAttribute('data-status', 'quiet')
  await expect(woodlawnRow.getByText('last check-in 1h ago')).toBeVisible()
})

test('a run from yesterday reads as cold, not quiet', async ({ page }) => {
  await setupApp(page, {
    courts: [makeCourt({ id: 'woodlawn', name: 'Woodlawn Lake Park' })],
    checkins: {
      woodlawn: [
        makeCheckin({
          id: '33333333-3333-4333-8333-333333333333',
          court_id: 'woodlawn',
          created_at: minutesAgo(26 * 60),
        }),
      ],
    },
  })

  await page.goto('/c/woodlawn')

  await expect(page.getByText('No recent runs')).toBeVisible()
  await expect(page.locator('.count--hero')).toHaveCount(0)
})
