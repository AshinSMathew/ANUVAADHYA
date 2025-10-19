"use client"

import { usePathname } from "next/navigation"
import SophisticatedDomeGallery from "@/components/sophisticated-dome-gallery"

export default function ClientBackground({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isMainPage = pathname === "/"

  return (
    <>
      {children}
      {!isMainPage && (
        <div className="absolute inset-0 w-full h-full">
          <SophisticatedDomeGallery
            overlayBlurColor="#000000"
            grayscale={true}
            imageBorderRadius="8px"
            fit={0.8}
          />
        </div>
      )}
    </>
  )
}