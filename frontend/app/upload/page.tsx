"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CinemaDome } from "@/components/cinema-dome"

type AppState = "gallery" | "processing" | "complete"

export default function Home() {
  const router = useRouter()
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
      console.log("target: ", targetLanguage)

      // Add timeout to the request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes timeout

      const response = await fetch("http://localhost:8000/generate-subtitles", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP error! status: ${response.status}`
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.detail || errorMessage
        } catch {
          errorMessage += `, details: ${errorText}`
        }
        
        throw new Error(errorMessage)
      }

      const subtitleText = await response.text()
      
      // Validate that we received actual subtitle content
      if (!subtitleText || subtitleText.trim().length === 0) {
        throw new Error("No subtitle content received from server")
      }

      setSubtitleData(subtitleText)
      setAppState("complete")

      // Store data for video player page
      if (typeof window !== 'undefined') {
        const videoURL = URL.createObjectURL(file)
        const playerData = {
          videoURL,
          videoName: file.name,
          subtitleData: subtitleText,
          targetLanguage
        }
        sessionStorage.setItem('playerData', JSON.stringify(playerData))
      }

      // Redirect to video player after a short delay
      setTimeout(() => {
        router.push('/player')
      }, 1500)
    } catch (error) {
      console.error("Error generating subtitles:", error)
      
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try with a shorter video or check your connection.'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(`Error generating subtitles: ${errorMessage}`)
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