import { useEffect, useState } from 'react'

/**
 * A clock that ticks, so a page left open on a bench stops claiming a run is
 * live once the 90 minute window closes.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
