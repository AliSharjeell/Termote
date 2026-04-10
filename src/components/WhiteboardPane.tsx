"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useEffect, useRef, useState, useCallback } from "react"

interface WhiteboardPaneProps {
  pane: Pane
}

const WB_KEY = (id: string) => `wb-${id}`

interface WbPath {
  points: { x: number; y: number }[]
  color: string
  width: number
}

interface WbContent {
  paths: WbPath[]
  bgColor: string
}

function loadWb(id: string): WbContent {
  try {
    const raw = localStorage.getItem(WB_KEY(id))
    return raw ? JSON.parse(raw) : { paths: [], bgColor: "#1a1a1a" }
  } catch {
    return { paths: [], bgColor: "#1a1a1a" }
  }
}

function saveWb(id: string, content: WbContent) {
  try {
    localStorage.setItem(WB_KEY(id), JSON.stringify(content))
  } catch {}
}

type Tool = "pen" | "eraser"

export function WhiteboardPane({ pane }: WhiteboardPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const [content, setContent] = useState<WbContent>(() => loadWb(pane.id))
  const [tool, setTool] = useState<Tool>("pen")
  const [penColor, setPenColor] = useState("#ffffff")
  const [penWidth, setPenWidth] = useState(3)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const currentPathRef = useRef<{ x: number; y: number }[]>([])
  const contentRef = useRef(content)

  // Keep contentRef in sync
  useEffect(() => {
    contentRef.current = content
  }, [content])

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  const drawPaths = useCallback((ctx: CanvasRenderingContext2D, paths: WbPath[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = contentRef.current.bgColor
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    for (const p of paths) {
      if (p.points.length < 2) continue
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(p.points[0].x, p.points[0].y)
      for (let i = 1; i < p.points.length; i++) {
        ctx.lineTo(p.points[i].x, p.points[i].y)
      }
      ctx.stroke()
    }
  }, [])

  // Draw content on mount and when content changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    drawPaths(ctx, content.paths)
  }, [content, drawPaths])

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const resize = () => {
      const { width, height } = parent.getBoundingClientRect()
      canvas.width = Math.max(width, 100)
      canvas.height = Math.max(height, 100)
      const ctx = canvas.getContext("2d")
      if (ctx) drawPaths(ctx, contentRef.current.paths)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [drawPaths])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true
    currentPathRef.current = [getPos(e)]
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const pos = getPos(e)
    currentPathRef.current.push(pos)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pts = currentPathRef.current
    if (pts.length < 2) return
    ctx.strokeStyle = tool === "eraser" ? contentRef.current.bgColor : penColor
    ctx.lineWidth = tool === "eraser" ? penWidth * 4 : penWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
    ctx.stroke()
  }

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const pts = currentPathRef.current
    if (pts.length < 2) return

    const newPath: WbPath = {
      points: pts,
      color: tool === "eraser" ? contentRef.current.bgColor : penColor,
      width: tool === "eraser" ? penWidth * 4 : penWidth,
    }
    const newContent = { ...contentRef.current, paths: [...contentRef.current.paths, newPath] }
    setContent(newContent)
    saveWb(pane.id, newContent)
    currentPathRef.current = []
  }

  const clearBoard = () => {
    const newContent = { ...contentRef.current, paths: [] }
    setContent(newContent)
    saveWb(pane.id, newContent)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = newContent.bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const undo = () => {
    if (contentRef.current.paths.length === 0) return
    const newContent = { ...contentRef.current, paths: contentRef.current.paths.slice(0, -1) }
    setContent(newContent)
    saveWb(pane.id, newContent)
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
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-[#252525] bg-[#111]">
        <button
          onClick={() => setTool("pen")}
          className={`px-2 py-1 text-xs rounded ${tool === "pen" ? "bg-[#333] text-white" : "text-[#888] hover:text-white"}`}
          title="Pen"
        >
          Pen
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`px-2 py-1 text-xs rounded ${tool === "eraser" ? "bg-[#333] text-white" : "text-[#888] hover:text-white"}`}
          title="Eraser"
        >
          Eraser
        </button>
        <div className="w-px h-4 bg-[#252525]" />
        <input
          type="color"
          value={penColor}
          onChange={(e) => setPenColor(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer"
          title="Pen color"
        />
        <span className="text-[10px] text-[#666]">Size</span>
        <input
          type="range"
          min="1"
          max="20"
          value={penWidth}
          onChange={(e) => setPenWidth(Number(e.target.value))}
          className="w-16"
        />
        <div className="w-px h-4 bg-[#252525]" />
        <button
          onClick={undo}
          className="px-2 py-1 text-xs text-[#888] hover:text-white rounded"
          title="Undo"
        >
          Undo
        </button>
        <button
          onClick={clearBoard}
          className="px-2 py-1 text-xs text-[#888] hover:text-white rounded"
          title="Clear"
        >
          Clear
        </button>
      </div>
      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-t border-[#252525] bg-[#0d0d0d]">
        <span className="text-[10px] text-[#555]">Whiteboard</span>
        <span className="ml-auto text-[10px] text-[#555]">Auto-saved</span>
      </div>
    </div>
  )
}
