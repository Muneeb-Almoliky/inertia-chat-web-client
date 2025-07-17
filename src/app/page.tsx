'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Hero } from '@/components/home/Hero'
import { Features } from '@/components/home/Features'
import { CTA } from '@/components/home/CTA'
import { Footer } from '@/components/home/Footer'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { auth } = useAuth()

  useEffect(() => {
    if (auth.isInitialized && auth.isAuthenticated) {
      router.replace('/chat')
    }
  }, [auth.isInitialized, auth.isAuthenticated, router])

  // Show spinner while auth is initializing or redirecting
  if (!auth.isInitialized || !auth.isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (auth.isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  )
}
