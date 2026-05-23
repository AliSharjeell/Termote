/**
 * Global Whiteboard Instance Registry
 *
 * Tracks whiteboard instances for resize/reflow operations.
 */

type ResizeFn = (reason: string) => void

const whiteboards = new Map<string, ResizeFn>()

export function registerWhiteboardResize(paneId: string, resize: ResizeFn): () => void {
  whiteboards.set(paneId, resize)
  return () => whiteboards.delete(paneId)
}

export function resizeAllWhiteboards(reason: string): void {
  for (const resize of whiteboards.values()) {
    resize(reason)
  }
}