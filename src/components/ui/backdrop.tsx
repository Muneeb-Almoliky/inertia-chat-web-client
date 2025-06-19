'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface BackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean
  onClose: () => void
}

export function Backdrop({ show, onClose, className, ...props }: BackdropProps) {
  if (!show) return null

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      onClick={onClose}
      {...props}
    />
  )
}