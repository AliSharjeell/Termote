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
      // Basic check for touch device or small screen
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmall = window.innerWidth <= 768
      setIsVisible(isTouch && isSmall)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isVisible) return null

  const keys = [
    { label: 'ESC', action: () => onInput('\x1b') },
    { label: 'TAB', action: () => onInput('\x09') },
    { icon: <ArrowUp size={16} />, action: () => onInput('\x1b[A') },
    { icon: <ArrowDown size={16} />, action: () => onInput('\x1b[B') },
    { icon: <ArrowLeft size={16} />, action: () => onInput('\x1b[D') },
    { icon: <ArrowRight size={16} />, action: () => onInput('\x1b[C') },
  ]

  return (
    <div className="flex items-center bg-[#1a1a1a] border-t border-[#333] p-1 gap-1 overflow-x-auto touch-manipulation z-50 w-full flex-shrink-0">
      <button 
        onClick={() => onCtrlToggle(!isCtrlActive)}
        className={`flex-shrink-0 px-3 py-2 rounded font-mono text-xs font-bold transition-colors ${
          isCtrlActive ? 'bg-blue-600 text-white' : 'bg-[#333] text-gray-300'
        }`}
      >
        CTRL
      </button>
      {keys.map((k, i) => (
        <button
          key={i}
          onClick={(e) => { e.preventDefault(); k.action() }}
          className="flex-shrink-0 px-3 py-2 bg-[#333] hover:bg-[#444] active:bg-[#555] rounded text-gray-300 flex items-center justify-center font-mono text-xs min-w-[40px]"
        >
          {k.icon || k.label}
        </button>
      ))}
      <button 
        onClick={(e) => { e.preventDefault(); onInput('-') }}
        className="flex-shrink-0 px-3 py-2 bg-[#333] hover:bg-[#444] rounded text-gray-300 font-mono text-xs"
      >
        -
      </button>
      <button 
        onClick={(e) => { e.preventDefault(); onInput('/') }}
        className="flex-shrink-0 px-3 py-2 bg-[#333] hover:bg-[#444] rounded text-gray-300 font-mono text-xs"
      >
        /
      </button>
      <button 
        onClick={(e) => { e.preventDefault(); onInput('|') }}
        className="flex-shrink-0 px-3 py-2 bg-[#333] hover:bg-[#444] rounded text-gray-300 font-mono text-xs"
      >
        |
      </button>
    </div>
  )
}
