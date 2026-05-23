"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"

interface ImagePaneProps {
  pane: Pane
}

const IMAGE_KEY = (id: string) => `image-${id}-data`

interface ImageContent {
  dataUrl: string
  name: string
}

function loadImageContent(id: string): ImageContent | null {
  try {
    const raw = localStorage.getItem(IMAGE_KEY(id))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function parseImageContent(raw: string | null | undefined): ImageContent | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.dataUrl === "string") {
      return {
        dataUrl: parsed.dataUrl,
        name: typeof parsed.name === "string" ? parsed.name : "Image",
      }
    }
    if (typeof parsed === "string") {
      return { dataUrl: parsed, name: "Image" }
    }
  } catch {
    return { dataUrl: raw, name: "Image" }
  }
  return null
}

function saveImageContent(id: string, content: ImageContent) {
  try {
    localStorage.setItem(IMAGE_KEY(id), JSON.stringify(content))
  } catch {}
}

function clearImageContent(id: string) {
  try {
    localStorage.removeItem(IMAGE_KEY(id))
  } catch {}
}

export function ImagePane({ pane }: ImagePaneProps) {
  const { killPane, renamePane, togglePin, openImagePicker, updatePaneContent } = usePaneStore()
  const lastAppliedImageDataRef = useRef<string | null>(pane.imageData ?? null)
  // Initialize from pane.imageData (backend) first, then localStorage fallback
  const [content, setContent] = useState<ImageContent | null>(() => {
    return parseImageContent(pane.imageData) ?? loadImageContent(pane.id)
  })
  const remoteImageData = pane.imageData ?? null
  const remoteContent = useMemo(() => parseImageContent(remoteImageData), [remoteImageData])
  const displayedContent = remoteImageData !== null ? remoteContent : content
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const incoming = pane.imageData ?? null
    if (incoming === lastAppliedImageDataRef.current) return

    lastAppliedImageDataRef.current = incoming
    const nextContent = parseImageContent(incoming)

    if (nextContent) {
      saveImageContent(pane.id, nextContent)
    } else {
      clearImageContent(pane.id)
    }
  }, [pane.id, pane.imageData])

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported")
      return
    }
    setIsLoading(true)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const newContent: ImageContent = { dataUrl, name: file.name }
      const data = JSON.stringify(newContent)
      lastAppliedImageDataRef.current = data
      saveImageContent(pane.id, newContent)
      setContent(newContent)
      setIsLoading(false)
      // Push to backend for persistence and sync
      updatePaneContent(pane.id, undefined, undefined, data)
    }
    reader.onerror = () => {
      setError("Failed to read file")
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
  }, [pane.id, updatePaneContent])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) processFile(file)
        return
      }
    }
  }, [processFile])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.target === dropRef.current) setIsDragging(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const clearImage = () => {
    lastAppliedImageDataRef.current = ""
    clearImageContent(pane.id)
    setContent(null)
    setError(null)
    updatePaneContent(pane.id, undefined, undefined, "")
  }

  return (
    <div
      className="flex flex-col h-full bg-[#0C0C0C]"
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <PaneTitleBar
        title={pane.name}
        paneId={pane.id}
        pinned={pane.pinned}
        groupId={pane.groupId}
        onClose={() => killPane(pane.id)}
        onRename={handleRename}
        onPin={() => togglePin(pane.id)}
      />

      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[#252525] bg-[#111]">
        <button
          onClick={() => openImagePicker(pane.id)}
          className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-white text-xs rounded flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Open Folder
        </button>
        <button
          onClick={clearImage}
          className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-white text-xs rounded"
        >
          Clear
        </button>
        <span className="ml-auto text-[10px] text-[#555]">Paste (Ctrl+V) · Drag & Drop</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Image display area */}
      <div className="flex-1 overflow-hidden relative">
        {displayedContent?.dataUrl ? (
          <div className="w-full h-full flex flex-col">
            <div className="shrink-0 px-3 py-1.5 border-b border-[#252525] bg-[#111] flex items-center gap-2">
              <span className="text-[10px] text-[#888] truncate flex-1">{displayedContent.name}</span>
              <span className="text-[10px] text-[#555]">Auto-saved</span>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <img
                src={displayedContent.dataUrl}
                alt={pane.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full text-[#666] text-sm">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-[#E44] text-sm mb-2">{error}</p>
              <button onClick={clearImage} className="px-3 py-1 bg-[#252525] hover:bg-[#333] text-white text-xs rounded">Dismiss</button>
            </div>
          </div>
        ) : (
          <div
            ref={dropRef}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              isDragging ? "bg-[#1a2a1a] border-2 border-dashed border-[#16C60C]" : ""
            }`}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={`mb-3 ${isDragging ? "text-[#16C60C]" : "text-[#555]"}`}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-sm text-[#555] mb-1">Drag & drop an image here</p>
            <p className="text-xs text-[#444] mb-3">or paste from clipboard (Ctrl+V)</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#252525] hover:bg-[#333] text-white text-xs rounded"
            >
              Open File
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
