import { createContext } from 'react'

/**
 * Kept apart from the provider and the hook so each module exports only
 * one kind of thing — which is what keeps Fast Refresh working.
 */
export const AuthContext = createContext(null)
