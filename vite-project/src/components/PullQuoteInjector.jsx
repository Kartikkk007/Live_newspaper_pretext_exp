import { useEffect, useRef, useState } from "react"
import { prepare, layout, prepareWithSegments, layoutWithLines } from "@chenglou/pretext"

function splitIntoSentences(text) {
  const raw = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || []
  return raw.map((s) => s.trim()).filter((s) => s.length > 30)
}

function measureLineCount(text, fontSize, width, weight = "400") {
  if (!text || width < 20) return 0
  try {
    const font = `${weight} ${fontSize}px Times New Roman, serif`
    const prepared = prepare(text, font)
    const result = layout(prepared, width, fontSize * 1.55)
    return result.lineCount || 0
  } catch { return 0 }
}

function measureWithLines(text, fontSize, width, weight = "400") {
  if (!text || width < 20) return []
  try {
    const font = `${weight} ${fontSize}px Times New Roman, serif`
    const prepared = prepareWithSegments(text, font)
    const result = layoutWithLines(prepared, width, fontSize * 1.55)
    return result.lines || []
  } catch { return [] }
}

export default function PullQuoteInjector({ body, fontSize, containerWidth, activePullQuote, onPullQuoteSelect }) {
  const [sentences, setSentences] = useState([])
  const [bodySegments, setBodySegments] = useState([])
  const [pullQuoteLines, setPullQuoteLines] = useState([])
  const [hoveredSentence, setHoveredSentence] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const canvasRef = useRef(null)

  const quoteWidth = containerWidth ? containerWidth * 0.72 : 0
  const quoteFontSize = Math.max(fontSize * 1.55, 20)

  useEffect(() => {
    if (!body) return
    setSentences(splitIntoSentences(body))
  }, [body])

  useEffect(() => {
    if (!activePullQuote || !containerWidth || containerWidth < 50) {
      setBodySegments([])
      setPullQuoteLines([])
      setMetrics(null)
      return
    }

    const idx = sentences.indexOf(activePullQuote)
    const before = idx > 0 ? sentences.slice(0, idx).join(" ") : ""
    const after = idx >= 0 ? sentences.slice(idx + 1).join(" ") : ""

    const beforeLineCount = measureLineCount(before, fontSize, containerWidth)
    const afterLineCount = measureLineCount(after, fontSize, containerWidth)
    const qLines = measureWithLines(`"${activePullQuote}"`, quoteFontSize, quoteWidth, "700")

    setBodySegments([
      { text: before, lineCount: beforeLineCount, type: "before" },
      { text: after, lineCount: afterLineCount, type: "after" },
    ])
    setPullQuoteLines(qLines)
    setMetrics({
      beforeLineCount,
      afterLineCount,
      quoteLineCount: qLines.length,
      totalBodyLines: beforeLineCount + afterLineCount,
    })
  }, [activePullQuote, sentences, fontSize, containerWidth, quoteWidth, quoteFontSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !metrics || !containerWidth) return

    const lh = fontSize * 1.55
    const qlh = quoteFontSize * 1.3
    const quoteBlockHeight = pullQuoteLines.length * qlh + 48
    const totalHeight = metrics.beforeLineCount * lh + quoteBlockHeight + metrics.afterLineCount * lh + 32

    canvas.width = containerWidth
    canvas.height = Math.max(totalHeight, 100)

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let y = 0

    for (let i = 0; i < metrics.beforeLineCount; i++) {
      if (i % 2 === 0) { ctx.fillStyle = "rgba(180,140,80,0.06)"; ctx.fillRect(0, y + i * lh, containerWidth, lh) }
    }
    y += metrics.beforeLineCount * lh

    ctx.fillStyle = "rgba(180,100,40,0.08)"
    ctx.fillRect(0, y, containerWidth, quoteBlockHeight)

    ctx.strokeStyle = "rgba(26,16,8,0.7)"; ctx.lineWidth = 2.5; ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(containerWidth, y); ctx.stroke()
    ctx.strokeStyle = "rgba(26,16,8,0.5)"; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, y + quoteBlockHeight); ctx.lineTo(containerWidth, y + quoteBlockHeight); ctx.stroke()
    ctx.strokeStyle = "rgba(180,100,40,0.4)"; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(0, y + 12); ctx.lineTo(0, y + quoteBlockHeight - 12); ctx.stroke()

    const qStartY = y + 24
    pullQuoteLines.forEach((_, i) => {
      const baseY = qStartY + i * qlh + quoteFontSize * 0.85
      ctx.strokeStyle = "rgba(180,100,40,0.2)"; ctx.lineWidth = 0.75; ctx.setLineDash([2, 5])
      ctx.beginPath(); ctx.moveTo(16, baseY); ctx.lineTo(quoteWidth + 16, baseY); ctx.stroke()
    })
    ctx.setLineDash([])

    y += quoteBlockHeight
    for (let i = 0; i < metrics.afterLineCount; i++) {
      if (i % 2 === 0) { ctx.fillStyle = "rgba(180,140,80,0.06)"; ctx.fillRect(0, y + i * lh, containerWidth, lh) }
    }
  }, [metrics, pullQuoteLines, containerWidth, fontSize, quoteFontSize, quoteWidth])

  if (!body || !containerWidth) return null

  const lineHeight = fontSize * 1.55

  return (
    <div style={{ position: "relative", fontFamily: "'Times New Roman', serif" }}>
      {!activePullQuote && (
        <div style={{ position: "relative", zIndex: 2 }}>
          {sentences.map((sentence, i) => (
            <span key={i}
              onMouseEnter={() => setHoveredSentence(i)}
              onMouseLeave={() => setHoveredSentence(null)}
              onClick={() => onPullQuoteSelect(sentence)}
              style={{
                fontSize: `${fontSize}px`, lineHeight: 1.55,
                color: hoveredSentence === i ? "#8B3A0F" : "#1a1008",
                background: hoveredSentence === i ? "rgba(180,100,40,0.12)" : "transparent",
                cursor: "pointer",
                borderBottom: hoveredSentence === i ? "1.5px dashed #8B3A0F" : "1.5px solid transparent",
                transition: "all 0.15s ease", padding: "0 1px",
              }}
              title="Click to pull this quote"
            >
              {sentence}{" "}
            </span>
          ))}
          <div style={{ marginTop: "10px", fontFamily: "'Courier New', Courier, monospace", fontSize: "8px", color: "#9a7a5a", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            ↑ hover a sentence · click to pull quote
          </div>
        </div>
      )}

      {activePullQuote && metrics && (
        <div style={{ position: "relative" }}>
          <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1 }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            {bodySegments[0]?.text && (
              <p style={{ fontSize: `${fontSize}px`, lineHeight: 1.55, color: "#1a1008", margin: 0, marginBottom: `${lineHeight * 0.4}px`, textAlign: "left" }}>
                {bodySegments[0].text}
              </p>
            )}
            <div style={{ margin: `${lineHeight * 0.5}px 0`, paddingLeft: "16px", borderLeft: "4px solid #1a1008" }}>
              <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "8px", letterSpacing: "0.18em", color: "#7a5c3a", textTransform: "uppercase", marginBottom: "8px", fontWeight: "bold" }}>
                PULL QUOTE · {pullQuoteLines.length} LINE{pullQuoteLines.length !== 1 ? "S" : ""} · PRETEXT MEASURED
              </div>
              <blockquote style={{
                fontFamily: "'Times New Roman', serif", fontSize: `${quoteFontSize}px`,
                fontWeight: "700", fontStyle: "italic", color: "#1a1008",
                lineHeight: 1.3, margin: 0, width: `${quoteWidth}px`, maxWidth: "100%", wordBreak: "break-word",
              }}>
                "{activePullQuote}"
              </blockquote>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ height: "1.5px", flex: 1, background: "#1a1008", maxWidth: `${quoteWidth}px` }} />
                <button onClick={() => onPullQuoteSelect(null)} style={{
                  fontFamily: "'Courier New', Courier, monospace", fontSize: "8px",
                  letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "bold",
                  padding: "3px 8px", border: "1.5px solid #8B3A0F", borderRadius: "1px",
                  cursor: "pointer", background: "transparent", color: "#8B3A0F",
                }}>
                  ✕ REMOVE QUOTE
                </button>
              </div>
            </div>
            {bodySegments[1]?.text && (
              <p style={{ fontSize: `${fontSize}px`, lineHeight: 1.55, color: "#1a1008", margin: 0, marginTop: `${lineHeight * 0.4}px`, textAlign: "left" }}>
                {bodySegments[1].text}
              </p>
            )}
            {metrics && (
              <div style={{ marginTop: "12px", padding: "6px 10px", border: "1px dashed #c9b89a", fontFamily: "'Courier New', Courier, monospace", fontSize: "8px", color: "#7a5c3a", letterSpacing: "0.08em", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <span>BEFORE: {metrics.beforeLineCount} lines</span>
                <span>QUOTE: {metrics.quoteLineCount} lines</span>
                <span>AFTER: {metrics.afterLineCount} lines</span>
                <span>TOTAL BODY: {metrics.totalBodyLines} lines</span>
                <span style={{ color: "#8B3A0F" }}>✦ zero DOM reads</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}