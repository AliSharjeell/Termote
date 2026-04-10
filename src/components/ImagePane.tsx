"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useState, useEffect, useRef } from "react"

interface ImagePaneProps {
  pane: Pane
}

const IMAGE_KEY = (id: string) => `image-${id}`

interface ImageContent {
  url: string
}

function loadImageContent(id: string): ImageContent {
  try {
    const raw = localStorage.getItem(IMAGE_KEY(id))
    return raw ? JSON.parse(raw) : { url: "" }
  } catch {
    return { url: "" }
  }
}

function saveImageContent(id: string, content: ImageContent) {
  try {
    localStorage.setItem(IMAGE_KEY(id), JSON.stringify(content))
  } catch {}
}

export function ImagePane({ pane }: ImagePaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const [url, setUrl] = useState<ImageContent>(() => loadImageContent(pane.id))
  const [inputUrl, setInputUrl] = useState(url.url)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  const loadImage = () => {
    if (!inputUrl.trim()) return
    setError(null)
    setLoading(true)
    saveImageContent(pane.id, { url: inputUrl.trim() })
    setUrl({ url: inputUrl.trim() })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") loadImage()
  }

  const handleImageLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleImageError = () => {
    setLoading(false)
    setError("Failed to load image")
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <PaneTitleBar
        title={pane.name}
        paneId={pane.id}
        pinned={pane.pinned}
        groupId={pane.groupId}
        onClose={() => killPane(pane.id)}
        onRename={handleRename}
        onPin={() => togglePin(pane.id)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* URL input bar */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[#252525] bg-[#111]">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter image URL and press Enter..."
            className="flex-1 bg-[#1a1a1a] text-white text-xs px-3 py-1.5 rounded outline-none border border-[#252525] focus:border-[#444]"
          />
          <button
            onClick={loadImage}
            className="shrink-0 px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-white text-xs rounded"
          >
            Load
          </button>
        </div>

        {/* Image display area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          {url.url ? (
            loading ? (
              <div className="text-[#666] text-sm">Loading...</div>
            ) : error ? (
              <div className="text-center">
                <p className="text-[#E44] text-sm mb-2">{error}</p>
                <p className="text-[#666] text-xs">Check the URL and try again</p>
              </div>
            ) : (
              <img
                ref={imgRef}
                src={url.url}
                alt={pane.name}
                className="max-w-full max-h-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )
          ) : (
            <div className="text-center text-[#555]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 opacity-40">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="text-sm">Enter an image URL above</p>
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-t border-[#252525] bg-[#0d0d0d]">
        <span className="text-[10px] text-[#555]">Image Pane</span>
        {url.url && <span className="ml-auto text-[10px] text-[#555]">Saved</span>}
      </div>
    </div>
  )
}
