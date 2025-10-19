import type React from "react"
import { Inter, Montserrat } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import ClientBackground from "@/components/ClientBackground"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata = {
  title: "अनुवाद्य - Subtitle Generation in Rhythm",
  description: "Break language barriers, with style.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} antialiased`}>
      <body className="font-inter bg-black text-white overflow-x-hidden">
        <AuthProvider>
          <ClientBackground>{children}</ClientBackground>
        </AuthProvider>
      </body>
    </html>
  )
}
