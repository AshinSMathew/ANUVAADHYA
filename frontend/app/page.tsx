"use client"

import { useState } from "react"
import { LandingScreen } from "@/components/landing-screen"
import { CinemaDome } from "@/components/cinema-dome"

type AppState = "landing" | "gallery" | "processing" | "complete"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleLandingComplete = () => {
    setAppState("gallery")
  }

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setAppState("processing")

    // Simulate processing completion
    setTimeout(() => {
      setAppState("complete")
    }, 3000)
  }

  const handleDownload = () => {
    // Simulate download
    const link = document.createElement("a")
    link.href = "/placeholder.srt"
    link.download = `${uploadedFile?.name || "subtitles"}.srt`
    link.click()

    // Reset to gallery
    setTimeout(() => {
      setAppState("gallery")
      setUploadedFile(null)
    }, 1000)
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {appState === "landing" && <LandingScreen onComplete={handleLandingComplete} />}
      {(appState === "gallery" || appState === "processing" || appState === "complete") && (
        <CinemaDome
          onFileUpload={handleFileUpload}
          onDownload={handleDownload}
          isProcessing={appState === "processing"}
          isComplete={appState === "complete"}
        />
      )}
    </main>
  )
}
