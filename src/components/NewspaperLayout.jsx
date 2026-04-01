import { useEffect, useRef, useState, useCallback } from "react"
import { prepare, layout } from "@chenglou/pretext"
import HeadlineStretcher from "./HeadlineStretcher"
import PullQuoteInjector from "./PullQuoteInjector"
import { useExclusionLayout } from "../hooks/useExclusionLayout"

function measureLineCount(text, fontSize, colWidth) {
  if (!text || colWidth < 20) return 0
  try {
    const font = `400 ${fontSize}px Times New Roman, serif`
    const prepared = prepare(text, font)
    const result = layout(prepared, colWidth, fontSize * 1.55)
    return result.lineCount || 0
  } catch { return 0 }
}

function distributeTextToColumns(text, fontSize, colWidth, numCols) {
  if (!text || colWidth < 20) return Array(numCols).fill({ text: "", lineCount: 0 })

  const totalLines = measureLineCount(text, fontSize, colWidth)
  const targetLinesPerCol = Math.ceil(totalLines / numCols)
  const words = text.split(/\s+/)
  const columns = []
  let wordIndex = 0

  for (let col = 0; col < numCols; col++) {
    if (wordIndex >= words.length) { columns.push({ text: "", lineCount: 0 }); continue }
    const isLastCol = col === numCols - 1
    if (isLastCol) {
      const remaining = words.slice(wordIndex).join(" ")
      const lc = measureLineCount(remaining, fontSize, colWidth)
      columns.push({ text: remaining, lineCount: lc })
      break
    }
    let lo = wordIndex, hi = words.length
    let bestEnd = wordIndex + Math.floor(words.length / numCols)
    for (let iter = 0; iter < 18; iter++) {
      const mid = Math.floor((lo + hi) / 2)
      const chunk = words.slice(wordIndex, mid).join(" ")
      const lc = measureLineCount(chunk, fontSize, colWidth)
      if (lc <= targetLinesPerCol) { bestEnd = mid; lo = mid + 1 }
      else hi = mid - 1
    }
    const colText = words.slice(wordIndex, bestEnd).join(" ")
    const lc = measureLineCount(colText, fontSize, colWidth)
    columns.push({ text: colText, lineCount: lc })
    wordIndex = bestEnd
  }
  return columns
}

const COLUMN_GAP = 28
const NUM_COLS = 2

export default function NewspaperLayout({ article, fontSize, isFirst, exclusion }) {
  const containerRef = useRef(null)
  const canvasRefs = [useRef(null), useRef(null)]
  const colRefs = [useRef(null), useRef(null)]
  const [containerWidth, setContainerWidth] = useState(0)
  const [columns, setColumns] = useState([])
  const [activePullQuote, setActivePullQuote] = useState(null)
  const [computingCol, setComputingCol] = useState(null)
  const [totalMetrics, setTotalMetrics] = useState(null)
  const [exclusionLines, setExclusionLines] = useState({})
  const exclusionRafRef = useRef(null)

  const { layoutWithExclusion } = useExclusionLayout()

  const colWidth = containerWidth
    ? Math.floor((containerWidth - COLUMN_GAP * (NUM_COLS - 1)) / NUM_COLS)
    : 0

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w > 0) setContainerWidth(Math.floor(w))
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => { setActivePullQuote(null) }, [article?.id])

  useEffect(() => {
    if (!article?.body || !colWidth || colWidth < 20) return
    setComputingCol("all")
    const raf = requestAnimationFrame(() => {
      const bodyText = activePullQuote
        ? article.body.replace(activePullQuote, "").replace(/\s+/g, " ").trim()
        : article.body
      const distributed = distributeTextToColumns(bodyText, fontSize, colWidth, NUM_COLS)
      setColumns(distributed)
      setTotalMetrics({
        totalLines: distributed.reduce((s, c) => s + c.lineCount, 0),
        colWidth, fontSize,
        wordCount: bodyText.split(/\s+/).length,
      })
      setComputingCol(null)
    })
    return () => cancelAnimationFrame(raf)
  }, [article, fontSize, colWidth, activePullQuote])

  useEffect(() => {
    if (!exclusion || !colWidth || columns.length === 0) {
      setExclusionLines({})
      return
    }

    if (exclusionRafRef.current) cancelAnimationFrame(exclusionRafRef.current)

    exclusionRafRef.current = requestAnimationFrame(() => {
      const newExclusionLines = {}

      columns.forEach((col, i) => {
        if (!col.text || !colRefs[i].current) return

        const colRect = colRefs[i].current.getBoundingClientRect()
        const colPageX = colRect.left
        const colPageY = colRect.top + window.scrollY

        const result = layoutWithExclusion(
          col.text,
          fontSize,
          colWidth,
          colPageX,
          colPageY,
          exclusion
        )

        if (result.lines.some((l) => l.isConstrained)) {
          newExclusionLines[i] = result
        }
      })

      setExclusionLines(newExclusionLines)
    })

    return () => {
      if (exclusionRafRef.current) cancelAnimationFrame(exclusionRafRef.current)
    }
  }, [exclusion, columns, colWidth, fontSize, layoutWithExclusion])

  useEffect(() => {
    columns.forEach((col, i) => {
      const canvas = canvasRefs[i].current
      if (!canvas || !col.lineCount) return
      const lh = fontSize * 1.55
      const exLines = exclusionLines[i]
      const lineCount = exLines ? exLines.lines.length : col.lineCount
      const totalHeight = lineCount * lh + 8
      canvas.width = colWidth
      canvas.height = totalHeight
      const ctx = canvas.getContext("2d")
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const linesToDraw = exLines ? exLines.lines : Array.from({ length: col.lineCount }, (_, j) => ({ lineIndex: j, isConstrained: false, availableWidth: colWidth }))

      linesToDraw.forEach((line, j) => {
        if (j % 2 === 0) { ctx.fillStyle = "rgba(180,140,80,0.05)"; ctx.fillRect(0, j * lh, colWidth, lh) }
        if (line.isConstrained) {
          ctx.fillStyle = "rgba(139,58,15,0.07)"
          ctx.fillRect(0, j * lh, line.availableWidth, lh)
          ctx.strokeStyle = "rgba(139,58,15,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
          ctx.beginPath(); ctx.moveTo(line.availableWidth, j * lh); ctx.lineTo(line.availableWidth, j * lh + lh); ctx.stroke()
          ctx.setLineDash([])
        }
        const baseY = j * lh + fontSize * 0.82
        ctx.strokeStyle = line.isConstrained ? "rgba(139,58,15,0.3)" : "rgba(180,140,80,0.22)"
        ctx.lineWidth = 0.5; ctx.setLineDash([2, 4])
        ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(line.isConstrained ? line.availableWidth : colWidth, baseY); ctx.stroke()
        ctx.setLineDash([])
      })
    })
  }, [columns, exclusionLines, colWidth, fontSize])

  const handlePullQuoteSelect = useCallback((sentence) => { setActivePullQuote(sentence) }, [])

  if (!article) return null

  const lh = fontSize * 1.55

  const renderColumnText = (col, i) => {
    const exResult = exclusionLines[i]
    if (!exResult || exResult.lines.length === 0) {
      return (
        <p style={{ fontSize: `${fontSize}px`, lineHeight: 1.55, color: "#1a1008", margin: 0, wordBreak: "break-word", textAlign: "left" }}>
          {col.text}
        </p>
      )
    }

    return (
      <div style={{ position: "relative" }}>
        {exResult.lines.map((line, j) => (
          <div
            key={j}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.55,
              color: "#1a1008",
              maxWidth: `${line.availableWidth}px`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "clip",
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
    )
  }

  return (
    <article ref={containerRef} style={{
      fontFamily: "'Times New Roman', serif",
      borderTop: isFirst ? "4px solid #1a1008" : "2px solid #1a1008",
      paddingTop: "16px", paddingBottom: "24px",
      background: "#f5efe0", position: "relative",
    }}>
      {containerWidth > 0 && (
        <HeadlineStretcher headline={article.headline} containerWidth={containerWidth} />
      )}

      <div style={{ height: "2px", background: "#1a1008", margin: "10px 0 14px" }} />

      <div style={{ display: "flex", gap: `${COLUMN_GAP}px`, alignItems: "flex-start", position: "relative" }}>
        {columns.map((col, i) => (
          <div key={i} ref={colRefs[i]} style={{ width: `${colWidth}px`, flexShrink: 0, position: "relative" }}>
            <div style={{
              fontFamily: "'Courier New', Courier, monospace", fontSize: "7px",
              letterSpacing: "0.16em", color: "#9a7a5a", textTransform: "uppercase",
              marginBottom: "5px", display: "flex", justifyContent: "space-between",
            }}>
              <span>COL {i + 1}</span>
              <span>
                {computingCol === "all" ? "measuring..." : exclusionLines[i]
                  ? `${exclusionLines[i].lines.length} lines · EXCLUSION ACTIVE`
                  : `${col.lineCount} lines · ${colWidth}px`}
              </span>
            </div>

            <div style={{ width: "100%", height: "1px", background: "#1a1008", marginBottom: "8px" }} />

            <div style={{ position: "relative" }}>
              <canvas ref={canvasRefs[i]} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1 }} />
              <div style={{ position: "relative", zIndex: 2, minHeight: col.lineCount ? col.lineCount * lh : "60px" }}>
                {computingCol === "all" ? (
                  <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.55, color: "#c9b89a", animation: "pulse 0.7s ease-in-out infinite alternate" }}>
                    Measuring...
                  </div>
                ) : i === 0 && !exclusionLines[i] ? (
                  <PullQuoteInjector
                    body={col.text} fontSize={fontSize} containerWidth={colWidth}
                    activePullQuote={activePullQuote} onPullQuoteSelect={handlePullQuoteSelect}
                  />
                ) : (
                  renderColumnText(col, i)
                )}
              </div>
            </div>
          </div>
        ))}

        {columns.length === NUM_COLS && (
          <div style={{
            position: "absolute", left: `${colWidth + COLUMN_GAP / 2}px`, top: 0, bottom: 0, width: "1px",
            background: "repeating-linear-gradient(to bottom, #1a1008 0px, #1a1008 4px, transparent 4px, transparent 8px)",
            transform: "translateX(-0.5px)",
          }} />
        )}
      </div>

      {totalMetrics && !computingCol && (
        <div style={{
          marginTop: "14px", paddingTop: "8px", borderTop: "1px dashed #c9b89a",
          fontFamily: "'Courier New', Courier, monospace", fontSize: "7.5px",
          color: "#9a7a5a", letterSpacing: "0.1em", display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "center",
        }}>
          <span>PRETEXT METRICS</span>
          <span>WORDS: {totalMetrics.wordCount}</span>
          <span>TOTAL LINES: {totalMetrics.totalLines}</span>
          <span>COL WIDTH: {totalMetrics.colWidth}px</span>
          <span>FONT: {totalMetrics.fontSize}px</span>
          {Object.keys(exclusionLines).length > 0 && (
            <span style={{ color: "#8B3A0F", fontWeight: "bold" }}>✦ LETTER EXCLUSION ACTIVE</span>
          )}
          <span style={{ color: "#8B3A0F", fontWeight: "bold" }}>✦ NO DOM READS</span>
        </div>
      )}

      <style>{`@keyframes pulse { from { opacity: 0.3; } to { opacity: 0.7; } }`}</style>
    </article>
  )
}