import type { Page, Route } from '@playwright/test'

import type { Checkin, Court, RunType } from '../../src/types/models'

/** Matches VITE_SUPABASE_URL in .env.test. */
const REST_PREFIX = '/supabase-stub/rest/v1/'

export interface PostedCheckin {
  court_id: string
  device_id: string
  run_type: RunType
  headcount: number
}

export interface StubData {
  courts: Court[]
  /** Newest first, the same order the real query returns. */
  checkins: Record<string, Checkin[]>
}

export interface SupabaseStub {
  /** Check-in rows the app POSTed during the test. */
  posted: PostedCheckin[]
}

/**
 * Serves the three REST reads and the one write the app makes, straight from
 * in-memory fixtures. Everything is typed against the generated schema, so a
 * column change breaks these fixtures at compile time too.
 */
export async function stubSupabase(
  page: Page,
  data: StubData,
): Promise<SupabaseStub> {
  const stub: SupabaseStub = { posted: [] }

  await page.route(`**${REST_PREFIX}**`, async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.slice(
      url.pathname.indexOf(REST_PREFIX) + REST_PREFIX.length,
    )

    if (request.method() === 'POST' && table === 'checkins') {
      const body: unknown = request.postDataJSON()
      const rows = Array.isArray(body) ? body : [body]
      for (const row of rows) stub.posted.push(row as PostedCheckin)
      return json(route, [], 201)
    }

    if (request.method() !== 'GET') {
      return json(route, { message: `unexpected ${request.method()}` }, 400)
    }

    if (table === 'courts') {
      const idFilter = eqValue(url.searchParams.get('id'))
      const rows =
        idFilter === null
          ? [...data.courts].sort((a, b) => a.name.localeCompare(b.name))
          : data.courts.filter((court) => court.id === idFilter)
      return json(route, rows, 200)
    }

    if (table === 'checkins') {
      const courtId = eqValue(url.searchParams.get('court_id'))
      const rows = courtId === null ? [] : (data.checkins[courtId] ?? [])
      const limit = Number(url.searchParams.get('limit') ?? rows.length)
      return json(route, rows.slice(0, limit), 200)
    }

    return json(route, { message: `unstubbed table ${table}` }, 404)
  })

  return stub
}

/** PostgREST filters arrive as `eq.woodlawn`. */
function eqValue(param: string | null): string | null {
  if (param === null) return null
  return param.startsWith('eq.') ? param.slice(3) : param
}

function json(route: Route, body: unknown, status: number) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

// --------------------------------------------------------------- fixtures ---

export function makeCourt(overrides: Partial<Court> & { id: string }): Court {
  return {
    name: 'Test Court',
    area: 'Test Area',
    kind: 'outdoor',
    full_courts: 2,
    lights: true,
    nets: 'Chain nets',
    surface: 'Concrete',
    cost: 'Free',
    hours: '6am - 11pm',
    parking: 'Free lot',
    lat: 29.4602,
    lng: -98.5305,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeCheckin(
  overrides: Partial<Checkin> & { id: string; court_id: string },
): Checkin {
  return {
    device_id: 'someone-else',
    run_type: 'full',
    headcount: 10,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
