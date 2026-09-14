/** Join conditional class names. */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

/** "2026-09-14T09:30:00Z" -> "14 Sep 2026, 09:30" (in the viewer's zone). */
export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** A `datetime-local` input needs "YYYY-MM-DDTHH:mm" in *local* time. */
export function toDateTimeLocal(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** Local `datetime-local` value -> ISO string the API expects. */
export function fromDateTimeLocal(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** "YYYY-MM-DD" for today, used to seed date filters. */
export function todayISODate() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatMoney(amount) {
  const value = Number(amount)
  if (Number.isNaN(value)) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Best-effort display name for a nested `user_detail` blob. */
export function personName(userDetail, fallback = 'Unnamed') {
  if (!userDetail) return fallback
  const full = [userDetail.first_name, userDetail.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()
  return full || userDetail.username || fallback
}

/** Initials for an avatar chip. */
export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}
