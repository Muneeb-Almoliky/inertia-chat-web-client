export function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        resolve(audio.duration)
      } else {
        audio.load()
      }
    }

    const handleCanPlay = () => {
      if (audio.duration && isFinite(audio.duration)) {
        resolve(audio.duration)
      }
    }

    const handleError = (error: Event) => {
      reject(error)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }

    // to avoid hanging
    setTimeout(() => {
      cleanup()
      reject(new Error('Audio duration fetch timeout'))
    }, 5000)
  })
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}