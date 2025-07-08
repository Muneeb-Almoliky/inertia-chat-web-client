'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Users, Smartphone, Clock } from 'lucide-react'

const features = [
  { icon: <MessageSquare className="h-8 w-8 text-primary" />, title: 'Real‑time Messaging', description: 'Instant communication with typing indicators' },
  { icon: <Users className="h-8 w-8 text-primary" />,           title: 'Group Chats',          description: 'Connect with multiple people' },
  { icon: <Smartphone className="h-8 w-8 text-primary" />,      title: 'Cross‑Platform',       description: 'Access from any device' },
  { icon: <Clock className="h-8 w-8 text-primary" />,           title: 'Message History',      description: 'Your conversations always available' },
]

export function Features() {
  return (
    <section className="py-12 border-t border-border bg-card">
      <div className="max-w-5xl mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl font-bold text-center text-foreground mb-8"
        >
          Key Features
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-lg border border-border bg-background hover:shadow-sm transition-all"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">{f.icon}</div>
              </div>
              <h3 className="text-lg font-medium text-center text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground text-center">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
