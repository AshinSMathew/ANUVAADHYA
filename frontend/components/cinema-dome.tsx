"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Download, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import SophisticatedDomeGallery from "./sophisticated-dome-gallery"

interface CinemaDomeProps {
  onFileUpload: (file: File) => void
  onDownload?: () => void
  isProcessing?: boolean
  isComplete?: boolean
}

const cinemaPosters = [
  "/movie-posters/bollywood-action.jpg",
  "/movie-posters/hollywood-thriller.jpg",
  "/movie-posters/bollywood-romance.jpg",
  "/movie-posters/hollywood-action.jpg",
  "/movie-posters/bollywood-drama.jpg",
  "/movie-posters/hollywood-scifi.jpg",
  "/movie-posters/bollywood-comedy.jpg",
  "/movie-posters/hollywood-horror.jpg",
  "/movie-posters/bollywood-musical.jpg",
  "/movie-posters/hollywood-drama.jpg",
  "/movie-posters/bollywood-action.jpg",
  "/movie-posters/hollywood-thriller.jpg",
  "/movie-posters/bollywood-romance.jpg",
  "/movie-posters/hollywood-action.jpg",
  "/movie-posters/bollywood-drama.jpg",
  "/movie-posters/hollywood-scifi.jpg",
]

export function CinemaDome({ onFileUpload, onDownload, isProcessing, isComplete }: CinemaDomeProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <SophisticatedDomeGallery
          images={cinemaPosters}
          overlayBlurColor="#000000"
          grayscale={true}
          imageBorderRadius="8px"
          fit={0.8}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <motion.div
          className="pointer-events-auto"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8, type: "spring", bounce: 0.3 }}
        >
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 w-96 text-center shadow-2xl relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5 rounded-3xl"></div>

            <AnimatePresence mode="wait">
              {!isProcessing && !isComplete && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 relative z-10"
                >
                  <div className="flex items-center justify-center mb-4">
                    <Film className="w-8 h-8 text-red-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white">Upload Media</h2>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-500 cursor-pointer group ${
                      isDragOver
                        ? "border-red-400 bg-red-500/20 scale-105"
                        : "border-white/20 hover:border-red-400/60 hover:bg-red-500/10"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setIsDragOver(true)}
                    onDragLeave={() => setIsDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload
                      className={`w-12 h-12 mx-auto mb-4 transition-all duration-300 ${
                        isDragOver ? "text-red-400 scale-110" : "text-white/60 group-hover:text-red-400"
                      }`}
                    />
                    <p className="text-white text-lg font-medium mb-2">
                      {isDragOver ? "Drop your file here" : "Click or drag to upload"}
                    </p>
                    <p className="text-white/50 text-sm">Supports video and audio files</p>
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-6 relative z-10"
                >
                  <h2 className="text-2xl font-bold text-white">Processing</h2>
                  <div className="w-20 h-20 mx-auto relative">
                    <div className="w-20 h-20 border-4 border-white/20 border-t-red-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-8 h-8 text-red-400" />
                    </div>
                  </div>
                  <p className="text-white/80 text-lg">Generating subtitles...</p>
                </motion.div>
              )}

              {isComplete && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-6 relative z-10"
                >
                  <h2 className="text-2xl font-bold text-white">Ready to Download!</h2>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={onDownload}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 text-lg shadow-lg"
                    >
                      <Download className="w-5 h-5 mr-3" />
                      Download Subtitles
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
