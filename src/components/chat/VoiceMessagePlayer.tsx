"use client"

import * as React from "react"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import WavesurferPlayer from '@wavesurfer/react'
import { getAudioDuration, formatTime } from "@/utils/audio"

interface VoiceMessagePlayerProps {
  url: string
  duration?: number
  onPlay?: () => void
  onPause?: () => void
}

export function VoiceMessagePlayer({ url, duration = 0, onPlay, onPause }: VoiceMessagePlayerProps) {
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
    <div className="flex items-center gap-2">
      <div className="flex flex-col flex-1">
        <span className="text-sm">Voice Message</span>
        <span className="text-xs text-muted-foreground">
          {currentDuration > 0 ? `${formatTime(currentTime)} / ${formatTime(currentDuration)}` : 'Loading...'}
        </span>
        <div className="w-full h-10">
          <WavesurferPlayer
            height={40}
            waveColor="rgb(156, 163, 175)"
            progressColor="rgb(59, 130, 246)"
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
          />
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={handlePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}