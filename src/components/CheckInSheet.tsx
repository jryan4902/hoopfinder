import { useEffect, useState } from 'react'

import { RUN_TYPE_LABELS, type RunType } from '../types/models'

const RUN_TYPES: RunType[] = ['shooting', 'small', 'full']
const HEADCOUNTS = [2, 4, 6, 8, 10, 12] as const

/** 12 is stored as 12 and means "12 or more". */
function headcountLabel(value: number): string {
  return value === 12 ? '12+' : String(value)
}

interface CheckInSheetProps {
  courtName: string
  submitting: boolean
  error: string | null
  onSubmit: (runType: RunType, headcount: number) => void
  onClose: () => void
}

export function CheckInSheet({
  courtName,
  submitting,
  error,
  onSubmit,
  onClose,
}: CheckInSheetProps) {
  const [runType, setRunType] = useState<RunType | null>(null)
  const [headcount, setHeadcount] = useState<number | null>(null)

  const ready = runType !== null && headcount !== null

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="sheet-layer">
      <button
        type="button"
        className="sheet-scrim"
        aria-label="Cancel check-in"
        onClick={onClose}
      />

      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Check in at ${courtName}`}
      >
        <div className="sheet__grabber" aria-hidden="true" />

        <fieldset className="sheet__group">
          <legend className="sheet__legend">What&apos;s the run?</legend>
          <div className="choice-row">
            {RUN_TYPES.map((value) => (
              <button
                key={value}
                type="button"
                className="choice"
                aria-pressed={runType === value}
                onClick={() => setRunType(value)}
              >
                {RUN_TYPE_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="sheet__group">
          <legend className="sheet__legend">How many people?</legend>
          <div className="choice-grid">
            {HEADCOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                className="choice choice--count"
                aria-pressed={headcount === value}
                onClick={() => setHeadcount(value)}
              >
                {headcountLabel(value)}
              </button>
            ))}
          </div>
        </fieldset>

        {error !== null && (
          <p className="sheet__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn--primary btn--block"
          disabled={!ready || submitting}
          onClick={() => {
            if (runType !== null && headcount !== null) {
              onSubmit(runType, headcount)
            }
          }}
        >
          {submitting ? 'Posting…' : 'Post check-in'}
        </button>

        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
