import { useState, useEffect } from 'react'
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  TerminalSquare
} from 'lucide-react'

interface Props {
  onInput: (data: string) => void
  onCtrlToggle: (isActive: boolean) => void
  isCtrlActive: boolean
}

export function MobileKeyboardBar({ onInput, onCtrlToggle, isCtrlActive }: Props) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check for touch device or mobile user agent
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSmall = window.innerWidth <= 1024 // Allow up to small tablets
      setIsVisible((isTouch || isMobileAgent) && isSmall)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isVisible) return null

  const keys = [
    { label: 'ESC', action: () => onInput('\x1b') },
    { label: 'TAB', action: () => onInput('\x09') },
    { icon: <ArrowUp size={24} />, action: () => onInput('\x1b[A') },
    { icon: <ArrowDown size={24} />, action: () => onInput('\x1b[B') },
    { icon: <ArrowLeft size={24} />, action: () => onInput('\x1b[D') },
    { icon: <ArrowRight size={24} />, action: () => onInput('\x1b[C') },
  ]

  return (
    <div 
      className="flex items-center bg-[#1a1a1a] border-t border-[#333] p-2 gap-2 overflow-x-auto touch-pan-x select-none z-50 w-full flex-shrink-0"
      onClick={(e) => e.preventDefault()}
      onDoubleClick={(e) => e.preventDefault()}
    >
      <button 
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onCtrlToggle(!isCtrlActive) }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className={`flex-shrink-0 px-4 py-3 rounded font-mono text-sm font-bold transition-colors select-none  ${
          isCtrlActive ? 'bg-blue-600 text-white' : 'bg-[#333] text-gray-300'
        }`}
      >
        CTRL
      </button>
      {keys.map((k, i) => (
        <button
          key={i}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); k.action() }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="flex-shrink-0 px-4 py-3 bg-[#333] hover:bg-[#444] active:bg-[#555] rounded text-gray-300 flex items-center justify-center font-mono text-sm min-w-[48px] select-none "
        >
          {k.icon || k.label}
        </button>
      ))}
      <button 
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onInput('-') }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="flex-shrink-0 px-4 py-3 bg-[#333] hover:bg-[#444] active:bg-[#555] rounded text-gray-300 font-mono text-sm min-w-[48px] flex items-center justify-center select-none "
      >
        -
      </button>
      <button 
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onInput('/') }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="flex-shrink-0 px-4 py-3 bg-[#333] hover:bg-[#444] active:bg-[#555] rounded text-gray-300 font-mono text-sm min-w-[48px] flex items-center justify-center select-none "
      >
        /
      </button>
      <button 
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onInput('|') }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="flex-shrink-0 px-4 py-3 bg-[#333] hover:bg-[#444] active:bg-[#555] rounded text-gray-300 font-mono text-sm min-w-[48px] flex items-center justify-center select-none "
      >
        |
      </button>
    </div>
  )
}
