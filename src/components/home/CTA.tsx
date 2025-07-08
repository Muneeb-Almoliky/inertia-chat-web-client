'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

export function CTA() {
  const router = useRouter()
  const { auth } = useAuth()

  return (
    <section className="py-12 border-t border-border">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto px-4 text-center"
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Ready to start chatting?</h2>
        <Button size="lg" onClick={() => router.push(auth.isAuthenticated ? '/chat' : '/signup')}>
          {auth.isAuthenticated ? 'Continue to App' : 'Join Now'}
        </Button>
      </motion.div>
    </section>
  )
}
