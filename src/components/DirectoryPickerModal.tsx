"use client"

import { useState } from "react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { ChevronUp, Folder, FolderOpen, File, X, Search } from "lucide-react"

export function DirectoryPickerModal() {
  const [searchQuery, setSearchQuery] = useState("")
  const explorerOpen = usePaneStore((state) => state.explorerOpen)
  const imagePickerOpen = usePaneStore((state) => state.imagePickerOpen)
  const explorerCurrentPath = usePaneStore((state) => state.explorerCurrentPath)
  const explorerContents = usePaneStore((state) => state.explorerContents)
  const closeExplorer = usePaneStore((state) => state.closeExplorer)
  const closeImagePicker = usePaneStore((state) => state.closeImagePicker)
  const fetchDirectory = usePaneStore((state) => state.fetchDirectory)
  const spawnAtDirectory = usePaneStore((state) => state.spawnAtDirectory)
  const readImageFile = usePaneStore((state) => state.readImageFile)

  const isImagePickerMode = imagePickerOpen

  const breadcrumbs = (() => {
    if (!explorerCurrentPath) return []
    const sep = explorerCurrentPath.includes("\\") ? "\\" : "/"
    const segments = explorerCurrentPath.split(/[/\\]/).filter(Boolean)
    const crumbs: { name: string; path: string }[] = []
    let cumulative = ""
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      cumulative = i === 0 ? segment : cumulative + sep + segment
      crumbs.push({ name: segment, path: cumulative })
    }
    return crumbs
  })()

  const filteredContents = (() => {
    let items = isImagePickerMode
      ? explorerContents.filter((item) =>
          item.is_dir || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(item.name)
        )
      : explorerContents

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      items = items.filter((item) => item.name.toLowerCase().includes(q))
    }

    return items
  })()

  if (!explorerOpen) return null

  const handleGoUp = () => {
    // Navigate to parent directory
    const parentPath = explorerCurrentPath.replace(/[/\\][^/\\]+$/, "")
    // On Windows, if we're at root or empty, go to root drives (empty path)
    if (parentPath === explorerCurrentPath || parentPath === "") {
      fetchDirectory("") // Request drives
    } else {
      fetchDirectory(parentPath)
    }
  }

  const handleItemClick = (item: { absolute_path: string; is_dir: boolean }) => {
    if (isImagePickerMode) {
      if (item.is_dir) {
        fetchDirectory(item.absolute_path)
      } else {
        // Read the image file directly
        readImageFile(item.absolute_path)
        closeImagePicker()
      }
    } else if (item.is_dir) {
      fetchDirectory(item.absolute_path)
    }
  }

  const handleSpawnHere = () => {
    if (explorerCurrentPath) {
      spawnAtDirectory(explorerCurrentPath)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70">
      <div className="flex h-[70vh] w-[600px] flex-col rounded-2xl bg-[#161616] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[#333333] px-4 py-3">
          {/* Row 1: Go Up + Title + Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoUp}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#27272A] text-[#CCCCCC] hover:bg-[#333333] transition-colors"
                title="Go up"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <span className="text-xs text-[#808080]">{isImagePickerMode ? "Select image" : "Select folder"}</span>
            </div>
            <button
              onClick={closeExplorer}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Row 2: Breadcrumbs */}
          <div className="flex max-w-full flex-wrap items-center gap-x-0.5 gap-y-0.5 text-sm font-mono">
            {breadcrumbs.length === 0 ? (
              <span className="text-[#CCCCCC]">Drives</span>
            ) : (
              breadcrumbs.map((crumb, i, arr) => (
                <div key={crumb.path} className="flex items-center">
                  {i > 0 && <span className="px-1 text-[#808080]">/</span>}
                  <button
                    onClick={() => fetchDirectory(crumb.path)}
                    title={crumb.path}
                    className={`max-w-[160px] truncate rounded px-1.5 py-0.5 transition-colors hover:bg-[#27272A] hover:text-white ${
                      i === arr.length - 1 ? "text-white" : "text-[#CCCCCC]"
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Row 3: Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-[#808080] pointer-events-none" />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-full bg-[#27272A] pl-9 pr-3 text-sm text-white placeholder-[#808080] outline-none focus:ring-1 focus:ring-[#52525B]"
            />
          </div>
        </div>

        {/* Body - File List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredContents.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[#808080]">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No items found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredContents.map((item) => (
                <button
                  key={item.absolute_path}
                  onClick={() => handleItemClick(item)}
                  disabled={!isImagePickerMode && !item.is_dir}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    item.is_dir
                      ? "text-[#CCCCCC] hover:bg-[#27272A] cursor-pointer"
                      : /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(item.name)
                        ? "text-[#CCCCCC] hover:bg-[#27272A] cursor-pointer"
                        : "text-[#606060] cursor-default opacity-40"
                  }`}
                >
                  {item.is_dir ? (
                    <Folder className="h-5 w-5 shrink-0 text-[#F0C674]" />
                  ) : (
                    <File className="h-5 w-5 shrink-0 text-[#606060]" />
                  )}
                  <span className="truncate text-sm">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#333333] px-4 py-3">
          <button
            onClick={isImagePickerMode ? closeImagePicker : closeExplorer}
            className="rounded-lg bg-[#27272A] px-4 py-2 text-sm text-[#CCCCCC] hover:bg-[#333333] transition-colors"
          >
            {isImagePickerMode ? "Done" : "Cancel"}
          </button>
          {!isImagePickerMode && (
            <button
              onClick={handleSpawnHere}
              disabled={!explorerCurrentPath}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Spawn Terminal Here
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
