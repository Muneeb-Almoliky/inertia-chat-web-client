'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRefreshToken } from './useRefreshToken'

export function useAuth() {
  const auth = useAuthStore()
  const refresh = useRefreshToken()

  useEffect(() => {
    // Only try to refresh if we haven't initialized yet
    if (!auth.isInitialized) {
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
  }, []) // Empty deps array as this should only run once on mount

  return { auth }
} 