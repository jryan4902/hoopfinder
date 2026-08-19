import { useEffect, useState } from 'react'

import type { Coords } from '../lib/distance'

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'unavailable' }
  | { status: 'granted'; coords: Coords }
  | { status: 'denied' }

/**
 * Asks once, never blocks. The list renders by name immediately and re-sorts if
 * a fix comes back — nobody should stare at a spinner to find out if there's a
 * run going on.
 */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable' })
      return
    }

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return
        setState({
          status: 'granted',
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        })
      },
      () => {
        if (cancelled) return
        setState({ status: 'denied' })
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
