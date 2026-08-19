import type { CheckinSummary, RunType } from '../types/models'

/** A check-in counts as an active run for 90 minutes. */
export const ACTIVE_WINDOW_MS = 90 * 60 * 1000

/** After a day with no check-ins a court goes cold. */
export const QUIET_WINDOW_MS = 24 * 60 * 60 * 1000

export type CourtStatus = 'live' | 'quiet' | 'cold' | 'none'

/**
 * Discriminated union: `headcount` and `runType` only exist on `live`, so the
 * rest of the app cannot render a stale headcount by accident.
 */
export type CourtState =
  | {
      status: 'live'
      headcount: number
      runType: RunType
      lastCheckinAt: string
      ageMs: number
    }
  | { status: 'quiet'; lastCheckinAt: string; ageMs: number }
  | { status: 'cold'; lastCheckinAt: string; ageMs: number }
  | { status: 'none' }

/**
 * Derive a court's live state from its check-ins.
 *
 * Pure: no clock reads, no I/O. `now` is injected so the UI can re-derive on a
 * timer and the tests can move time around.
 *
 * Check-ins may arrive in any order; only the most recent one matters. Rows
 * with an unparseable `created_at` are ignored rather than throwing — a bad row
 * should not take down the court page.
 */
export function deriveCourtState(
  checkins: readonly CheckinSummary[],
  now: number = Date.now(),
): CourtState {
  const latest = mostRecent(checkins)
  if (latest === null) return { status: 'none' }

  const lastCheckinAt = latest.checkin.created_at
  // Clock skew (or a check-in written a moment in the future) clamps to 0
  // rather than reading as a negative age.
  const ageMs = Math.max(0, now - latest.timestamp)

  if (ageMs < ACTIVE_WINDOW_MS) {
    return {
      status: 'live',
      headcount: latest.checkin.headcount,
      runType: latest.checkin.run_type,
      lastCheckinAt,
      ageMs,
    }
  }

  if (ageMs < QUIET_WINDOW_MS) {
    return { status: 'quiet', lastCheckinAt, ageMs }
  }

  return { status: 'cold', lastCheckinAt, ageMs }
}

function mostRecent(
  checkins: readonly CheckinSummary[],
): { checkin: CheckinSummary; timestamp: number } | null {
  let best: { checkin: CheckinSummary; timestamp: number } | null = null

  for (const checkin of checkins) {
    const timestamp = Date.parse(checkin.created_at)
    if (Number.isNaN(timestamp)) continue
    if (best === null || timestamp > best.timestamp) {
      best = { checkin, timestamp }
    }
  }

  return best
}

export const STATUS_LABELS: Record<CourtStatus, string> = {
  live: 'Run going on',
  quiet: 'Quiet',
  cold: 'No recent runs',
  none: 'No check-ins yet',
}
