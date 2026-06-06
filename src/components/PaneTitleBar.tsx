"use client"

import { useState, useRef, useEffect } from "react"
import { Pencil, Pin, PinOff, FolderInput, X, Plus, Bot, Copy } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { useIsTauri } from "@/hooks/useIsTauri"
import { isNotificationActivityStatus } from "@/lib/activityStatus"

interface PaneTitleBarProps {
  title: string
  paneId: string
  pinned?: boolean
  groupId?: string | null
  onRename: (newTitle: string) => void
  onClose: () => void
  onPin?: () => void
  onDuplicate?: () => void
  onLaunchAI?: () => void
  actions?: React.ReactNode
}

export function PaneTitleBar({ title, paneId, pinned, groupId, onRename, onClose, onPin, onDuplicate, onLaunchAI, actions }: PaneTitleBarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const [showGroupMenu, setShowGroupMenu] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const groupMenuRef = useRef<HTMLDivElement>(null)
  const newGroupInputRef = useRef<HTMLInputElement>(null)
  const { groups, setPaneGroup, createGroup, paneActivities } = usePaneStore()
  const { isTauri: isTauriApp } = useIsTauri()
  const hasNotification = isNotificationActivityStatus(paneActivities[paneId])

  useEffect(() => {
    if (isCreatingGroup && newGroupInputRef.current) {
      newGroupInputRef.current.focus()
    }
  }, [isCreatingGroup])

  useEffect(() => {
    setEditValue(title)
  }, [title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Close group menu on outside click
  useEffect(() => {
    if (!showGroupMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target as Node)) {
        setShowGroupMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showGroupMenu])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleSubmit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== title) {
      onRename(trimmed)
    } else {
      setEditValue(title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    } else if (e.key === "Escape") {
      setEditValue(title)
      setIsEditing(false)
    }
  }

  return (
    <div className={`flex ${isTauriApp ? 'h-8' : 'h-11'} items-center justify-between ${hasNotification ? 'bg-blue-500' : 'bg-[#161616]'} px-2 transition-colors`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Close button */}
        <button
          onClick={onClose}
          className={`flex ${isTauriApp ? 'h-6 w-6 text-sm' : 'h-8 w-8 text-base'} items-center justify-center rounded-full bg-[#27272A] hover:bg-[#333333] shrink-0`}
          title="Close terminal"
        >
          <span className="text-white font-bold leading-none">×</span>
        </button>

        {/* Rename button */}
        <button
          onClick={handleDoubleClick}
          className={`flex ${isTauriApp ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center rounded-full bg-[#27272A] hover:bg-[#333333] shrink-0`}
          title="Rename terminal"
        >
          <Pencil className={`${isTauriApp ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
        </button>

        {/* Duplicate button */}
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className={`flex ${isTauriApp ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center rounded-full bg-[#27272A] hover:bg-[#333333] shrink-0`}
            title="Duplicate terminal"
          >
            <Copy className={`${isTauriApp ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-white`} />
          </button>
        )}

        {/* Pin button */}
        {onPin && (
          <button
            onClick={onPin}
            className={`flex ${isTauriApp ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center rounded-full bg-[#27272A] hover:bg-[#333333] shrink-0`}
            title={pinned ? "Unpin terminal" : "Pin terminal"}
          >
            {pinned ? (
              <PinOff className={`${isTauriApp ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-white`} />
            ) : (
              <Pin className={`${isTauriApp ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-white`} />
            )}
          </button>
        )}

        {/* Group button */}
        <div className="relative" ref={groupMenuRef}>
          <button
            onClick={() => setShowGroupMenu(!showGroupMenu)}
            className={`flex ${isTauriApp ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center rounded-full bg-[#27272A] hover:bg-[#333333] shrink-0`}
            title="Add to group"
          >
            <FolderInput className={`${isTauriApp ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
          </button>
          {showGroupMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-lg bg-[#27272A] border border-[#3B3B3B] py-1 shadow-lg z-50">
              {isCreatingGroup ? (
                <div className="flex flex-col gap-1 px-2 py-1.5">
                  <input
                    ref={newGroupInputRef}
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newGroupName.trim()) {
                        const newGroupId = createGroup(newGroupName.trim())
                        setPaneGroup(paneId, newGroupId)
                        setNewGroupName("")
                        setIsCreatingGroup(false)
                        setShowGroupMenu(false)
                      }
                      if (e.key === "Escape") {
                        setIsCreatingGroup(false)
                        setNewGroupName("")
                      }
                    }}
                    placeholder="Group name"
                    className="w-full bg-[#0C0C0C] px-2 py-1 text-xs text-[#CCCCCC] outline-none focus:outline-none border border-white rounded"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        if (newGroupName.trim()) {
                          const newGroupId = createGroup(newGroupName.trim())
                          setPaneGroup(paneId, newGroupId)
                          setNewGroupName("")
                          setIsCreatingGroup(false)
                          setShowGroupMenu(false)
                        }
                      }}
                      className="flex-1 bg-white hover:bg-gray-200 text-black text-xs py-1 rounded"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingGroup(false)
                        setNewGroupName("")
                      }}
                      className="flex-1 bg-[#27272A] hover:bg-[#333333] text-[#CCCCCC] text-xs py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {groups.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] text-[#808080] uppercase tracking-wider">
                        Move to group
                      </div>
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            setPaneGroup(paneId, group.id)
                            setShowGroupMenu(false)
                          }}
                          className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs hover:bg-[#333333] ${
                            groupId === group.id ? "text-white" : "text-[#CCCCCC]"
                          }`}
                        >
                          <span className="flex-1 text-left">{group.name}</span>
                          {groupId === group.id && (
                            <span className="text-[10px] text-[#808080]">current</span>
                          )}
                        </button>
                      ))}
                      <div className="my-1 border-t border-[#3B3B3B]" />
                    </>
                  )}
                  {groupId && (
                    <button
                      onClick={() => {
                        setPaneGroup(paneId, null)
                        setShowGroupMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-[#CCCCCC] hover:bg-[#333333]"
                    >
                      <X className="h-3 w-3" />
                      <span>Remove from group</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsCreatingGroup(true)}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-[#CCCCCC] hover:bg-[#333333]"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Group</span>
                  </button>
                  {groups.length === 0 && (
                    <div className="px-2 py-2 text-xs text-[#808080] text-center">
                      No groups yet
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* AI Launch button */}
        {onLaunchAI && (
          <button
            onClick={onLaunchAI}
            className={`flex ${isTauriApp ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center rounded-full bg-[#27272A] hover:bg-[#333333] shrink-0 transition-colors`}
            title="Launch AI CLI"
          >
            <Bot className={`${isTauriApp ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
          </button>
        )}

        {/* Title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-[#0C0C0C] px-1 py-0 text-xs text-[#CCCCCC] outline-none focus:outline-none border border-white rounded"
          />
        ) : (
          <span
            className="cursor-pointer truncate text-xs text-[#CCCCCC] hover:text-white"
            title="Click rename button to edit"
          >
            {title}
          </span>
        )}
      </div>

      {/* Custom actions (e.g., Preview button) */}
      {actions && (
        <div className="flex items-center gap-1 mr-2">
          {actions}
        </div>
      )}
    </div>
  )
}
