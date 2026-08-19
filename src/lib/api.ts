import { supabase } from './supabase'
import type { Checkin, CheckinInsert, Court, RunType } from '../types/models'

export async function fetchCourts(): Promise<Court[]> {
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function fetchCourt(courtId: string): Promise<Court | null> {
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .eq('id', courtId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function fetchRecentCheckins(
  courtId: string,
  limit: number,
): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('court_id', courtId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data
}

/**
 * Latest check-in per court, keyed by court id.
 *
 * One request per court. That is deliberate: a court's last check-in can be
 * arbitrarily old, so a single "recent check-ins" query would silently drop
 * quiet courts. At three courts this is three parallel requests. Past a couple
 * dozen it should become a view or an RPC.
 */
export async function fetchLatestCheckinByCourt(
  courtIds: readonly string[],
): Promise<Map<string, Checkin>> {
  const results = await Promise.all(
    courtIds.map(async (courtId) => {
      const rows = await fetchRecentCheckins(courtId, 1)
      return [courtId, rows[0]] as const
    }),
  )

  const latest = new Map<string, Checkin>()
  for (const [courtId, checkin] of results) {
    if (checkin) latest.set(courtId, checkin)
  }
  return latest
}

export interface SubmitCheckinInput {
  courtId: string
  deviceId: string
  runType: RunType
  headcount: number
}

export async function submitCheckin(input: SubmitCheckinInput): Promise<void> {
  const row: CheckinInsert = {
    court_id: input.courtId,
    device_id: input.deviceId,
    run_type: input.runType,
    headcount: input.headcount,
  }

  const { error } = await supabase.from('checkins').insert(row)
  if (error) throw new Error(error.message)
}
