"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Download, Film, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DomeGalleryProps {
  onFileUpload: (file: File) => void
  onDownload?: () => void
  isProcessing?: boolean
  isComplete?: boolean
}

const moviePosters = [
  "/bollywood-movie-poster-action.jpg",
  "/bollywood-movie-poster-romance.jpg",
  "/bollywood-movie-poster-drama.jpg",
  "/bollywood-movie-poster-thriller.jpg",
  "/bollywood-movie-poster-comedy.jpg",
  "/bollywood-movie-poster-musical.jpg",
  "/hollywood-movie-poster-action.jpg",
  "/hollywood-movie-poster-sci-fi.jpg",
  "/regional-cinema-poster.jpg",
  "/international-film-poster.jpg",
  "/classic-movie-poster.jpg",
  "/indie-film-poster.jpg",
]

export function DomeGallery({ onFileUpload, onDownload, isProcessing, isComplete }: DomeGalleryProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simulate processing progress
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + Math.random() * 15
        })
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isProcessing])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && (files[0].type.startsWith("video/") || files[0].type.startsWith("audio/"))) {
      onFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileUpload(files[0])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black relative overflow-hidden">
      {/* 3D Dome Gallery Background */}
      <div className="absolute inset-0 perspective-1000">
        <div className="relative w-full h-full transform-gpu">
          {moviePosters.map((poster, index) => {
            const angle = index * 30 - 165 // Spread across 360 degrees
            const radius = 800
            const x = Math.cos((angle * Math.PI) / 180) * radius
            const z = Math.sin((angle * Math.PI) / 180) * radius
            const rotateY = angle + 180

            return (
              <motion.div
                key={index}
                className="absolute top-1/2 left-1/2 w-48 h-64 transform-gpu"
                style={{
                  transform: `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg)`,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.7, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                whileHover={{ scale: 1.1, opacity: 1 }}
              >
                <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl border border-red-500/20">
                  <img
                    src={poster || "/placeholder.svg"}
                    alt={`Movie poster ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center gap-1 text-white/80">
                      <Film className="w-3 h-3" />
                      <span className="text-xs font-medium">Cinema</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Floating Glass Upload Interface */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1, duration: 0.8, type: "spring" }}
        >
          <div className="glassmorphic-red rounded-2xl p-8 w-96 text-center backdrop-blur-xl border border-red-500/30">
            <AnimatePresence mode="wait">
              {!isProcessing && !isComplete && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Upload Your Media</h2>
                    <p className="text-red-200/80">Drop your video or audio file to generate subtitles</p>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer ${
                      isDragOver
                        ? "border-red-400 bg-red-500/20 scale-105"
                        : "border-red-500/50 hover:border-red-400 hover:bg-red-500/10"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setIsDragOver(true)}
                    onDragLeave={() => setIsDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white font-medium">
                      {isDragOver ? "Drop your file here" : "Click to browse or drag & drop"}
                    </p>
                    <p className="text-red-200/60 text-sm mt-2">Supports MP4, MOV, MP3, WAV</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </motion.div>
              )}

              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Processing...</h2>
                    <p className="text-red-200/80">Generating your subtitles</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="8" fill="none" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="#ef4444"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray="283"
                          strokeDashoffset={283 - (283 * progress) / 100}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-red-200">
                      <Play className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">Analyzing audio tracks...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {isComplete && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Ready!</h2>
                    <p className="text-red-200/80">Your subtitles have been generated</p>
                  </div>

                  <Button
                    onClick={onDownload}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Subtitles
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}
