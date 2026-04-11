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

  useEffect(() => { contentRef.current = content }, [content])

  const drawScene = useCallback((ctx: CanvasRenderingContext2D, content: WbContent) => {
    const { paths, bgColor, offsetX, offsetY, scale } = content
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.save()
    ctx.translate(ctx.canvas.width / 2 + offsetX, ctx.canvas.height / 2 + offsetY)
    ctx.scale(scale, scale)
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2)
    for (const path of paths) {
      if (path.points.length < 2) continue
      ctx.strokeStyle = path.color
      ctx.lineWidth = path.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(path.points[0].x, path.points[0].y)
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y)
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
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      drawScene(ctx, contentRef.current)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)
    return () => ro.disconnect()
  }, [drawScene])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) drawScene(ctx, content)
  }, [content, drawScene])

  const getWorldPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const { offsetX, offsetY, scale } = contentRef.current
    const worldX = (e.clientX - rect.left - (canvas.width / 2 + offsetX)) / scale + canvas.width / 2
    const worldY = (e.clientY - rect.top - (canvas.height / 2 + offsetY)) / scale + canvas.height / 2
    return { x: worldX, y: worldY }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "pan") {
      isPanningRef.current = true
      lastPanRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    isDrawingRef.current = true
    currentPathRef.current = [getWorldPos(e)]
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "pan") {
      if (!isPanningRef.current) return
      const dx = e.clientX - lastPanRef.current.x
      const dy = e.clientY - lastPanRef.current.y
      lastPanRef.current = { x: e.clientX, y: e.clientY }
      const c = { ...contentRef.current, offsetX: contentRef.current.offsetX + dx, offsetY: contentRef.current.offsetY + dy }
      setContent(c)
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) drawScene(ctx, c)
      }
      return
    }
    if (!isDrawingRef.current) return
    const pos = getWorldPos(e)
    currentPathRef.current.push(pos)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pts = currentPathRef.current
    if (pts.length < 2) return
    ctx.save()
    ctx.translate(ctx.canvas.width / 2 + contentRef.current.offsetX, ctx.canvas.height / 2 + contentRef.current.offsetY)
    ctx.scale(contentRef.current.scale, contentRef.current.scale)
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2)
    const prev = pts[pts.length - 2]
    const curr = pts[pts.length - 1]
    ctx.strokeStyle = tool === "eraser" ? contentRef.current.bgColor : penColor
    ctx.lineWidth = tool === "eraser" ? penWidth * 4 : penWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(curr.x, curr.y)
    ctx.stroke()
    ctx.restore()
  }

  const handleMouseUp = () => {
    if (tool === "pan") { isPanningRef.current = false; return }
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const pts = currentPathRef.current
    if (pts.length < 2) return
    const newPath: WbPath = { points: pts, color: tool === "eraser" ? contentRef.current.bgColor : penColor, width: tool === "eraser" ? penWidth * 4 : penWidth }
    const c = { ...contentRef.current, paths: [...contentRef.current.paths, newPath] }
    setContent(c)
    saveWb(pane.id, c)
    currentPathRef.current = []
  }

  const clearBoard = () => {
    const c = { ...contentRef.current, paths: [] }
    setContent(c)
    saveWb(pane.id, c)
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) drawScene(ctx, c) }
  }

  const undo = () => {
    if (!contentRef.current.paths.length) return
    const c = { ...contentRef.current, paths: contentRef.current.paths.slice(0, -1) }
    setContent(c)
    saveWb(pane.id, c)
  }

  const resetView = () => {
    const c = { ...contentRef.current, offsetX: 0, offsetY: 0, scale: 1 }
    setContent(c)
    saveWb(pane.id, c)
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) drawScene(ctx, c) }
  }

  const zoom = (factor: number) => {
    const newScale = Math.max(0.1, Math.min(5, contentRef.current.scale * factor))
    const c = { ...contentRef.current, scale: newScale }
    setContent(c)
    saveWb(pane.id, c)
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) drawScene(ctx, c) }
  }

  return (
    <div className="flex flex-col h-full bg-[#0C0C0C]">
      <PaneTitleBar title={pane.name} paneId={pane.id} pinned={pane.pinned} groupId={pane.groupId} onClose={() => killPane(pane.id)} onRename={(n) => renamePane(pane.id, n)} onPin={() => togglePin(pane.id)} />
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-[#252525] bg-[#111]">
        <button onClick={() => setTool("pan")} className={`px-2 py-1 text-xs rounded ${tool === "pan" ? "bg-[#333] text-white" : "text-[#888] hover:text-white"}`} title="Pan">Pan</button>
        <button onClick={() => setTool("pen")} className={`px-2 py-1 text-xs rounded ${tool === "pen" ? "bg-[#333] text-white" : "text-[#888] hover:text-white"}`} title="Pen">Pen</button>
        <button onClick={() => setTool("eraser")} className={`px-2 py-1 text-xs rounded ${tool === "eraser" ? "bg-[#333] text-white" : "text-[#888] hover:text-white"}`} title="Eraser">Eraser</button>
        <div className="w-px h-4 bg-[#252525]" />
        <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
        <span className="text-[10px] text-[#666]">Size</span>
        <input type="range" min="1" max="20" value={penWidth} onChange={(e) => setPenWidth(Number(e.target.value))} className="w-16" />
        <div className="w-px h-4 bg-[#252525]" />
        <button onClick={() => zoom(1/1.2)} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded">−</button>
        <span className="text-[10px] text-[#666] w-10 text-center">{Math.round(content.scale*100)}%</span>
        <button onClick={() => zoom(1.2)} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded">+</button>
        <button onClick={resetView} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded">Reset</button>
        <div className="w-px h-4 bg-[#252525]" />
        <button onClick={undo} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded">Undo</button>
        <button onClick={clearBoard} className="px-2 py-1 text-xs text-[#888] hover:text-white rounded">Clear</button>
      </div>
      <div className="flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
      </div>
    </div>
  )
}
