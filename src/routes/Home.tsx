import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { StatusBadge } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import { useGeolocation } from '../hooks/useGeolocation'
import { useNow } from '../hooks/useNow'
import { fetchCourts, fetchLatestCheckinByCourt } from '../lib/api'
import { deriveCourtState, type CourtState } from '../lib/courtState'
import { distanceInMiles, formatMiles } from '../lib/distance'
import { timeAgo } from '../lib/time'
import { RUN_TYPE_SHORT, type Checkin, type Court } from '../types/models'

interface HomeData {
  courts: Court[]
  latest: Map<string, Checkin>
}

export function Home() {
  const [data, setData] = useState<HomeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const now = useNow()
  const geo = useGeolocation()

  const location = useLocation()
  const navigate = useNavigate()
  const toast = readToast(location.state)

  const dismissToast = useCallback(() => {
    navigate('.', { replace: true, state: null })
  }, [navigate])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const courts = await fetchCourts()
        const latest = await fetchLatestCheckinByCourt(courts.map((c) => c.id))
        if (!cancelled) setData({ courts, latest })
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Something broke.')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(() => {
    if (data === null) return []

    const coords = geo.status === 'granted' ? geo.coords : null

    const built = data.courts.map((court) => {
      const latest = data.latest.get(court.id)
      return {
        court,
        state: deriveCourtState(latest ? [latest] : [], now),
        miles: coords === null ? null : distanceInMiles(coords, court),
      }
    })

    // Distance when we have a fix, name otherwise. Live courts are not floated
    // to the top on purpose: "which court is closest" is the question people
    // open this with, and reordering under them would be disorienting.
    built.sort((a, b) => {
      if (a.miles !== null && b.miles !== null) return a.miles - b.miles
      return a.court.name.localeCompare(b.court.name)
    })

    return built
  }, [data, geo, now])

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="wordmark">
          Hoop<span>Finder</span>
        </h1>
        <p className="page__sub">Who&apos;s hooping in San Antonio right now</p>
      </header>

      {error !== null && (
        <p className="notice notice--error" role="alert">
          Couldn&apos;t load courts. {error}
        </p>
      )}

      {data === null && error === null && (
        <p className="notice">Loading courts…</p>
      )}

      {data !== null && (
        <ul className="court-list">
          {rows.map(({ court, state, miles }) => (
            <li key={court.id}>
              <CourtRow court={court} state={state} miles={miles} now={now} />
            </li>
          ))}
        </ul>
      )}

      {geo.status === 'denied' && data !== null && (
        <p className="page__foot">
          Turn on location to sort these by how close they are.
        </p>
      )}

      {toast !== null && <Toast message={toast} onDismiss={dismissToast} />}
    </div>
  )
}

interface CourtRowProps {
  court: Court
  state: CourtState
  miles: number | null
  now: number
}

function CourtRow({ court, state, miles, now }: CourtRowProps) {
  return (
    <Link className="court-row" to={`/c/${court.id}`} data-status={state.status}>
      <div className="court-row__count">
        {state.status === 'live' ? (
          <span className="count count--row">
            {state.headcount === 12 ? '12+' : state.headcount}
          </span>
        ) : (
          <span className="count count--row count--empty" aria-hidden="true">
            –
          </span>
        )}
      </div>

      <div className="court-row__body">
        <p className="court-row__name">{court.name}</p>
        <p className="court-row__meta">
          {court.area}
          {miles !== null && <> · {formatMiles(miles)}</>}
        </p>
        <p className="court-row__state">
          <StatusBadge status={state.status} />
          {state.status === 'live' && (
            <span className="court-row__detail">
              {RUN_TYPE_SHORT[state.runType]} · {timeAgo(state.lastCheckinAt, now)}
            </span>
          )}
          {(state.status === 'quiet' || state.status === 'cold') && (
            <span className="court-row__detail">
              last check-in {timeAgo(state.lastCheckinAt, now)}
            </span>
          )}
          {state.status === 'none' && (
            <span className="court-row__detail">Be the first</span>
          )}
        </p>
      </div>
    </Link>
  )
}

function readToast(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null
  const toast = (state as { toast?: unknown }).toast
  return typeof toast === 'string' ? toast : null
}
