import type { Page } from '@playwright/test'

import {
  makeCheckin,
  makeCourt,
  stubSupabase,
  type StubData,
  type SupabaseStub,
} from './supabaseStub'

/** Every test runs at this instant so relative timestamps are assertable. */
export const NOW = new Date('2026-08-17T19:00:00.000Z')

export function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString()
}

export const WOODLAWN = makeCourt({
  id: 'woodlawn',
  name: 'Woodlawn Lake Park',
  area: 'Near West Side',
  surface: 'Concrete, repainted 2024',
  nets: 'Chain nets, both hoops',
  hours: '6am - 11pm',
  parking: 'Free lot off W Mistletoe Ave',
})

export const LINCOLN = makeCourt({
  id: 'lincoln',
  name: 'Lincoln Park',
  area: 'East Side',
})

/** Woodlawn has a live run, Lincoln has never been checked into. */
export const DEFAULT_DATA: StubData = {
  courts: [WOODLAWN, LINCOLN],
  checkins: {
    woodlawn: [
      makeCheckin({
        id: '11111111-1111-4111-8111-111111111111',
        court_id: 'woodlawn',
        headcount: 10,
        run_type: 'full',
        created_at: minutesAgo(12),
      }),
    ],
    lincoln: [],
  },
}

/**
 * Freeze the clock, then serve the app from in-memory fixtures. Returns the
 * stub so a test can assert on what got POSTed.
 */
export async function setupApp(
  page: Page,
  data: StubData = DEFAULT_DATA,
): Promise<SupabaseStub> {
  await page.clock.install({ time: NOW })
  return stubSupabase(page, data)
}
