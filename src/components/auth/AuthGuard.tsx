'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth.store'

export function AuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function GuardedComponent(props: P) {
    const router = useRouter()
    const isInitialized = useAuthStore((state) => state.isInitialized)
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    useEffect(() => {
      if (isInitialized && !isAuthenticated) {
        // preserve current path so we can return after login
        const returnTo = window.location.pathname + window.location.search
        router.replace(`/login?from=${encodeURIComponent(returnTo)}`)
      }
    }, [isAuthenticated, isInitialized, router])

    if (!isAuthenticated || !isInitialized) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
