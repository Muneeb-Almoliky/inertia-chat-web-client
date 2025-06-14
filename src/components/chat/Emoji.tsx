"use client"

import * as React from "react"
import { parseEmoji } from "@/utils/emoji"

interface EmojiProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { width: 20, height: 20 },
  md: { width: 24, height: 24 },
  lg: { width: 32, height: 32 }
}

export function Emoji({ children, size = 'md' }: EmojiProps) {
  const emojiRef = React.useRef<HTMLSpanElement>(null)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (isMounted && emojiRef.current) {
      parseEmoji(emojiRef.current)
    }
  }, [isMounted, children])

  return (
    <span
      ref={emojiRef}
      style={{
        display: 'inline-block',
        width: sizeConfig[size].width,
        height: sizeConfig[size].height,
        verticalAlign: 'middle',
        lineHeight: 1
      }}
    >
      {children}
    </span>
  )
}
