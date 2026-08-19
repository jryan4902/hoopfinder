import { describe, expect, it } from 'vitest'

import {
  ACTIVE_WINDOW_MS,
  QUIET_WINDOW_MS,
  deriveCourtState,
} from './courtState'
import type { CheckinSummary, RunType } from '../types/models'

const NOW = Date.parse('2026-08-17T19:00:00.000Z')

function checkin(
  agoMs: number,
  overrides: Partial<CheckinSummary> = {},
): CheckinSummary {
  return {
    created_at: new Date(NOW - agoMs).toISOString(),
    headcount: 8,
    run_type: 'full' satisfies RunType,
    ...overrides,
  }
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

describe('deriveCourtState', () => {
  it('returns none when a court has never had a check-in', () => {
    expect(deriveCourtState([], NOW)).toEqual({ status: 'none' })
  })

  it('is live within the 90 minute window, carrying headcount and run type', () => {
    const state = deriveCourtState(
      [checkin(10 * MINUTE, { headcount: 10, run_type: 'small' })],
      NOW,
    )

    expect(state).toMatchObject({
      status: 'live',
      headcount: 10,
      runType: 'small',
      ageMs: 10 * MINUTE,
    })
  })

  it('is live one millisecond before the window closes', () => {
    const state = deriveCourtState([checkin(ACTIVE_WINDOW_MS - 1)], NOW)
    expect(state.status).toBe('live')
  })

  it('ages out of live at exactly 90 minutes', () => {
    const state = deriveCourtState([checkin(ACTIVE_WINDOW_MS)], NOW)
    expect(state.status).toBe('quiet')
  })

  it('is quiet between 90 minutes and 24 hours', () => {
    expect(deriveCourtState([checkin(3 * HOUR)], NOW).status).toBe('quiet')
    expect(deriveCourtState([checkin(QUIET_WINDOW_MS - 1)], NOW).status).toBe(
      'quiet',
    )
  })

  it('goes cold at exactly 24 hours', () => {
    expect(deriveCourtState([checkin(QUIET_WINDOW_MS)], NOW).status).toBe('cold')
  })

  it('is cold for a check-in from last week', () => {
    const state = deriveCourtState([checkin(7 * 24 * HOUR)], NOW)
    expect(state.status).toBe('cold')
  })

  it('uses the most recent check-in regardless of array order', () => {
    const state = deriveCourtState(
      [
        checkin(5 * HOUR, { headcount: 2, run_type: 'shooting' }),
        checkin(5 * MINUTE, { headcount: 12, run_type: 'full' }),
        checkin(2 * HOUR, { headcount: 6, run_type: 'small' }),
      ],
      NOW,
    )

    expect(state).toMatchObject({
      status: 'live',
      headcount: 12,
      runType: 'full',
    })
  })

  it('does not expose headcount once a run has aged out', () => {
    const state = deriveCourtState([checkin(4 * HOUR)], NOW)

    expect(state.status).toBe('quiet')
    // The union guarantees this at the type level; assert it at runtime too.
    expect(state).not.toHaveProperty('headcount')
  })

  it('treats a future check-in as live with a clamped age', () => {
    const state = deriveCourtState([checkin(-5 * MINUTE)], NOW)

    expect(state).toMatchObject({ status: 'live', ageMs: 0 })
  })

  it('ignores rows with an unparseable timestamp', () => {
    const state = deriveCourtState(
      [
        { created_at: 'not a date', headcount: 4, run_type: 'small' },
        checkin(20 * MINUTE, { headcount: 6 }),
      ],
      NOW,
    )

    expect(state).toMatchObject({ status: 'live', headcount: 6 })
  })

  it('returns none when every row is unparseable', () => {
    const state = deriveCourtState(
      [{ created_at: '', headcount: 4, run_type: 'small' }],
      NOW,
    )

    expect(state).toEqual({ status: 'none' })
  })

  it('reports the same check-in differently as the clock advances', () => {
    const checkins = [checkin(0)]

    expect(deriveCourtState(checkins, NOW).status).toBe('live')
    expect(deriveCourtState(checkins, NOW + 89 * MINUTE).status).toBe('live')
    expect(deriveCourtState(checkins, NOW + 91 * MINUTE).status).toBe('quiet')
    expect(deriveCourtState(checkins, NOW + 25 * HOUR).status).toBe('cold')
  })
})
