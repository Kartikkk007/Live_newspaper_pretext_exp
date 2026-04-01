import { useCallback } from "react"
import { prepareWithSegments, layoutNextLine } from "@chenglou/pretext"

export function useExclusionLayout() {
  const layoutWithExclusion = useCallback((
    text,
    fontSize,
    colWidth,
    colPageX,
    colPageY,
    exclusion
  ) => {
    if (!text || colWidth < 20) return { lines: [], totalHeight: 0 }

    const lineHeight = fontSize * 1.55
    const font = `400 ${fontSize}px Times New Roman, serif`

    let prepared
    try {
      prepared = prepareWithSegments(text, font)
    } catch {
      return { lines: [], totalHeight: 0 }
    }

    const lines = []
    let cursor = { segmentIndex: 0, graphemeIndex: 0 }
    let lineIndex = 0
    const MAX_LINES = 400

    while (lineIndex < MAX_LINES) {
      const lineY = colPageY + lineIndex * lineHeight
      const lineBottom = lineY + lineHeight

      let availableWidth = colWidth

      if (
        exclusion &&
        lineBottom > exclusion.top &&
        lineY < exclusion.bottom
      ) {
        const exLeft = exclusion.left - colPageX
        const exRight = exclusion.right - colPageX

        const overlapLeft = exLeft < colWidth && exRight > 0

        if (overlapLeft) {
          const clampedLeft = Math.max(0, exLeft)
          const clampedRight = Math.min(colWidth, exRight)
          const blockedWidth = clampedRight - clampedLeft

          if (clampedLeft < colWidth * 0.4) {
            availableWidth = colWidth - (clampedRight + 8)
          } else {
            availableWidth = clampedLeft - 8
          }

          availableWidth = Math.max(availableWidth, 40)
        }
      }

      const line = layoutNextLine(prepared, cursor, availableWidth)
      if (!line) break

      lines.push({
        text: line.text,
        width: line.width,
        availableWidth,
        lineIndex,
        isConstrained: availableWidth < colWidth,
        y: lineIndex * lineHeight,
      })

      cursor = line.end
      lineIndex++

      if (
        line.end.segmentIndex >= prepared.segments.length - 1 &&
        line.end.graphemeIndex >= (prepared.segments[prepared.segments.length - 1]?.length ?? 0)
      ) {
        break
      }
    }

    return {
      lines,
      totalHeight: lines.length * lineHeight,
    }
  }, [])

  return { layoutWithExclusion }
}