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
  offsetX: number
  offsetY: number
  scale: number
}

function loadWb(id: string): WbContent {
  try {
    const raw = localStorage.getItem(WB_KEY(id))
    return raw ? JSON.parse(raw) : { paths: [], bgColor: "#1a1a1a", offsetX: 0, offsetY: 0, scale: 1 }
  } catch {
    return { paths: [], bgColor: "#1a1a1a", offsetX: 0, offsetY: 0, scale: 1 }
  }
}

function saveWb(id: string, content: WbContent) {
  try {
    localStorage.setItem(WB_KEY(id), JSON.stringify(content))
  } catch {}
}

type Tool = "pen" | "eraser" | "pan"

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
  const isPanningRef = useRef(false)
  const lastPanRef = useRef({ x: 0, y: 0 })
  const contentRef2 = useRef(content)

  useEffect(() => {
    contentRef.current = content
    contentRef2.current = content
  }, [content])

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  const drawPaths = useCallback((ctx: CanvasRenderingContext2D, paths: WbPath[], offsetX: number, offsetY: number, scale: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = contentRef2.current.bgColor
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.save()
    ctx.translate(ctx.canvas.width / 2 + offsetX, ctx.canvas.height / 2 + offsetY)
    ctx.scale(scale, scale)
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2)
    for (const p of paths) {
      if (p.points.length < 2) continue
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      const firstPt = p.points[0]
      ctx.moveTo(firstPt.x + offsetX, firstPt.y + offsetY)
      for (let i = 1; i < p.points.length; i++) {
        const pt = p.points[i]
        ctx.lineTo(pt.x + offsetX, pt.y + offsetY)
      }
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const { width, height } = parent.getBoundingClientRect()
      canvas.width = Math.max(width, 100)
      canvas.height = Math.max(height, 100)
      drawPaths(ctx, contentRef2.current.paths, contentRef2.current.offsetX, contentRef2.current.offsetY, contentRef2.current.scale)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas.parentElement!)
    return () => observer.disconnect()
  }, [drawPaths])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    drawPaths(ctx, content.paths, content.offsetX, content.offsetY, content.scale)
  }, [content, drawPaths])

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const { offsetX, offsetY, scale } = contentRef2.current
    const cx = canvas.width / 2 + offsetX
    const cy = canvas.height / 2 + offsetY
    return {
      x: (e.clientX - rect.left - cx) / scale + canvas.width / 2,
      y: (e.clientY - rect.top - cy) / scale + canvas.height / 2,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "pan") {
      isPanningRef.current = true
      lastPanRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    isDrawingRef.current = true
    currentPathRef.current = [getCanvasPos(e)]
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "pan") {
      if (!isPanningRef.current) return
      const dx = e.clientX - lastPanRef.current.x
      const dy = e.clientY - lastPanRef.current.y
      lastPanRef.current = { x: e.clientX, y: e.clientY }
      const newContent = { ...contentRef2.current, offsetX: contentRef2.current.offsetX + dx, offsetY: contentRef2.current.offsetY + dy }
      setContent(newContent)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (ctx) drawPaths(ctx, newContent.paths, newContent.offsetX, newContent.offsetY, newContent.scale)
      return
    }
    if (!isDrawingRef.current) return
    const pos = getCanvasPos(e)
    currentPathRef.current.push(pos)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pts = currentPathRef.current
    if (pts.length < 2) return
    const { offsetX, offsetY, scale } = contentRef2.current
    const lastPt = pts[pts.length - 1]
    const prevPt = pts[pts.length - 2]
    ctx.strokeStyle = tool === "eraser" ? contentRef2.current.bgColor : penColor
    ctx.lineWidth = tool === "eraser" ? penWidth * 4 : penWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.save()
    ctx.translate(ctx.canvas.width / 2 + offsetX, ctx.canvas.height / 2 + offsetY)
    ctx.scale(scale, scale)
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2)
    ctx.moveTo(prevPt.x + offsetX, prevPt.y + offsetY)
    ctx.lineTo(lastPt.x + offsetX, lastPt.y + offsetY)
    ctx.stroke()
    ctx.restore()
  }

  const handleMouseUp = () => {
    if (tool === "pan") {
      isPanningRef.current = false
      return
    }
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const pts = currentPathRef.current
    if (pts.length < 2) return

    const newPath: WbPath = {
      points: pts,
      color: tool === "eraser" ? contentRef2.current.bgColor : penColor,
      width: tool === "eraser" ? penWidth * 4 : penWidth,
    }
    const newContent = { ...contentRef2.current, paths: [...contentRef2.current.paths, newPath] }
    setContent(newContent)
    saveWb(pane.id, newContent)
    currentPathRef.current = []
  }

  const clearBoard = () => {
    const newContent = { ...contentRef2.current, paths: [] }
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
    if (contentRef2.current.paths.length === 0) return
    const newContent = { ...contentRef2.current, paths: contentRef2.current.paths.slice(0, -1) }
    setContent(newContent)
    saveWb(pane.id, newContent)
  }

  const resetView = () => {
    const newContent = { ...contentRef2.current, offsetX: 0, offsetY: 0, scale: 1 }
    setContent(newContent)
    saveWb(pane.id, newContent)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) drawPaths(ctx, newContent.paths, 0, 0, 1)
  }

  const zoomIn = () => {
    const newScale = Math.min(contentRef2.current.scale * 1.2, 5)
    const newContent = { ...contentRef2.current, scale: newScale }
    setContent(newContent)
    saveWb(pane.id, newContent)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) drawPaths(ctx, newContent.paths, newContent.offsetX, newContent.offsetY, newContent.scale)
  }

  const zoomOut = () => {
    const newScale = Math.max(contentRef2.current.scale / 1.2, 0.1)
    const newContent = { ...contentRef2.current, scale: newScale }
    setContent(newContent)
    saveWb(pane.id, newContent)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) drawPaths(ctx, newContent.paths, newContent.offsetX, newContent.offsetY, newContent.scale)
  }

  return (
    <div className="flex flex-col h-full bg-[#0C0C0C]">
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
          onClick={() => setTool("pan")}
          className={`px-2 py-1 text-xs rounded ${tool === "pan" ? "bg-[#333] text-white" : "text-[#888] hover:text-white"}`}
          title="Pan (drag to move)"
        >
          Pan
        </button>
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
        <button onClick={zoomOut} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded" title="Zoom Out">−</button>
        <span className="text-[10px] text-[#666] w-10 text-center">{Math.round(content.scale * 100)}%</span>
        <button onClick={zoomIn} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded" title="Zoom In">+</button>
        <button onClick={resetView} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded" title="Reset View">Reset</button>
        <div className="w-px h-4 bg-[#252525]" />
        <button onClick={undo} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded" title="Undo">Undo</button>
        <button onClick={clearBoard} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded" title="Clear">Clear</button>
      </div>
      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-t border-[#252525] bg-[#0C0C0C]">
        <span className="text-[10px] text-[#555]">Whiteboard</span>
        <span className="ml-auto text-[10px] text-[#555]">Pan: Middle Click / Pan Tool</span>
      </div>
    </div>
  )
}
