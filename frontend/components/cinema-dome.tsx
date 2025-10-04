"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Download, Film, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import SophisticatedDomeGallery from "./sophisticated-dome-gallery"

interface CinemaDomeProps {
  onFileUpload: (file: File, targetLanguage: string) => void
  onDownload?: () => void
  isProcessing?: boolean
  isComplete?: boolean
}

const cinemaPosters = [
  "/1.jpeg",
  "/2.jpeg",
  "/3.jpeg",
  "/4.jpeg",
  "/5.jpeg",

]

const languages = [
  { code: "en", name: "English" },
  // Indian Languages
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
  { code: "mr", name: "Marathi" },
  { code: "ur", name: "Urdu" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
  { code: "sa", name: "Sanskrit" },
  { code: "sd", name: "Sindhi" },
  { code: "ks", name: "Kashmiri" },
  { code: "ne", name: "Nepali" },
  { code: "si", name: "Sinhala" },
  { code: "my", name: "Burmese" },
  // Other Major Languages
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "ar", name: "Arabic" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "cs", name: "Czech" },
  { code: "hu", name: "Hungarian" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "ro", name: "Romanian" },
  { code: "sk", name: "Slovak" },
  { code: "uk", name: "Ukrainian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "lt", name: "Lithuanian" },
  { code: "sl", name: "Slovenian" },
  { code: "et", name: "Estonian" },
  { code: "lv", name: "Latvian" },
  { code: "mt", name: "Maltese" },
  { code: "is", name: "Icelandic" },
  { code: "ga", name: "Irish" },
  { code: "sq", name: "Albanian" },
  { code: "mk", name: "Macedonian" },
  { code: "bs", name: "Bosnian" },
  { code: "sr", name: "Serbian" },
  { code: "ca", name: "Catalan" },
  { code: "eu", name: "Basque" },
  { code: "gl", name: "Galician" },
  { code: "cy", name: "Welsh" },
  { code: "gd", name: "Scottish Gaelic" },
]

export function CinemaDome({ onFileUpload, onDownload, isProcessing, isComplete }: CinemaDomeProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [targetLanguage, setTargetLanguage] = useState("en")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && (files[0].type.startsWith("video/") || files[0].type.startsWith("audio/"))) {
      console.log("Uploading with language:", targetLanguage)
      onFileUpload(files[0], targetLanguage)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      console.log("Uploading with language:", targetLanguage)
      onFileUpload(files[0], targetLanguage)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
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
          <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 w-96 max-h-[90vh] overflow-y-auto text-center shadow-2xl relative overflow-hidden">
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

                  {/* Language Settings */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-red-400" />
                      <h3 className="text-white text-sm font-medium">Translate Subtitles To</h3>
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-xs text-left mb-1 font-medium">
                        Select Target Language
                      </label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => {
                          console.log("Language changed to:", e.target.value)
                          setTargetLanguage(e.target.value)
                        }}
                        className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors"
                      >
                        {languages.map((language) => (
                          <option key={language.code} value={language.code}>
                            {language.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-500 cursor-pointer group ${
                      isDragOver
                        ? "border-red-400 bg-red-500/20 scale-105"
                        : "border-white/20 hover:border-red-400/60 hover:bg-red-500/10"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setIsDragOver(true)}
                    onDragLeave={() => setIsDragOver(false)}
                    onClick={handleUploadClick}
                  >
                    <Upload
                      className={`w-10 h-10 mx-auto mb-3 transition-all duration-300 ${
                        isDragOver ? "text-red-400 scale-110" : "text-white/60 group-hover:text-red-400"
                      }`}
                    />
                    <p className="text-white text-base font-medium mb-1">
                      {isDragOver ? "Drop your file here" : "Click or drag to upload"}
                    </p>
                    <p className="text-white/50 text-xs">Supports video and audio files</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Supported Formats */}
                  <div className="text-white/50 text-xs">
                    <p>Supported: MP4, MOV, AVI, MP3, WAV, M4A</p>
                  </div>
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
                  <p className="text-white/50 text-sm">
                    Detecting language and translating to {languages.find(lang => lang.code === targetLanguage)?.name || "selected language"}...
                  </p>
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