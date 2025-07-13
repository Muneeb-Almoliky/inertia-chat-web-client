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
    const isHydrated = useAuthStore((state) => state.isHydrated)

    useEffect(() => {
      // Wait for hydration to complete before making authentication decisions
      if (!isHydrated) {
        return;
      }

      if (isInitialized && !isAuthenticated) {
        // preserve current path so we can return after login
        const returnTo = window.location.pathname + window.location.search
        router.replace(`/login?from=${encodeURIComponent(returnTo)}`)
      }
    }, [isAuthenticated, isInitialized, isHydrated, router])

    // Show loading while hydrating
    if (!isHydrated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!isAuthenticated || !isInitialized) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
