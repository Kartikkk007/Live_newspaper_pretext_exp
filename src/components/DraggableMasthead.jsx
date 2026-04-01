import { useState, useRef, useEffect, useCallback } from "react"

const PAPER_NAME = "THE PRETEXT CHRONICLE"
const LETTER_FONT_SIZE = "clamp(24px, 5.5vw, 60px)"
function getLetterfontSizePx() {
  const vw = window.innerWidth
  const clamped = Math.min(Math.max(32, vw * 0.06), 72)
  return clamped
}

export default function DraggableMasthead({ onExclusionChange }) {
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [positions, setPositions] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const letterRefs = useRef([])
  const dragState = useRef(null)
  const rafRef = useRef(null)
  const containerRef = useRef(null)

  const letters = PAPER_NAME.split("")

  const handleMouseDown = useCallback((e, index) => {
    if (letters[index] === " ") return
    e.preventDefault()

    const el = letterRefs.current[index]
    if (!el) return
    const rect = el.getBoundingClientRect()

    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top

    dragState.current = {
      index,
      offsetX: startX,
      offsetY: startY,
      currentX: rect.left,
      currentY: rect.top,
      width: rect.width,
      height: rect.height,
    }

    setDraggingIndex(index)
    setIsDragging(true)
  }, [letters])

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current) return

    const x = e.clientX - dragState.current.offsetX
    const y = e.clientY - dragState.current.offsetY

    dragState.current.currentX = x
    dragState.current.currentY = y

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!dragState.current) return

      const { index, currentX, currentY, width, height } = dragState.current

      setPositions((prev) => ({
        ...prev,
        [index]: { x: currentX, y: currentY + window.scrollY },
      }))

      onExclusionChange({
        left: currentX,
        right: currentX + width,
        top: currentY + window.scrollY,
        bottom: currentY + window.scrollY + height,
        width,
        height,
        letterIndex: index,
        letter: letters[index],
      })
    })
  }, [letters, onExclusionChange])

  const handleMouseUp = useCallback(() => {
    if (!dragState.current) return

    const index = dragState.current.index
    dragState.current = null
    setDraggingIndex(null)
    setIsDragging(false)

    setPositions((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })

    onExclusionChange(null)
  }, [onExclusionChange])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        borderTop: "1.5px solid #1a1008",
        borderBottom: "1.5px solid #1a1008",
        padding: "10px 0 8px",
        margin: "0 0 8px",
        textAlign: "center",
        position: "relative",
        userSelect: "none",
      }}
    >
      <div style={{
        display: "inline-flex",
        flexWrap: "nowrap",
        justifyContent: "center",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}>
        {letters.map((letter, i) => {
          const isSpace = letter === " "
          const isDraggingThis = draggingIndex === i
          const pos = positions[i]
          const isFloating = !!pos

          if (isSpace) {
            return (
              <span key={i} style={{ fontSize: LETTER_FONT_SIZE, fontFamily: "'Times New Roman', serif" }}>
                &nbsp;
              </span>
            )
          }

          return (
            <span key={i}>
              {isFloating && (
                <span style={{
                  fontSize: LETTER_FONT_SIZE,
                  fontFamily: "'Times New Roman', serif",
                  fontWeight: "900",
                  color: "transparent",
                  letterSpacing: "-0.02em",
                  pointerEvents: "none",
                }}>
                  {letter}
                </span>
              )}

              <span
                ref={(el) => (letterRefs.current[i] = el)}
                onMouseDown={(e) => handleMouseDown(e, i)}
                style={{
                  fontSize: LETTER_FONT_SIZE,
                  fontFamily: "'Times New Roman', serif",
                  fontWeight: "900",
                  color: isFloating ? "transparent" : "#1a1008",
                  letterSpacing: "-0.02em",
                  cursor: isSpace ? "default" : isDraggingThis ? "grabbing" : "grab",
                  display: isFloating ? "none" : "inline",
                  transition: isFloating ? "none" : "color 0.1s",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {letter}
              </span>

              {isFloating && (
                <span
                  style={{
                    fontSize: LETTER_FONT_SIZE,
                    fontFamily: "'Times New Roman', serif",
                    fontWeight: "900",
                    color: "#1a1008",
                    letterSpacing: "-0.02em",
                    position: "fixed",
                    left: pos.x,
                    top: pos.y - window.scrollY,
                    zIndex: 9999,
                    pointerEvents: "none",
                    cursor: "grabbing",
                    textShadow: "2px 2px 0 rgba(26,16,8,0.15), -1px -1px 0 rgba(245,239,224,0.8)",
                    filter: "drop-shadow(0 4px 8px rgba(26,16,8,0.25))",
                    lineHeight: 1,
                    transform: "rotate(-2deg)",
                    animation: "letterFloat 0.2s ease-out forwards",
                  }}
                >
                  {letter}
                </span>
              )}
            </span>
          )
        })}
      </div>

      <div style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "7.5px",
        letterSpacing: "0.14em",
        color: "#9a7a5a",
        textTransform: "uppercase",
        marginTop: "5px",
      }}>
        ↑ grab any letter and drag it into the page
      </div>

      <style>{`
        @keyframes letterFloat {
          from { transform: rotate(0deg) scale(1); }
          to   { transform: rotate(-2deg) scale(1.05); }
        }
      `}</style>
    </div>
  )
}