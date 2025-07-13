'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRefreshToken } from './useRefreshToken'

export function useAuth() {
  const auth = useAuthStore()
  const refresh = useRefreshToken()

  useEffect(() => {
    if (!auth.isHydrated) {
      return;
    }

    // if an accessToken is found, just mark as initialized without refreshing
    if (!auth.isInitialized && auth.accessToken) {
      auth.setInitialized(true)
      return;
    }

    if (!auth.isInitialized && !auth.accessToken) {
      const initAuth = async () => {
        try {
          auth.setLoading(true)
          await refresh()
        } catch {
          // If refresh fails, mark as initialized but not authenticated
          auth.clearAuth()
        } finally {
          auth.setLoading(false)
        }
      }
      initAuth()
    }
  }, [auth.isHydrated, auth.isInitialized, auth.accessToken, auth.setLoading, auth.clearAuth, auth.setInitialized, refresh])

  return { auth }
} 