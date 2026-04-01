import { useEffect, useRef, useState } from "react"
import { prepare, layout, prepareWithSegments, layoutWithLines } from "@chenglou/pretext"

const TARGET_LINES = [1, 2, 3]

export default function HeadlineStretcher({ headline, containerWidth }) {
  const [targetLines, setTargetLines] = useState(2)
  const [computedSize, setComputedSize] = useState(null)
  const [lineData, setLineData] = useState([])
  const [isComputing, setIsComputing] = useState(false)
  const [iterationCount, setIterationCount] = useState(0)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!headline || !containerWidth || containerWidth < 50) return

    setIsComputing(true)

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      let lo = 10
      let hi = 120
      let best = 10
      let count = 0

      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2
        count++
        try {
          const font = `900 ${mid}px Times New Roman, serif`
          const prepared = prepare(headline, font)
          const result = layout(prepared, containerWidth, mid * 1.1)
          const lc = result.lineCount

          if (lc <= targetLines) {
            best = mid
            lo = mid + 0.5
          } else {
            hi = mid - 0.5
          }
        } catch {
          hi = mid - 0.5
        }
      }

      const finalSize = Math.floor(best)

      try {
        const font = `900 ${finalSize}px Times New Roman, serif`
        const prepared = prepareWithSegments(headline, font)
        const result = layoutWithLines(prepared, containerWidth, finalSize * 1.1)
        setLineData(result.lines || [])
      } catch {
        setLineData([])
      }

      setComputedSize(finalSize)
      setIterationCount(count)
      setIsComputing(false)
    })

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [headline, containerWidth, targetLines])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !computedSize || lineData.length === 0) return

    const lh = computedSize * 1.1
    const totalHeight = lineData.length * lh + 24
    canvas.width = containerWidth
    canvas.height = totalHeight

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "rgba(180,140,80,0.07)"
    lineData.forEach((_, i) => {
      if (i % 2 === 0) ctx.fillRect(0, i * lh, containerWidth, lh)
    })

    ctx.strokeStyle = "rgba(180,140,80,0.35)"
    ctx.lineWidth = 0.75
    ctx.setLineDash([3, 4])
    lineData.forEach((_, i) => {
      const baselineY = i * lh + computedSize * 0.82
      ctx.beginPath()
      ctx.moveTo(0, baselineY)
      ctx.lineTo(containerWidth, baselineY)
      ctx.stroke()
    })

    ctx.strokeStyle = "rgba(200,100,60,0.25)"
    ctx.lineWidth = 0.5
    ctx.setLineDash([2, 6])
    lineData.forEach((_, i) => {
      const topY = i * lh
      ctx.beginPath()
      ctx.moveTo(0, topY)
      ctx.lineTo(containerWidth, topY)
      ctx.stroke()
    })

    ctx.setLineDash([])
  }, [computedSize, lineData, containerWidth])

  if (!headline || !containerWidth) return null

  return (
    <div style={{ fontFamily: "'Courier New', Courier, monospace", marginBottom: "8px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "8px", letterSpacing: "0.18em", color: "#7a5c3a", textTransform: "uppercase", fontWeight: "bold" }}>
          PRETEXT HEADLINE FIT
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {TARGET_LINES.map((n) => (
            <button key={n} onClick={() => setTargetLines(n)} style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "8px", letterSpacing: "0.1em", padding: "2px 6px",
              border: "1px solid #1a1008", borderRadius: "1px", cursor: "pointer",
              background: targetLines === n ? "#1a1008" : "transparent",
              color: targetLines === n ? "#f5efe0" : "#1a1008", fontWeight: "bold",
            }}>
              {n}L
            </button>
          ))}
        </div>
        {computedSize && (
          <span style={{ fontSize: "8px", color: "#9a7a5a", letterSpacing: "0.08em" }}>
            {isComputing ? "computing..." : `${computedSize}px · ${iterationCount} iterations · ${lineData.length} line${lineData.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, minHeight: computedSize ? lineData.length * computedSize * 1.1 + 24 : "60px" }}>
          {isComputing ? (
            <div style={{
              fontFamily: "'Times New Roman', serif", fontSize: "32px", fontWeight: "900",
              color: "#c9b89a", letterSpacing: "-0.02em", lineHeight: 1.1, padding: "4px 0",
              animation: "pulse 0.6s ease-in-out infinite alternate",
            }}>
              {headline}
            </div>
          ) : (
            <div style={{
              fontFamily: "'Times New Roman', serif", fontSize: `${computedSize}px`,
              fontWeight: "900", color: "#1a1008", letterSpacing: "-0.02em",
              lineHeight: 1.1, padding: "4px 0", width: "100%", wordBreak: "break-word",
            }}>
              {headline}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { from { opacity: 0.4; } to { opacity: 0.8; } }`}</style>
    </div>
  )
}