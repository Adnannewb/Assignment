import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { LoadingState } from './ui/States'
import Button from './ui/Button'

/**
 * Gate for every authenticated route.
 *
 *   - still checking a stored token -> hold the screen, don't flash /login
 *   - no session                    -> bounce to /login, remembering where
 *                                      they were headed
 *   - wrong role                    -> explain, rather than silently
 *                                      redirecting to somewhere unexpected
 */
export default function ProtectedRoute({ allow, children }) {
  const { isAuthenticated, booting, role } = useAuth()
  const location = useLocation()

  if (booting) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-50">
        <LoadingState label="Restoring your session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allow && !allow.includes(role)) {
    return <Forbidden />
  }

  return children
}

export function Forbidden() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">
        <ShieldAlert size={26} aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-lg font-bold text-ink-900">This page isn’t yours</h1>
        <p className="mt-1 text-sm text-ink-500">
          Your role doesn’t have access to this area. If you think that’s wrong,
          ask an administrator to review your account.
        </p>
      </div>
      <Button variant="secondary" onClick={() => window.history.back()}>
        Go back
      </Button>
    </div>
  )
}

/** Conditionally render a fragment of UI for certain roles only. */
export function RoleGate({ allow, children, fallback = null }) {
  const { role } = useAuth()
  return allow.includes(role) ? children : fallback
}
