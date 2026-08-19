import type { Court } from '../types/models'

/**
 * A URL that hands off to whatever maps app the phone actually uses. Apple
 * devices open Apple Maps from a maps.apple.com link; everything else gets the
 * Google Maps universal link, which opens the app when it is installed.
 */
export function directionsUrl(court: Court): string {
  const destination = `${court.lat},${court.lng}`
  const label = encodeURIComponent(court.name)

  if (isAppleDevice()) {
    return `https://maps.apple.com/?daddr=${destination}&q=${label}&dirflg=d`
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}

function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
}
