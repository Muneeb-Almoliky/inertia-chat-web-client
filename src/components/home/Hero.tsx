'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Smartphone, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function Hero() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleNavigation = (path: string) => {
    setIsNavigating(true)
    router.push(path)
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to <span className="text-primary">Inertia Chat</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Simple, reliable messaging for everyone
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => handleNavigation('/login')}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Get Started
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleNavigation('/signup')}
            disabled={isNavigating}
          >
            Create Account
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="h-64 bg-muted rounded-lg border border-border mx-auto max-w-2xl flex items-center justify-center"
      >
        {/* TODO: Add app screenshot */}
        <div className="text-muted-foreground flex items-center gap-2">
          <Smartphone className="h-6 w-6" />
          <span>Inertia Chat App</span>
        </div>
      </motion.div>
    </section>
  )
}
