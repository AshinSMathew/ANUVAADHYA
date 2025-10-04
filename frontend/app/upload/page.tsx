"use client"

import { useState } from "react"
import { CinemaDome } from "@/components/cinema-dome"

type AppState = "gallery" | "processing" | "complete"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("gallery")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [subtitleData, setSubtitleData] = useState<string | null>(null)

  const handleFileUpload = async (file: File, targetLanguage: string) => {
    setUploadedFile(file)
    setAppState("processing")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("target_language", targetLanguage)
      console.log("target: ",targetLanguage)

      const response = await fetch("http://localhost:8000/generate-subtitles", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`)
      }

      const subtitleText = await response.text()
      setSubtitleData(subtitleText)
      setAppState("complete")
    } catch (error) {
      console.error("Error generating subtitles:", error)
      alert(`Error generating subtitles: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setAppState("gallery")
    }
  }

  const handleDownload = () => {
    if (subtitleData) {
      const blob = new Blob([subtitleData], { type: "application/x-subrip" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${uploadedFile?.name.split('.')[0] || "subtitles"}.srt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    // Reset to gallery
    setTimeout(() => {
      setAppState("gallery")
      setUploadedFile(null)
      setSubtitleData(null)
    }, 1000)
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <CinemaDome
        onFileUpload={handleFileUpload}
        onDownload={handleDownload}
        isProcessing={appState === "processing"}
        isComplete={appState === "complete"}
      />
    </main>
  )
}