const STORAGE_KEY = 'hoopfinder:device-id'

/**
 * A stable per-browser id. Not an account — it exists so a court's check-in log
 * can tell two people apart, and so ratings can be one-per-device.
 */
export function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) return existing

    const created = randomId()
    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    // Private mode / storage disabled. A per-session id still lets the check-in
    // go through, which matters more than remembering the device.
    return randomId()
  }
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}
