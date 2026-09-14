import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUTH_EXPIRED_EVENT, tokenStore } from '../api/client'
import { auth as authApi } from '../api/endpoints'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // `booting` covers the first "do we already have a valid session?" check,
  // so the router doesn't flash the login page on a hard refresh. With no
  // stored token there is nothing to verify, so we start already booted.
  const [booting, setBooting] = useState(() => Boolean(tokenStore.read()?.access))

  const signOut = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Revalidate a stored token on mount: a token in localStorage is not
  // proof of a live session (it may have expired while the tab was closed).
  useEffect(() => {
    const stored = tokenStore.read()
    if (!stored?.access) return

    let cancelled = false
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        if (!cancelled) {
          tokenStore.clear()
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setBooting(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // The API client shouts when a refresh fails; drop the user immediately.
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const signIn = useCallback(async (username, password) => {
    const data = await authApi.login({ username, password })
    tokenStore.write({ access: data.access, refresh: data.refresh })

    // The token endpoint returns the user, but fall back to /users/me/ so
    // the app still works against an unmodified backend.
    const me = data.user ?? (await authApi.me())
    setUser(me)
    return me
  }, [])

  const register = useCallback((payload) => authApi.register(payload), [])

  const refreshUser = useCallback(async () => {
    const me = await authApi.me()
    setUser(me)
    return me
  }, [])

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      booting,
      isAuthenticated: Boolean(user),
      signIn,
      signOut,
      register,
      refreshUser,
    }),
    [user, booting, signIn, signOut, register, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
