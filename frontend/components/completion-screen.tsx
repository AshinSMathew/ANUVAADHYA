"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Share2, Eye, RotateCcw, Sparkles, Clock, Globe, FileText } from "lucide-react"

interface CompletionScreenProps {
  file: File | null
  onReset: () => void
}

export function CompletionScreen({ file, onReset }: CompletionScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStats(true)
    }, 1000)

    const confettiTimer = setTimeout(() => {
      setShowConfetti(false)
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearTimeout(confettiTimer)
    }
  }, [])

  const stats = [
    { icon: Globe, label: "Source", value: "English", color: "#C01919" },
    { icon: Globe, label: "Target", value: "Hindi", color: "#C01919" },
    { icon: Clock, label: "Time", value: "1m 45s", color: "#C01919" },
    { icon: FileText, label: "Words", value: "892", color: "#C01919" },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#FFF7E6" }}>
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-confetti-burst"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: i % 2 === 0 ? "#C01919" : "#FFF7E6",
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center mb-8 space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="w-16 h-16 animate-glassmorphic-glow" style={{ color: "#C01919" }} />
        </div>

        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4" style={{ color: "#C01919" }}>
          Complete!
        </h1>
        <p className="text-lg text-gray-600 font-sans">Your subtitles are ready for {file?.name}</p>
      </div>

      <div className="glassmorphic-card w-full max-w-4xl p-8 space-y-8">
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glassmorphic-card p-6 text-center hover:scale-105 transition-all duration-300 animate-fade-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: stat.color }} />
                <div className="text-2xl font-serif font-semibold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 font-sans">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Subtitle preview */}
        <div className="glassmorphic-card p-6">
          <h3 className="text-lg font-serif font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" style={{ color: "#C01919" }} />
            Subtitle Preview
          </h3>
          <div className="bg-white/60 rounded-lg p-4 font-mono text-sm space-y-3 border border-gray-200">
            <div className="font-semibold" style={{ color: "#C01919" }}>
              1
            </div>
            <div className="text-gray-600">00:00:01,000 → 00:00:04,000</div>
            <div className="text-gray-800 font-medium">Welcome to our peaceful journey</div>

            <div className="font-semibold mt-4" style={{ color: "#C01919" }}>
              2
            </div>
            <div className="text-gray-600">00:00:04,500 → 00:00:08,000</div>
            <div className="text-gray-800 font-medium">Music connects all languages</div>

            <div className="font-semibold mt-4" style={{ color: "#C01919" }}>
              3
            </div>
            <div className="text-gray-600">00:00:08,500 → 00:00:12,000</div>
            <div className="text-gray-800 font-medium">Every note tells a universal story</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            className="font-serif font-semibold px-8 py-4 hover:scale-110 transition-all duration-200 transform active:scale-95"
            style={{ backgroundColor: "#C01919", color: "#FFF7E6" }}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>

          <Button
            variant="outline"
            className="glassmorphic-card font-serif font-semibold px-8 py-4 hover:scale-110 transition-transform duration-200 transform active:scale-95 bg-transparent"
            style={{ borderColor: "#C01919", color: "#C01919" }}
          >
            <Eye className="w-5 h-5 mr-2" />
            Review
          </Button>

          <Button
            variant="outline"
            className="glassmorphic-card font-serif font-semibold px-8 py-4 hover:scale-110 transition-transform duration-200 transform active:scale-95 bg-transparent"
            style={{ borderColor: "#C01919", color: "#C01919" }}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>

          <Button
            variant="outline"
            onClick={onReset}
            className="glassmorphic-card font-serif font-semibold px-8 py-4 hover:scale-110 transition-transform duration-200 transform active:scale-95 bg-transparent"
            style={{ borderColor: "#C01919", color: "#C01919" }}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            New File
          </Button>
        </div>
      </div>
    </div>
  )
}
