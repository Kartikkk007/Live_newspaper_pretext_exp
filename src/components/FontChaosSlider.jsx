import { useEffect, useRef, useState } from "react"

const SIZES = [
  { label: "FINE PRINT", value: 12 },
  { label: "READABLE", value: 15 },
  { label: "STANDARD", value: 18 },
  { label: "BOLD EDITION", value: 22 },
  { label: "SHOUTING", value: 28 },
]

export default function FontChaosSlider({ fontSize, onFontSizeChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const [tickAnimation, setTickAnimation] = useState(false)
  const prevSize = useRef(fontSize)

  useEffect(() => {
    if (prevSize.current !== fontSize) {
      setTickAnimation(true)
      const t = setTimeout(() => setTickAnimation(false), 300)
      prevSize.current = fontSize
      return () => clearTimeout(t)
    }
  }, [fontSize])

  const currentLabel =
    SIZES.reduce((closest, s) =>
      Math.abs(s.value - fontSize) < Math.abs(closest.value - fontSize) ? s : closest
    ).label

  const percent = ((fontSize - 10) / (32 - 10)) * 100

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      borderBottom: "3px solid #1a1008",
      padding: "10px 24px",
      background: "#f5efe0",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        minWidth: "120px",
      }}>
        <span style={{
          fontSize: "9px",
          letterSpacing: "0.15em",
          color: "#7a5c3a",
          textTransform: "uppercase",
          fontWeight: "bold",
        }}>
          FONT CHAOS
        </span>
        <span style={{
          fontSize: "11px",
          letterSpacing: "0.1em",
          color: "#1a1008",
          fontWeight: "bold",
          transition: "all 0.2s",
          transform: tickAnimation ? "scale(1.08)" : "scale(1)",
        }}>
          {currentLabel}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: "160px", position: "relative" }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: "3px",
          background: "#c9b89a",
          transform: "translateY(-50%)",
          borderRadius: "2px",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${percent}%`,
            height: "100%",
            background: "#1a1008",
            transition: "width 0.1s",
          }} />
        </div>

        <input
          type="range"
          min={10}
          max={32}
          step={1}
          value={fontSize}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          style={{
            width: "100%",
            appearance: "none",
            background: "transparent",
            cursor: isDragging ? "grabbing" : "grab",
            height: "20px",
            position: "relative",
            zIndex: 1,
            outline: "none",
          }}
        />
      </div>

      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: "4px",
        minWidth: "60px",
      }}>
        <span style={{
          fontFamily: "'Times New Roman', serif",
          fontSize: "28px",
          fontWeight: "900",
          color: "#1a1008",
          lineHeight: 1,
          transition: "font-size 0.15s ease",
          letterSpacing: "-0.02em",
        }}>
          {fontSize}
        </span>
        <span style={{
          fontSize: "10px",
          color: "#7a5c3a",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          px
        </span>
      </div>

      <div style={{
        display: "flex",
        gap: "6px",
        flexWrap: "wrap",
      }}>
        {SIZES.map((s) => (
          <button
            key={s.label}
            onClick={() => onFontSizeChange(s.value)}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "8px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: "bold",
              padding: "4px 8px",
              border: "1.5px solid #1a1008",
              borderRadius: "2px",
              cursor: "pointer",
              transition: "all 0.15s",
              background: fontSize === s.value ? "#1a1008" : "transparent",
              color: fontSize === s.value ? "#f5efe0" : "#1a1008",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{
        fontSize: "9px",
        color: "#9a7a5a",
        letterSpacing: "0.08em",
        fontStyle: "italic",
        whiteSpace: "nowrap",
      }}>
        ↕ drag to reflow
      </div>
    </div>
  )
}