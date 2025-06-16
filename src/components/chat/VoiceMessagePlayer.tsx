"use client"

import * as React from "react"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import WavesurferPlayer from '@wavesurfer/react'
import { getAudioDuration, formatTime } from "@/utils/audio"
import { cn } from "@/lib/utils"

interface VoiceMessagePlayerProps {
  url: string
  duration?: number
  isCurrentUser?: boolean;
  onPlay?: () => void
  onPause?: () => void
}

export function VoiceMessagePlayer({ url, duration = 0, isCurrentUser = false, onPlay, onPause }: VoiceMessagePlayerProps) {
  const [wavesurfer, setWavesurfer] = React.useState<any>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentDuration, setCurrentDuration] = React.useState(duration)
  const [currentTime, setCurrentTime] = React.useState(0)

  React.useEffect(() => {
    getAudioDuration(url)
      .then(duration => {
        setCurrentDuration(duration)
      })
      .catch(error => {
        console.error('Failed to get audio duration:', error)
      })
  }, [url])

  const onReady = (ws: any) => {
    setWavesurfer(ws)
    setIsPlaying(false)

    if (ws && ws.getDuration()) {
      const wsDuration = ws.getDuration()
      if (wsDuration && isFinite(wsDuration)) {
        setCurrentDuration(wsDuration)
      }
    }

    ws.on('audioprocess', () => {
      const time = ws.getCurrentTime()
      setCurrentTime(time)
    })

    ws.on('interaction', () => {
      const time = ws.getCurrentTime()
      setCurrentTime(time)
    })

    ws.on('finish', () => {
      setIsPlaying(false)
      setCurrentTime(0)
      ws.seekTo(0)
      onPause?.()
    })
  }

  const handlePlayPause = () => {
    if (wavesurfer) {
      if (isPlaying) {
        wavesurfer.pause()
      } else {
        if (currentTime >= currentDuration) {
          wavesurfer.seekTo(0)
          setCurrentTime(0)
        }
        wavesurfer.play()
      }
    }
  }

  return (
    <div className={cn(
      "flex items-center gap-3",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "size-8 rounded-full cursor-pointer",
          isCurrentUser ? "hover:bg-white/10 hover:text-white" : "hover:bg-border"
        )}
        onClick={handlePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      <div className="flex-1 min-w-0 w-[200px]">
        <div className="w-full h-8">
          <WavesurferPlayer
            height={32}
            waveColor={isCurrentUser ? "#5c6d96" : "#bbb"}
            progressColor={isCurrentUser ? "#b8c0d4" : "#555"}
            cursorColor="transparent"
            url={url}
            onReady={onReady}
            onPlay={() => {
              setIsPlaying(true)
              onPlay?.()
            }}
            onPause={() => {
              setIsPlaying(false)
              onPause?.()
            }}
            interact={true}
            barWidth={2}
            barGap={2}
            barRadius={2}
            normalize={true}
          />
        </div>
        <div className={cn(
          "text-xs mt-1",
          isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {currentDuration > 0 ? `${formatTime(currentTime)} / ${formatTime(currentDuration)}` : 'Loading...'}
        </div>
      </div>
    </div>
  )
}