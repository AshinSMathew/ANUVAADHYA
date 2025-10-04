"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { FileAudio, FileVideo, Upload, Languages } from "lucide-react"

interface UploadScreenProps {
  onFileUpload: (file: File, translateTo: string, targetLanguage: string) => void
}

export function UploadScreen({ onFileUpload }: UploadScreenProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [translateTo, setTranslateTo] = useState("none")
  const [targetLanguage, setTargetLanguage] = useState("en")

  const languages = [
    { code: "none", name: "No Translation (Original Language)" },
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
    { code: "wa", name: "Welsh" },
    { code: "gd", name: "Scottish Gaelic" },
  ]

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0], translateTo, targetLanguage)
      }
    },
    [onFileUpload, translateTo, targetLanguage],
  )

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg"],
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv"],
    },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  })

  const handleBrowseClick = () => {
    open()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#FFF7E6" }}>
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4" style={{ color: "#C01919" }}>
          Upload Your Media
        </h1>
        <p className="text-lg text-gray-600 font-sans">Drop your audio or video file to get started</p>
      </div>

      <div className="w-full max-w-2xl mb-8">
        <div className="glassmorphic-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Languages className="w-5 h-5" style={{ color: "#C01919" }} />
            <h3 className="text-lg font-serif font-medium text-gray-800">Translation Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                Translation Option
              </label>
              <select
                value={translateTo}
                onChange={(e) => setTranslateTo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors font-sans"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
              >
                <option value="none">No Translation (Keep Original Language)</option>
                <option value="en">Translate to English</option>
                <option value="target">Translate to Specific Language</option>
              </select>
            </div>

            {translateTo === "target" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                  Target Language
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors font-sans"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                >
                  {languages
                    .filter(lang => lang.code !== "none")
                    .map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>
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
            onClick={handleBrowseClick}
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

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
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
            title: "Multiple Languages",
            description: "Support for 50+ languages including all Indian languages",
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