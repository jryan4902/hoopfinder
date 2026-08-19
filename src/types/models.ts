// Every app-facing type is derived from the generated schema in ./database.ts.
// If a column changes, regenerate and the compiler points at what broke.

import type { Enums, Tables, TablesInsert } from './database'

export type Court = Tables<'courts'>
export type Checkin = Tables<'checkins'>
export type CheckinInsert = TablesInsert<'checkins'>
export type CourtRating = Tables<'court_ratings'>

export type RunType = Enums<'run_type'>
export type CourtKind = Enums<'court_kind'>

/**
 * The slice of a check-in that state derivation and rendering actually need.
 * Still anchored to the generated Row, so a column rename breaks the build.
 */
export type CheckinSummary = Pick<
  Checkin,
  'created_at' | 'headcount' | 'run_type'
>

export const RUN_TYPE_LABELS: Record<RunType, string> = {
  shooting: 'Shooting around',
  small: 'Small ball',
  full: 'Full court 5s',
}

/** Terser label for dense list rows. */
export const RUN_TYPE_SHORT: Record<RunType, string> = {
  shooting: 'Shooting',
  small: 'Small ball',
  full: 'Full court',
}
