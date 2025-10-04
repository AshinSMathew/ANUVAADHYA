"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

interface ProcessingScreenProps {
  file: File | null
  onComplete: () => void
}

const processingMessages = [
  "Analyzing audio patterns...",
  "Extracting speech segments...",
  "Translating the universal language of music...",
  "Generating precise timestamps...",
  "Optimizing subtitle timing...",
  "Finalizing your subtitles...",
]

interface GameCharacter {
  x: number
  y: number
  isJumping: boolean
}

interface Obstacle {
  id: number
  x: number
  y: number
}

export function ProcessingScreen({ file, onComplete }: ProcessingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [gameScore, setGameScore] = useState(0)
  const [isGameActive, setIsGameActive] = useState(false)
  const [character, setCharacter] = useState<GameCharacter>({ x: 50, y: 150, isJumping: false })
  const [obstacles, setObstacles] = useState<Obstacle[]>([])

  useEffect(() => {
    if (!isGameActive) return

    const gameInterval = setInterval(() => {
      // Move obstacles left
      setObstacles((prev) =>
        prev.map((obstacle) => ({ ...obstacle, x: obstacle.x - 5 })).filter((obstacle) => obstacle.x > -50),
      )

      // Add new obstacles
      if (Math.random() < 0.02) {
        setObstacles((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: 400,
            y: 150,
          },
        ])
      }

      // Update score
      setGameScore((prev) => prev + 1)
    }, 50)

    return () => clearInterval(gameInterval)
  }, [isGameActive])

  // Handle jump
  const handleJump = () => {
    if (!character.isJumping && isGameActive) {
      setCharacter((prev) => ({ ...prev, isJumping: true, y: 100 }))
      setTimeout(() => {
        setCharacter((prev) => ({ ...prev, isJumping: false, y: 150 }))
      }, 500)
    }
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault()
        handleJump()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [character.isJumping, isGameActive])

  useEffect(() => {
    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => onComplete(), 1000)
          return 100
        }
        return prev + Math.random() * 2 + 1
      })
    }, 400)

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % processingMessages.length)
    }, 3000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [onComplete])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#FFF7E6" }}>
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4" style={{ color: "#C01919" }}>
          Processing
        </h1>
        <p className="text-gray-600 font-sans">
          {file?.name} • {((file?.size || 0) / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>

      <div className="glassmorphic-card w-full max-w-4xl p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-serif font-medium text-gray-800">Progress</span>
            <span className="text-2xl font-serif font-semibold" style={{ color: "#C01919" }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full animate-progress-pulse transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #C01919, #a01515, #C01919)",
                backgroundSize: "200% 100%",
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 font-sans">
              Estimated time: {Math.max(1, Math.round((100 - progress) / 12))} minutes remaining
            </p>
          </div>
        </div>

        <div className="text-center py-6 glassmorphic-card">
          <p className="text-xl font-serif font-medium" style={{ color: "#C01919" }}>
            {processingMessages[currentMessage]}
          </p>
        </div>

        <div className="glassmorphic-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-serif font-medium text-gray-800">Music Note Runner</h3>
            <div className="flex items-center gap-4">
              <span className="font-serif font-semibold" style={{ color: "#C01919" }}>
                Score: {gameScore}
              </span>
              <Button
                size="sm"
                onClick={() => {
                  setIsGameActive(!isGameActive)
                  if (!isGameActive) {
                    setObstacles([])
                    setGameScore(0)
                    setCharacter({ x: 50, y: 150, isJumping: false })
                  }
                }}
                style={{ backgroundColor: "#C01919", color: "#FFF7E6" }}
              >
                {isGameActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div
            className="relative h-48 rounded-lg overflow-hidden border-2 cursor-pointer"
            style={{ backgroundColor: "#FFF7E6", borderColor: "#C01919" }}
            onClick={handleJump}
          >
            {/* Game character (music note) */}
            <div
              className="absolute w-8 h-8 rounded-full transition-all duration-300"
              style={{
                left: `${character.x}px`,
                top: `${character.y}px`,
                backgroundColor: "#C01919",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="absolute top-1 left-1 w-6 h-6 rounded-full" style={{ backgroundColor: "#FFF7E6" }} />
            </div>

            {/* Obstacles */}
            {obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                className="absolute w-6 h-12"
                style={{
                  left: `${obstacle.x}px`,
                  top: `${obstacle.y}px`,
                  backgroundColor: "#8B4513",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}

            {!isGameActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 font-sans mb-2">Click Play to start the music note runner</p>
                  <p className="text-xs text-gray-500 font-sans">Press SPACE or click to jump over obstacles</p>
                </div>
              </div>
            )}

            {isGameActive && (
              <div className="absolute top-2 left-2 text-xs text-gray-600 font-sans">Press SPACE or click to jump</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Languages", value: "2" },
            { label: "Words", value: Math.round(progress * 8).toString() },
            { label: "Accuracy", value: "99.5%" },
            { label: "Quality", value: "High" },
          ].map((stat, index) => (
            <div key={index} className="glassmorphic-card p-4 text-center">
              <div className="text-2xl font-serif font-semibold mb-1" style={{ color: "#C01919" }}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-sans">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
