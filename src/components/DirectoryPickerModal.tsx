"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { ChevronUp, Folder, FolderOpen, File, X } from "lucide-react"

export function DirectoryPickerModal() {
  const explorerOpen = usePaneStore((state) => state.explorerOpen)
  const explorerCurrentPath = usePaneStore((state) => state.explorerCurrentPath)
  const explorerContents = usePaneStore((state) => state.explorerContents)
  const closeExplorer = usePaneStore((state) => state.closeExplorer)
  const fetchDirectory = usePaneStore((state) => state.fetchDirectory)
  const spawnAtDirectory = usePaneStore((state) => state.spawnAtDirectory)

  if (!explorerOpen) return null

  const handleGoUp = () => {
    // Navigate to parent directory
    const parentPath = explorerCurrentPath.replace(/[/\\][^/\\]+$/, "")
    // On Windows, if we're at C:\, go to root drives (empty path)
    if (parentPath === explorerCurrentPath || parentPath === "") {
      fetchDirectory("") // Request drives
    } else {
      fetchDirectory(parentPath)
    }
  }

  const handleItemClick = (item: { absolute_path: string; is_dir: boolean }) => {
    if (item.is_dir) {
      fetchDirectory(item.absolute_path)
    }
  }

  const handleSpawnHere = () => {
    if (explorerCurrentPath) {
      spawnAtDirectory(explorerCurrentPath)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex h-[70vh] w-[600px] flex-col rounded-2xl bg-[#161616] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333333] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoUp}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#27272A] text-[#CCCCCC] hover:bg-[#333333] transition-colors"
              title="Go up"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-xs text-[#808080]">Select folder</span>
              <span className="max-w-[400px] truncate text-sm text-[#CCCCCC] font-mono">
                {explorerCurrentPath || "Drives"}
              </span>
            </div>
          </div>
          <button
            onClick={closeExplorer}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - File List */}
        <div className="flex-1 overflow-y-auto p-2">
          {explorerContents.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[#808080]">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No items found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {explorerContents.map((item) => (
                <button
                  key={item.absolute_path}
                  onClick={() => handleItemClick(item)}
                  disabled={!item.is_dir}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    item.is_dir
                      ? "text-[#CCCCCC] hover:bg-[#27272A] cursor-pointer"
                      : "text-[#606060] cursor-default"
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
            onClick={closeExplorer}
            className="rounded-lg bg-[#27272A] px-4 py-2 text-sm text-[#CCCCCC] hover:bg-[#333333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSpawnHere}
            disabled={!explorerCurrentPath}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Spawn Terminal Here
          </button>
        </div>
      </div>
    </div>
  )
}
