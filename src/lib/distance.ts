export interface Coords {
  lat: number
  lng: number
}

const EARTH_RADIUS_MILES = 3958.8

/** Great-circle distance in miles. Good enough for "which court is closer". */
export function distanceInMiles(from: Coords, to: Coords): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2

  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function formatMiles(miles: number): string {
  if (miles < 0.1) return '< 0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}
