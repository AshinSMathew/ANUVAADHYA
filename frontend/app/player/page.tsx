"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ArrowLeft, Settings, SkipBack, SkipForward, Sparkles, X, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Parse SRT subtitle format
function parseSRT(srtText: string) {
  const subtitles: Array<{ startTime: number; endTime: number; text: string; index: number }> = []
  const blocks = srtText.trim().split('\n\n')
  
  blocks.forEach((block, index) => {
    const lines = block.split('\n')
    if (lines.length >= 3) {
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/)
      if (timeMatch) {
        const startTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000
        const endTime = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000
        const text = lines.slice(2).join(' ')
        subtitles.push({ startTime, endTime, text, index: index + 1 })
      }
    }
  })
  
  return subtitles
}

interface SceneMatch {
  subtitleIndex: number
  startTime: number
  endTime: number
  text: string
  confidence: number
  reason: string
}

export default function PlayerPage() {
  const router = useRouter()
  const { userRole } = useAuth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  const [showControls, setShowControls] = useState(true)
  const [subtitles, setSubtitles] = useState<Array<{ startTime: number; endTime: number; text: string; index: number }>>([])
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SceneMatch[]>([])
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load video and subtitle data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('playerData')
      if (storedData) {
        const { videoURL, videoName: name, subtitleData: srtData } = JSON.parse(storedData)
        setVideoSrc(videoURL)
        setVideoName(name)
        setSubtitleData(srtData)
        const parsedSubtitles = parseSRT(srtData)
        setSubtitles(parsedSubtitles)
        setIsLoading(false)
      } else {
        // No data found, redirect back
        router.push('/')
      }
    }
  }, [router])

  // Keyboard shortcuts - disable when search panel is open or input is focused
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // If search panel is open and user is typing in search input, don't handle media keys
      const isSearchInputFocused = document.activeElement === searchInputRef.current
      
      if (showSearchPanel && isSearchInputFocused) {
        // Allow only Escape to close the panel when focused on input
        if (e.code === 'Escape') {
          setShowSearchPanel(false)
        }
        return // Don't process media keys when typing in search
      }

      if (!videoRef.current) return
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (!showSearchPanel) {
            togglePlay()
          }
          break
        case 'KeyF':
          e.preventDefault()
          if (!showSearchPanel) {
            toggleFullscreen()
          }
          break
        case 'KeyM':
          e.preventDefault()
          if (!showSearchPanel) {
            toggleMute()
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (!showSearchPanel) {
            skipTime(-10)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (!showSearchPanel) {
            skipTime(10)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (!showSearchPanel) {
            adjustVolume(0.1)
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (!showSearchPanel) {
            adjustVolume(-0.1)
          }
          break
        case 'Escape':
          if (isFullscreen && !showSearchPanel) {
            toggleFullscreen()
          }
          if (showSearchPanel) {
            setShowSearchPanel(false)
          }
          break
        case 'KeyK':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            setShowSearchPanel(true)
            setTimeout(() => searchInputRef.current?.focus(), 100)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isMuted, isFullscreen, showSearchPanel])

  // Focus search input when panel opens
  useEffect(() => {
    if (showSearchPanel && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [showSearchPanel])

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

  // AI Scene Search
  const handleSceneSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setSearchResults([])

    try {
      const response = await fetch('/api/search-scene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          subtitles: subtitles,
          video_duration: duration,
          target_language: 'en'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const results: SceneMatch[] = await response.json()
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      alert('Failed to search scenes. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Jump to scene
  const jumpToScene = (scene: SceneMatch) => {
    if (videoRef.current) {
      videoRef.current.currentTime = scene.startTime
      if (!isPlaying) {
        videoRef.current.play()
        setIsPlaying(true)
      }
      setShowSearchPanel(false)
    }
  }

  // Close search panel
  const closeSearchPanel = () => {
    setShowSearchPanel(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // Generate and view Bias & Representation Report
  const handleViewReport = () => {
    // Extract emotions from subtitles
    const emotionRegex = /\[(.*?)\]/g
    const emotions: Record<string, number> = {}
    let totalEmotions = 0
    
    // Process each subtitle to extract emotions
    subtitleData.split('\n').forEach(line => {
      let match
      while ((match = emotionRegex.exec(line)) !== null) {
        const emotion = match[1].toLowerCase().trim()
        // Skip neutral emotion
        if (emotion && emotion !== 'neutral') {
          emotions[emotion] = (emotions[emotion] || 0) + 1
          totalEmotions++
        }
      }
    })
    
    // Calculate percentages and sort by frequency
    const emotionStats = Object.entries(emotions).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: Math.round((count / totalEmotions) * 100)
    })).sort((a, b) => b.count - a.count)
    
    // Generate HTML report content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bias & Representation Audit Report</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          h1, h2 {
            color: #e53e3e;
          }
          h1 {
            border-bottom: 2px solid #e53e3e;
            padding-bottom: 10px;
          }
          .info {
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .chart-container {
            margin: 30px 0;
          }
          .emotion-bar {
            display: flex;
            margin-bottom: 10px;
            align-items: center;
          }
          .emotion-name {
            width: 120px;
            font-weight: bold;
          }
          .emotion-bar-fill {
            height: 25px;
            background-color: #e53e3e;
            border-radius: 3px;
            margin-right: 10px;
          }
          .emotion-percentage {
            font-weight: bold;
          }
          .summary {
            background-color: #fff;
            border-left: 4px solid #e53e3e;
            padding: 15px;
            margin-top: 30px;
          }
          .footer {
            margin-top: 40px;
            font-size: 0.9em;
            color: #666;
            text-align: center;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <script>
          window.onload = function() {
            // Auto-download PDF after page loads
            setTimeout(function() {
              const { jsPDF } = window.jspdf;
              
              html2canvas(document.body).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const imgX = (pdfWidth - imgWidth * ratio) / 2;
                const imgY = 30;
                
                pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
                pdf.save('${videoName.split('.')[0]}_representation_audit.pdf');
              });
            }, 500);
          }
        </script>
      </head>
      <body>
        <h1>Bias & Representation Audit Report</h1>
        
        <div class="info">
          <p><strong>File:</strong> ${videoName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <h2>EMOTIONAL TONE DISTRIBUTION</h2>
        <div class="chart-container">
          ${emotionStats.map(stat => `
            <div class="emotion-bar">
              <div class="emotion-name">${stat.emotion}</div>
              <div class="emotion-bar-fill" style="width: ${stat.percentage}%"></div>
              <div class="emotion-percentage">${stat.percentage}% (${stat.count} occurrences)</div>
            </div>
          `).join('')}
        </div>
        
        <div class="summary">
          <h2>SUMMARY</h2>
          <p><strong>Dominant emotion:</strong> ${emotionStats[0]?.emotion || 'None'} (${emotionStats[0]?.percentage || 0}%)</p>
          <p><strong>Secondary emotion:</strong> ${emotionStats[1]?.emotion || 'None'} (${emotionStats[1]?.percentage || 0}%)</p>
          <p><strong>Emotional diversity:</strong> ${Object.keys(emotions).length} distinct emotions detected</p>
        </div>
        
        <div class="footer">
          <p>This report provides quantifiable insight for inclusive storytelling and is relevant for global media standards.</p>
          <p>Generated by Anuvaadhya</p>
        </div>
      </body>
      </html>
    `
    
    // Create a blob and open in new tab
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    // Clean up the URL object after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
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
      <div className={`absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-lg sm:text-xl font-semibold">Back</span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* AI Search Button */}
            <button
              onClick={() => setShowSearchPanel(!showSearchPanel)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-300 shadow-lg text-sm sm:text-base"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Scene Search</span>
              <span className="sm:hidden">Search</span>
              <kbd className="hidden sm:inline text-xs bg-black/30 px-2 py-1 rounded">⌘K</kbd>
            </button>

            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={handleDownloadSRT}
                className="px-2 py-1 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-xs sm:text-sm font-medium"
              >
                Download SRT
              </button>
              {userRole?.role === 'production' && (
                <button
                  onClick={handleViewReport}
                  className="px-2 py-1 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-xs sm:text-sm font-medium"
                >
                  View Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Search Panel - Responsive */}
      {showSearchPanel && (
        <div className={`absolute z-50 bg-black/95 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 ${
          isMobile 
            ? 'inset-4 top-20 max-h-[70vh] overflow-hidden flex flex-col' 
            : 'top-20 right-8 w-96 max-h-[70vh]'
        }`}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold text-lg">AI Scene Search</h3>
            </div>
            <button
              onClick={closeSearchPanel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex gap-2 mb-4">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSceneSearch()}
                placeholder="Find scenes like 'confession in rain'..."
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm sm:text-base"
              />
              <button
                onClick={handleSceneSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => jumpToScene(result)}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1 flex-col sm:flex-row gap-1">
                        <span className="text-purple-400 text-sm font-medium">
                          {formatTime(result.startTime)} - {formatTime(result.endTime)}
                        </span>
                        <span className="text-green-400 text-xs">
                          {Math.round(result.confidence * 100)}% match
                        </span>
                      </div>
                      <p className="text-white text-sm mb-1 line-clamp-2">{result.text}</p>
                      <p className="text-gray-400 text-xs line-clamp-2">{result.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 text-sm mt-2">Searching scenes...</p>
                </div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No scenes found. Try different keywords.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-screen flex items-center justify-center bg-black"
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
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Subtitle Overlay */}
        {currentSubtitle && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center px-4 pointer-events-none">
            <div className="bg-transparent text-white text-base sm:text-lg md:text-xl font-semibold px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg max-w-4xl text-center shadow-2xl border border-white/20 backdrop-blur-sm">
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