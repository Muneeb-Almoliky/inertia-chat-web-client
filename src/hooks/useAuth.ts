'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRefreshToken } from './useRefreshToken'

export function useAuth() {
  const isHydrated     = useAuthStore(state => state.isHydrated)
  const isInitialized  = useAuthStore(state => state.isInitialized)
  const accessToken    = useAuthStore(state => state.accessToken)
  const isAuthenticated= useAuthStore(state => state.isAuthenticated)
  const setInitialized = useAuthStore(state => state.setInitialized)
  const setLoading     = useAuthStore(state => state.setLoading)
  const clearAuth      = useAuthStore(state => state.clearAuth)
  const hydrateAuth    = useAuthStore(state => state.hydrateAuth)
  const userId        = useAuthStore(state => state.userId)
  const username = useAuthStore(state => state.username)

  const refresh = useRefreshToken()

  useEffect(() => {
    // If we haven't even hydrated, do that first
    if (!isHydrated) {
      hydrateAuth()
      return
    }

    // Once hydrated, initialize or refresh:
    if (!isInitialized && accessToken) {
      setInitialized(true)
      return
    }

    if (!isInitialized && !accessToken) {
      const initAuth = async () => {
        setLoading(true)
        try {
          await refresh()
        } catch {
          clearAuth()
        } finally {
          setLoading(false)
        }
      }
      initAuth()
    }
  }, [
    isHydrated,
    isInitialized,
    accessToken,
    setInitialized,
    setLoading,
    clearAuth,
    hydrateAuth,
    refresh,
  ])

  return {
    auth: {
      isHydrated,
      isInitialized,
      isAuthenticated,
      accessToken,
      userId,
      username
    },
  }
}
