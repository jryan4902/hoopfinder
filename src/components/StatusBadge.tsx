import { STATUS_LABELS, type CourtStatus } from '../lib/courtState'

interface StatusBadgeProps {
  status: CourtStatus
  size?: 'sm' | 'lg'
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return (
    <span className="badge" data-status={status} data-size={size}>
      <span className="badge__dot" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}
