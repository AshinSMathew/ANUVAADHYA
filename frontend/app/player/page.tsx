"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ArrowLeft, Settings, SkipBack, SkipForward, RotateCcw } from 'lucide-react'

// Parse SRT subtitle format
function parseSRT(srtText: string) {
  const subtitles: Array<{ startTime: number; endTime: number; text: string }> = []
  const blocks = srtText.trim().split('\n\n')
  
  blocks.forEach(block => {
    const lines = block.split('\n')
    if (lines.length >= 3) {
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/)
      if (timeMatch) {
        const startTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000
        const endTime = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000
        const text = lines.slice(2).join(' ')
        subtitles.push({ startTime, endTime, text })
      }
    }
  })
  
  return subtitles
}

export default function PlayerPage() {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  const [showControls, setShowControls] = useState(true)
  const [subtitles, setSubtitles] = useState<Array<{ startTime: number; endTime: number; text: string }>>([])
  const [videoSrc, setVideoSrc] = useState('')
  const [videoName, setVideoName] = useState('')
  const [subtitleData, setSubtitleData] = useState('')
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoverTime, setHoverTime] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Load video and subtitle data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('playerData')
      if (storedData) {
        const { videoURL, videoName: name, subtitleData: srtData } = JSON.parse(storedData)
        setVideoSrc(videoURL)
        setVideoName(name)
        setSubtitleData(srtData)
        setSubtitles(parseSRT(srtData))
        setIsLoading(false)
      } else {
        // No data found, redirect back
        router.push('/')
      }
    }
  }, [router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skipTime(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          skipTime(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          adjustVolume(0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          adjustVolume(-0.1)
          break
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isMuted, isFullscreen])

  // Update current subtitle based on video time
  useEffect(() => {
    const current = subtitles.find(
      sub => currentTime >= sub.startTime && currentTime <= sub.endTime
    )
    setCurrentSubtitle(current ? current.text : '')
  }, [currentTime, subtitles])

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Skip time
  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
    }
  }

  // Adjust volume
  const adjustVolume = (delta: number) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, volume + delta))
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      const element = containerRef.current
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen()
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen()
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen()
      }
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * duration
  }

  // Handle progress bar hover
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    setHoverTime(pos * duration)
    setShowPreview(true)
  }

  // Handle video events
  const handleVideoLoad = () => {
    setIsLoading(false)
    setError('')
  }

  const handleVideoError = () => {
    setError('Failed to load video. Please try again.')
    setIsLoading(false)
  }

  const handleVideoCanPlay = () => {
    setIsLoading(false)
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle mouse movement for controls
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  // Download SRT
  const handleDownloadSRT = () => {
    const blob = new Blob([subtitleData], { type: 'application/x-subrip' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${videoName.split('.')[0]}.srt`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Download VTT
  const handleDownloadVTT = () => {
    const vttContent = 'WEBVTT\n\n' + subtitles.map((sub, i) => {
      const startH = Math.floor(sub.startTime / 3600).toString().padStart(2, '0')
      const startM = Math.floor((sub.startTime % 3600) / 60).toString().padStart(2, '0')
      const startS = Math.floor(sub.startTime % 60).toString().padStart(2, '0')
      const startMs = Math.floor((sub.startTime % 1) * 1000).toString().padStart(3, '0')
      
      const endH = Math.floor(sub.endTime / 3600).toString().padStart(2, '0')
      const endM = Math.floor((sub.endTime % 3600) / 60).toString().padStart(2, '0')
      const endS = Math.floor(sub.endTime % 60).toString().padStart(2, '0')
      const endMs = Math.floor((sub.endTime % 1) * 1000).toString().padStart(3, '0')
      
      return `${i + 1}\n${startH}:${startM}:${startS}.${startMs} --> ${endH}:${endM}:${endS}.${endMs}\n${sub.text}\n`
    }).join('\n')
    
    const blob = new Blob([vttContent], { type: 'text/vtt' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${videoName.split('.')[0]}.vtt`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings) {
        const target = event.target as Element
        if (!target.closest('[data-settings]')) {
          setShowSettings(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSettings])

  const handleBack = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc)
    }
    sessionStorage.removeItem('playerData')
    router.push('/upload')
  }

  if (!videoSrc) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        
        .slider::-webkit-slider-track {
          background: #4b5563;
          height: 4px;
          border-radius: 2px;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: #dc2626;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-track {
          background: #4b5563;
          height: 4px;
          border-radius: 2px;
          border: none;
        }
        
        .slider::-moz-range-thumb {
          background: #dc2626;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-xl font-semibold">Back</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadSRT}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm font-medium"
            >
              Download SRT
            </button>
            <button
              onClick={handleDownloadVTT}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm font-medium"
            >
              Download VTT
            </button>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-screen flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onTouchStart={() => setShowControls(true)}
        onTouchEnd={() => {
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
          }
          controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false)
          }, 3000)
        }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadStart={handleVideoLoad}
          onError={handleVideoError}
          onCanPlay={handleVideoCanPlay}
          onClick={togglePlay}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Subtitle Overlay */}
        {currentSubtitle && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center px-4 pointer-events-none">
            <div className="bg-transparent text-white text-lg sm:text-xl md:text-2xl font-semibold px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg max-w-4xl text-center shadow-2xl border border-white/20 backdrop-blur-sm">
              {currentSubtitle}
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="px-4 pt-4">
            <div 
              ref={progressRef}
              className="w-full h-1 bg-gray-600 rounded-full cursor-pointer hover:h-2 transition-all group relative"
              onClick={handleProgressClick}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setShowPreview(false)}
            >
              <div 
                className="h-full bg-red-600 rounded-full relative"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
              </div>
              
              {/* Hover Preview */}
              {showPreview && (
                <div 
                  className="absolute top-0 h-full w-1 bg-white/50 pointer-events-none"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {formatTime(hoverTime)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2 sm:px-4 py-3">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Skip Back */}
              <button
                onClick={() => skipTime(-10)}
                className="text-white hover:text-red-500 transition-colors"
                title="Skip back 10s"
              >
                <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-red-500 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8" />}
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skipTime(10)}
                className="text-white hover:text-red-500 transition-colors"
                title="Skip forward 10s"
              >
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Volume - Hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-red-500 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Time */}
              <span className="text-white text-xs sm:text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Volume - Mobile only */}
              <div className="sm:hidden">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-red-500 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Settings */}
              <div className="relative" data-settings>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-red-500 transition-colors"
                >
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                
                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 text-white rounded-lg p-3 sm:p-4 min-w-40 sm:min-w-48">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-2">Playback Speed</label>
                        <div className="grid grid-cols-3 gap-1 sm:flex sm:gap-2">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                            <button
                              key={rate}
                              onClick={() => handlePlaybackRateChange(rate)}
                              className={`px-2 py-1 text-xs rounded ${
                                playbackRate === rate ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-500 transition-colors"
              >
                {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Center Play Button (when paused) */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
          </button>
        )}
      </div>
    </div>
  )
}