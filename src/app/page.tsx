'use client'

import { useEffect } from 'react'
import { detectTauri } from '@/lib/tauriDetect'

export default function Home() {
  const isTauri = detectTauri()

  useEffect(() => {
    if (isTauri) {
      // In Tauri, redirect to dashboard
      window.location.href = '/dashboard'
    }
  }, [isTauri])

  // In browser, show landing page
  if (!isTauri) {
    return <LandingPage />
  }

  // Tauri loads dashboard directly
  return null
}

// Landing page component
function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <p className="text-gray-400">Loading Termote...</p>
    </div>
  )
}