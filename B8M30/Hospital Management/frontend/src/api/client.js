/**
 * Thin `fetch` wrapper around the Django REST API.
 *
 * Responsibilities, in one place so no page has to think about them:
 *   - prefix every path with the API base URL
 *   - attach the JWT access token
 *   - refresh the access token once on a 401 and replay the request
 *   - turn DRF error payloads into something a form can render
 */

const BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/$/, '')

const STORAGE_KEY = 'medicore.auth'

/* -------------------------------------------------------------- *
 * Token storage
 * -------------------------------------------------------------- */

export const tokenStore = {
  read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      // Private mode / cleared storage — behave as signed out.
      return null
    }
  },
  write(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      /* non-fatal: the session just won't survive a reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  },
}

/** Fired when the refresh token is dead and the user must sign in again. */
export const AUTH_EXPIRED_EVENT = 'medicore:auth-expired'

function broadcastExpiry() {
  tokenStore.clear()
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
}

/* -------------------------------------------------------------- *
 * Errors
 * -------------------------------------------------------------- */

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, payload = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.payload = payload
  }
}

const FRIENDLY_STATUS = {
  400: 'Please check the highlighted fields and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: 'We couldn’t find what you were looking for.',
  500: 'The server ran into a problem. Please try again.',
}

function flatten(value) {
  if (Array.isArray(value)) return value.map(flatten).join(' ')
  if (value && typeof value === 'object') {
    return Object.values(value).map(flatten).join(' ')
  }
  return String(value ?? '')
}

/** Turn a DRF error body into `{ message, fieldErrors }`. */
function parseError(status, payload) {
  const fieldErrors = {}
  let message = ''

  if (typeof payload === 'string' && payload.trim()) {
    message = payload
  } else if (payload && typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload)) {
      const text = flatten(value)
      if (key === 'detail' || key === 'non_field_errors') {
        message ||= text
      } else {
        fieldErrors[key] = text
      }
    }
    if (!message) {
      const first = Object.entries(fieldErrors)[0]
      if (first) message = `${first[0].replace(/_/g, ' ')}: ${first[1]}`
    }
  }

  return {
    message: message || FRIENDLY_STATUS[status] || `Request failed (${status}).`,
    fieldErrors,
  }
}

/* -------------------------------------------------------------- *
 * Refresh — de-duplicated so a burst of 401s triggers one call
 * -------------------------------------------------------------- */

let refreshInFlight = null

async function refreshAccessToken() {
  const auth = tokenStore.read()
  if (!auth?.refresh) return null

  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: auth.refresh }),
      })
      if (!res.ok) {
        broadcastExpiry()
        return null
      }
      const data = await res.json()
      const next = {
        ...tokenStore.read(),
        access: data.access,
        // ROTATE_REFRESH_TOKENS is on, so a new refresh may come back.
        refresh: data.refresh || auth.refresh,
      }
      tokenStore.write(next)
      return next.access
    } catch {
      broadcastExpiry()
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

/* -------------------------------------------------------------- *
 * Request
 * -------------------------------------------------------------- */

function buildUrl(path, params) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return url
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.append(key, value)
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

async function readBody(res) {
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request(
  path,
  { method = 'GET', body, params, signal, auth = true, _retried = false } = {},
) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = tokenStore.read()?.access
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    // A network-level failure and a CORS rejection are indistinguishable
    // here — the browser hides the difference — so name both causes and
    // the URL, otherwise this reads as "the server is down" when the
    // server is fine and the origin simply isn't allowed.
    throw new ApiError(
      `Couldn't reach the API at ${BASE_URL}. Check that the Django server ` +
        `is running there, and that this page's address ` +
        `(${window.location.origin}) is allowed by CORS. The browser console ` +
        `has the underlying error.`,
      { status: 0 },
    )
  }

  if (res.status === 401 && auth && !_retried) {
    const fresh = await refreshAccessToken()
    if (fresh) {
      return request(path, { method, body, params, signal, auth, _retried: true })
    }
    broadcastExpiry()
  }

  const payload = await readBody(res)

  if (!res.ok) {
    const { message, fieldErrors } = parseError(res.status, payload)
    throw new ApiError(message, { status: res.status, fieldErrors, payload })
  }

  return payload
}

/**
 * DRF returns a bare array when pagination is off and `{results: []}` when
 * it's on. Normalise so pages never have to care.
 */
export function toList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export { BASE_URL }
