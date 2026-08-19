import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { CheckInSheet } from '../components/CheckInSheet'
import { StatusBadge } from '../components/StatusBadge'
import { useNow } from '../hooks/useNow'
import { fetchCourt, fetchRecentCheckins, submitCheckin } from '../lib/api'
import { deriveCourtState } from '../lib/courtState'
import { getDeviceId } from '../lib/device'
import { directionsUrl } from '../lib/directions'
import { timeAgo } from '../lib/time'
import {
  RUN_TYPE_LABELS,
  type Checkin,
  type Court as CourtRow,
  type RunType,
} from '../types/models'

const RECENT_LIMIT = 10

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; court: CourtRow; checkins: Checkin[] }

export function Court() {
  const { courtId } = useParams<{ courtId: string }>()
  const navigate = useNavigate()
  const now = useNow()

  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const id = courtId
    if (id === undefined) return
    let cancelled = false

    const load = async () => {
      try {
        const court = await fetchCourt(id)
        if (cancelled) return
        if (court === null) {
          setLoad({ status: 'missing' })
          return
        }

        const checkins = await fetchRecentCheckins(id, RECENT_LIMIT)
        if (!cancelled) setLoad({ status: 'ready', court, checkins })
      } catch (cause) {
        if (!cancelled) {
          setLoad({
            status: 'error',
            message: cause instanceof Error ? cause.message : 'Unknown error',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [courtId])

  if (load.status === 'loading') {
    return <p className="notice">Loading…</p>
  }

  if (load.status === 'missing') {
    return (
      <div className="page">
        <p className="notice">
          That court isn&apos;t on HoopFinder yet.{' '}
          <Link to="/">See the ones that are.</Link>
        </p>
      </div>
    )
  }

  if (load.status === 'error') {
    return (
      <div className="page">
        <p className="notice notice--error" role="alert">
          Couldn&apos;t load this court. {load.message}
        </p>
      </div>
    )
  }

  const { court, checkins } = load
  const state = deriveCourtState(checkins, now)

  async function handleSubmit(runType: RunType, headcount: number) {
    setSubmitting(true)
    setSubmitError(null)

    try {
      await submitCheckin({
        courtId: court.id,
        deviceId: getDeviceId(),
        runType,
        headcount,
      })

      // The payoff for checking in is seeing everywhere else.
      navigate('/', {
        state: { toast: `Checked in at ${court.name}. Here's the rest.` },
      })
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? `Couldn't post that. ${cause.message}`
          : "Couldn't post that.",
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <p className="crumb">
        <Link to="/">← All courts</Link>
      </p>

      {/* 1. Name + live state */}
      <header className="court-head" data-status={state.status}>
        <h1 className="court-head__name">{court.name}</h1>
        <p className="court-head__area">
          {court.area} · {court.kind === 'indoor' ? 'Indoor' : 'Outdoor'}
        </p>

        <div className="court-head__state">
          <StatusBadge status={state.status} size="lg" />

          {state.status === 'live' && (
            <div className="hero">
              <span className="count count--hero">
                {state.headcount === 12 ? '12+' : state.headcount}
              </span>
              <span className="hero__label">
                people · {RUN_TYPE_LABELS[state.runType]}
              </span>
              <span className="hero__age">
                reported {timeAgo(state.lastCheckinAt, now)}
              </span>
            </div>
          )}

          {(state.status === 'quiet' || state.status === 'cold') && (
            <p className="court-head__last">
              Last check-in {timeAgo(state.lastCheckinAt, now)}
            </p>
          )}
        </div>
      </header>

      {/* 2. Recent check-ins — proof the app is real, before we ask for anything */}
      <section className="section">
        <h2 className="section__title">Recent check-ins</h2>

        {checkins.length === 0 ? (
          <p className="empty">
            Be the first to check in here — two taps, and anyone looking for a
            run tonight will see it.
          </p>
        ) : (
          <ul className="checkin-list">
            {checkins.map((checkin) => (
              <li key={checkin.id} className="checkin">
                <span className="checkin__count">
                  {checkin.headcount === 12 ? '12+' : checkin.headcount}
                </span>
                <span className="checkin__run">
                  {RUN_TYPE_LABELS[checkin.run_type]}
                </span>
                <span className="checkin__age">
                  {timeAgo(checkin.created_at, now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. The ask */}
      <button
        type="button"
        className="btn btn--primary btn--block btn--tall"
        onClick={() => {
          setSubmitError(null)
          setSheetOpen(true)
        }}
      >
        Check in
      </button>

      {/* 4. Facts */}
      <section className="section">
        <h2 className="section__title">The court</h2>
        <dl className="facts">
          <Fact label="Surface" value={court.surface} />
          <Fact
            label="Hoops"
            value={`${court.full_courts} full court${court.full_courts === 1 ? '' : 's'}`}
          />
          <Fact label="Nets" value={court.nets} />
          <Fact label="Lights" value={court.lights ? 'Yes' : 'No'} />
          <Fact label="Hours" value={court.hours} />
          <Fact label="Cost" value={court.cost} />
          <Fact label="Parking" value={court.parking} />
        </dl>
      </section>

      {/* 5. Directions */}
      <a
        className="btn btn--secondary btn--block"
        href={directionsUrl(court)}
        target="_blank"
        rel="noreferrer"
      >
        Directions
      </a>

      {sheetOpen && (
        <CheckInSheet
          courtName={court.name}
          submitting={submitting}
          error={submitError}
          onSubmit={(runType, headcount) => {
            void handleSubmit(runType, headcount)
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <dt className="fact__label">{label}</dt>
      <dd className="fact__value">{value}</dd>
    </div>
  )
}
