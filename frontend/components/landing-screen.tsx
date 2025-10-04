"use client"

import { useEffect, useState } from "react"

interface LandingScreenProps {
  onComplete: () => void
}

export function LandingScreen({ onComplete }: LandingScreenProps) {
  const [textLoaded, setTextLoaded] = useState(false)
  const [showMotto, setShowMotto] = useState(false)

  useEffect(() => {
    const textTimer = setTimeout(() => {
      setTextLoaded(true)
    }, 800) // Background and text animation

    const mottoTimer = setTimeout(() => {
      setShowMotto(true)
    }, 2500) // Motto appears after text settles

    const transitionTimer = setTimeout(() => {
      onComplete()
    }, 5000) // Auto transition

    return () => {
      clearTimeout(textTimer)
      clearTimeout(mottoTimer)
      clearTimeout(transitionTimer)
    }
  }, [onComplete])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black animate-fade-in px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(255,0,0,0.05)_49%,rgba(255,0,0,0.05)_51%,transparent_52%)] bg-[length:20px_20px]"></div>
      </div>

      <div className="text-center relative z-10">
        <div className="mb-8 relative">
          {/* Placeholder for custom transparent font - user will upload later */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 border-2 border-dashed border-red-500/30 rounded-lg flex items-center justify-center">
              <span className="text-red-500/50 text-sm font-medium">Custom Font Placeholder</span>
            </div>
          </div>

          {/* Fallback text version */}
          <h1
            className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-bold text-red-500 transition-all duration-1500 ease-out relative z-10 ${
              textLoaded ? "opacity-100 scale-100 blur-0 translate-y-0" : "opacity-0 scale-75 blur-sm translate-y-8"
            }`}
            style={{
              fontFamily: "serif",
              textShadow: "0 0 30px rgba(255, 0, 0, 0.5), 0 0 60px rgba(255, 0, 0, 0.3)",
              filter: "drop-shadow(0 12px 48px rgba(255, 0, 0, 0.4))",
            }}
          >
            अनुवाद्य
          </h1>
        </div>

        <div
          className={`transition-all duration-1000 ease-out ${
            showMotto ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-montserrat font-semibold text-red-400 tracking-wide leading-relaxed">
            Break language barriers, with style.
          </p>
        </div>
      </div>

      {/* Subtle animated elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500/20 rounded-full animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-500/30 rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-red-500/25 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </div>
  )
}
