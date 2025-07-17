'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth.store'

export function AuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function GuardedComponent(props: P) {
    const router = useRouter()
    const isHydrated     = useAuthStore((s) => s.isHydrated)
    const isLoading      = useAuthStore((s) => s.isLoading)
    const isInitialized  = useAuthStore((s) => s.isInitialized)
    const isAuthenticated= useAuthStore((s) => s.isAuthenticated)
    const hydrateAuth    = useAuthStore((s) => s.hydrateAuth)

    // hydrate on first mount
    useEffect(() => {
      hydrateAuth()
    }, [hydrateAuth])
        
    useEffect(() => {
      // Wait for hydration to complete before making authentication decisions
      if (!isHydrated || isLoading) return;

      if (isInitialized && !isAuthenticated) {
        // preserve current path so we can return after login
        const returnTo = window.location.pathname + window.location.search
        router.replace(`/login?from=${encodeURIComponent(returnTo)}`)
      }
    }, [isAuthenticated, isLoading, isInitialized, isHydrated, router])

    // Show loading while hydrating
    if (!isHydrated || isLoading) {
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