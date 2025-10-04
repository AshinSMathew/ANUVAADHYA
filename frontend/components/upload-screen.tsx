"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { FileAudio, FileVideo, Upload } from "lucide-react"

interface UploadScreenProps {
  onFileUpload: (file: File) => void
}

export function UploadScreen({ onFileUpload }: UploadScreenProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0])
      }
    },
    [onFileUpload],
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
      "video/*": [".mp4", ".mov", ".avi"],
    },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#FFF7E6" }}>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4" style={{ color: "#C01919" }}>
          Upload Your Media
        </h1>
        <p className="text-lg text-gray-600 font-sans">Drop your audio or video file to get started</p>
      </div>

      <div
        className={`glassmorphic-card w-full max-w-2xl p-12 transition-all duration-500 cursor-pointer relative overflow-hidden ${
          isDragActive ? "scale-105 animate-glassmorphic-glow" : "hover:scale-102"
        }`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />

        <div className="flex justify-center mb-8">
          <div
            className={`p-6 rounded-full transition-all duration-300 ${
              isDragActive ? "animate-glassmorphic-glow scale-110" : "hover:scale-110"
            }`}
            style={{ backgroundColor: "rgba(192, 25, 25, 0.1)" }}
          >
            <Upload className="w-16 h-16" style={{ color: "#C01919" }} />
          </div>
        </div>

        <div className="space-y-4 text-center">
          <h3 className="text-2xl font-serif font-medium text-gray-800">
            {isDragActive ? "Drop your file here" : "Drag & drop your media"}
          </h3>
          <p className="text-gray-600 text-lg font-sans">or click to browse files</p>
        </div>

        <div className="flex justify-center gap-8 mt-8">
          <div className="flex items-center gap-2 text-gray-600">
            <FileAudio className="w-5 h-5" style={{ color: "#C01919" }} />
            <span className="font-sans">Audio Files</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <FileVideo className="w-5 h-5" style={{ color: "#C01919" }} />
            <span className="font-sans">Video Files</span>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            className="font-serif font-semibold px-12 py-4 text-lg transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: "#C01919",
              color: "#FFF7E6",
              border: "none",
            }}
          >
            Browse Files
          </Button>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        {[
          {
            title: "Fast Processing",
            description: "Quick and efficient subtitle generation",
          },
          {
            title: "High Accuracy",
            description: "Precise transcription and translation",
          },
          {
            title: "Multiple Formats",
            description: "Support for various audio and video files",
          },
        ].map((feature, index) => (
          <div
            key={index}
            className="glassmorphic-card p-6 text-center hover:scale-105 transition-transform duration-300"
          >
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "rgba(192, 25, 25, 0.1)" }}
            >
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: "#C01919" }} />
            </div>
            <h4 className="font-serif font-medium text-gray-800 mb-2">{feature.title}</h4>
            <p className="text-sm text-gray-600 font-sans">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
