'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './useAuth'

const PUBLIC_PATHS = ['/login', '/signup']

export function useRequireAuth() {
  const { auth } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only handle redirects after initialization
    if (!auth.isInitialized || auth.isLoading) {
      return
    }

    // If we're on a public path and authenticated, redirect to chat
    if (auth.isAuthenticated && PUBLIC_PATHS.includes(pathname)) {
      router.replace('/chat')
      return
    }

    // If we're not on a public path and not authenticated, redirect to login
    if (!auth.isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login')
    }
  }, [auth.isAuthenticated, auth.isInitialized, auth.isLoading, pathname, router])

  return auth
} 