"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useEffect, useRef, useState, useCallback } from "react"

interface WhiteboardPaneProps {
  pane: Pane
}

const WB_KEY = (id: string) => `wb-${id}`

interface WbPoint { x: number; y: number }
interface WbPath { points: WbPoint[]; color: string; width: number }
interface WbContent {
  paths: WbPath[]
  bgColor: string
  viewX: number
  viewY: number
  viewScale: number
}

function loadWb(id: string): WbContent {
  try {
    const raw = localStorage.getItem(WB_KEY(id))
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        paths: parsed.paths || [],
        bgColor: parsed.bgColor || "#1a1a1a",
        viewX: parsed.viewX ?? 0,
        viewY: parsed.viewY ?? 0,
        viewScale: parsed.viewScale ?? 1,
      }
    }
  } catch {}
  return { paths: [], bgColor: "#1a1a1a", viewX: 0, viewY: 0, viewScale: 1 }
}

function saveWb(id: string, c: WbContent) {
  try { localStorage.setItem(WB_KEY(id), JSON.stringify(c)) } catch {}
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
  const currentRef = useRef<WbPoint[]>([])
  const contentRef = useRef(content)
  const isPanRef = useRef(false)
  const panLastRef = useRef({ x: 0, y: 0 })

  useEffect(() => { contentRef.current = content }, [content])

  const redraw = useCallback((ctx: CanvasRenderingContext2D, c: WbContent) => {
    const { paths, bgColor, viewX, viewY, viewScale } = c
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.save()
    ctx.translate(ctx.canvas.width / 2 + viewX, ctx.canvas.height / 2 + viewY)
    ctx.scale(viewScale, viewScale)
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2)

    for (const path of paths) {
      if (path.points.length < 2) continue
      ctx.strokeStyle = path.color
      ctx.lineWidth = path.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(path.points[0].x, path.points[0].y)
      for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y)
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.parentElement!.clientWidth
      canvas.height = canvas.parentElement!.clientHeight
      redraw(ctx, contentRef.current)
    })
    ro.observe(canvas.parentElement!)
    return () => ro.disconnect()
  }, [redraw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) redraw(ctx, content)
  }, [content, redraw])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "pan") {
      isPanRef.current = true
      panLastRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    isDrawingRef.current = true
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    currentRef.current = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }]
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "pan") {
      if (!isPanRef.current) return
      const dx = e.clientX - panLastRef.current.x
      const dy = e.clientY - panLastRef.current.y
      panLastRef.current = { x: e.clientX, y: e.clientY }
      const c = { ...contentRef.current, viewX: contentRef.current.viewX + dx, viewY: contentRef.current.viewY + dy }
      setContent(c)
      const canvas = canvasRef.current
      if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) redraw(ctx, c) }
      return
    }
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const wx = e.clientX - rect.left
    const wy = e.clientY - rect.top
    const prev = currentRef.current[currentRef.current.length - 1]
    currentRef.current.push({ x: wx, y: wy })

    const ctx = canvas.getContext("2d")!
    const c = contentRef.current
    ctx.save()
    ctx.translate(ctx.canvas.width / 2 + c.viewX, ctx.canvas.height / 2 + c.viewY)
    ctx.scale(c.viewScale, c.viewScale)
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2)
    ctx.strokeStyle = tool === "eraser" ? c.bgColor : penColor
    ctx.lineWidth = tool === "eraser" ? penWidth * 4 : penWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(wx, wy)
    ctx.stroke()
    ctx.restore()
  }

  const handleMouseUp = () => {
    if (tool === "pan") { isPanRef.current = false; return }
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    if (currentRef.current.length < 2) { currentRef.current = []; return }
    const newPath: WbPath = {
      points: [...currentRef.current],
      color: tool === "eraser" ? contentRef.current.bgColor : penColor,
      width: tool === "eraser" ? penWidth * 4 : penWidth,
    }
    const c = { ...contentRef.current, paths: [...contentRef.current.paths, newPath] }
    setContent(c)
    saveWb(pane.id, c)
    currentRef.current = []
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) redraw(ctx, c) }
  }

  const clearBoard = () => {
    const c = { ...contentRef.current, paths: [] }
    setContent(c)
    saveWb(pane.id, c)
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) redraw(ctx, c) }
  }

  const undo = () => {
    if (!contentRef.current.paths.length) return
    const c = { ...contentRef.current, paths: contentRef.current.paths.slice(0, -1) }
    setContent(c)
    saveWb(pane.id, c)
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) redraw(ctx, c) }
  }

  const resetView = () => {
    const c = { ...contentRef.current, viewX: 0, viewY: 0, viewScale: 1 }
    setContent(c)
    saveWb(pane.id, c)
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) redraw(ctx, c) }
  }

  const zoom = (factor: number) => {
    const s = Math.max(0.1, Math.min(5, contentRef.current.viewScale * factor))
    const c = { ...contentRef.current, viewScale: s }
    setContent(c)
    saveWb(pane.id, c)
    const canvas = canvasRef.current
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) redraw(ctx, c) }
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
        <span className="text-[10px] text-[#666] w-10 text-center">{Math.round(content.viewScale*100)}%</span>
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
