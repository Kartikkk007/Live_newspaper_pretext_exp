import { useState, useCallback } from "react"
import { useNewsData } from "./hooks/useNewsData"
import NewspaperLayout from "./components/NewspaperLayout"
import FontChaosSlider from "./components/FontChaosSlider"
import DraggableMasthead from "./components/DraggableMasthead"

const TAGLINE = "ALL THE NEWS THAT FITS — MEASURED TO THE PIXEL"

function DateLine() {
  const now = new Date()
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  return now.toLocaleDateString("en-US", options).toUpperCase()
}

function EditionBadge({ source }) {
  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "8px", letterSpacing: "0.14em",
      color: source === "api" ? "#2a5c2a" : "#7a5c3a",
      border: `1px solid ${source === "api" ? "#2a5c2a" : "#c9b89a"}`,
      padding: "2px 7px", borderRadius: "1px",
      textTransform: "uppercase", fontWeight: "bold", whiteSpace: "nowrap",
    }}>
      {source === "api" ? "✦ LIVE FEED" : "◆ ARCHIVE EDITION"}
    </div>
  )
}

function CrawlingHeadlines({ articles }) {
  const text = articles.length > 0
    ? articles.map((a, i) => `${i + 1}. ${a.headline}`).join("   ◆   ")
    : "FETCHING LATEST DISPATCHES FROM THE WIRE..."

  const duration = Math.max(20, text.length / 8)

  return (
    <div style={{
      overflow: "hidden",
      borderTop: "1.5px solid #1a1008",
      borderBottom: "1.5px solid #1a1008",
      background: "#1a1008",
      padding: "5px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{
          flexShrink: 0, background: "#8B3A0F", padding: "0 12px",
          fontFamily: "'Courier New', Courier, monospace", fontSize: "9px",
          fontWeight: "bold", letterSpacing: "0.18em", color: "#f5efe0",
          textTransform: "uppercase", whiteSpace: "nowrap", zIndex: 2,
          alignSelf: "stretch", display: "flex", alignItems: "center",
          borderRight: "2px solid #f5efe0",
        }}>
          BREAKING
        </div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{
            display: "inline-flex", whiteSpace: "nowrap",
            animation: `crawl ${duration}s linear infinite`,
            paddingLeft: "100%",
          }}>
            {[0, 1].map((k) => (
              <span key={k} style={{
                fontFamily: "'Times New Roman', serif", fontSize: "13px",
                fontWeight: "700", color: "#f5efe0", letterSpacing: "0.04em",
                paddingRight: "80px", opacity: k === 1 ? 0.6 : 1,
              }}>
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes crawl { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  )
}

function Masthead({ source, articleCount, fontSize, articles, onExclusionChange }) {
  return (
    <header style={{ background: "#f5efe0", borderBottom: "4px double #1a1008", paddingBottom: "0" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "8px", flexWrap: "wrap", gap: "6px",
        }}>
          <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "8px", letterSpacing: "0.12em", color: "#7a5c3a", textTransform: "uppercase" }}>
            <DateLine />
          </div>
          <EditionBadge source={source} />
          <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "8px", letterSpacing: "0.12em", color: "#7a5c3a", textTransform: "uppercase" }}>
            {articleCount} STORIES · FONT {fontSize}PX
          </div>
        </div>

        <DraggableMasthead onExclusionChange={onExclusionChange} />

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "12px", paddingBottom: "10px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "#1a1008", maxWidth: "120px" }} />
          <p style={{
            fontFamily: "'Courier New', Courier, monospace", fontSize: "8.5px",
            letterSpacing: "0.2em", color: "#7a5c3a", margin: 0, textTransform: "uppercase",
          }}>
            {TAGLINE}
          </p>
          <div style={{ flex: 1, height: "1px", background: "#1a1008", maxWidth: "120px" }} />
        </div>
      </div>
      <CrawlingHeadlines articles={articles} />
    </header>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: "#f5efe0", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Times New Roman', serif", gap: "16px",
    }}>
      <div style={{ fontSize: "48px", fontWeight: "900", color: "#1a1008", letterSpacing: "-0.03em", animation: "blink 1.1s step-end infinite" }}>
        STOP THE PRESSES
      </div>
      <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "10px", letterSpacing: "0.2em", color: "#7a5c3a", textTransform: "uppercase" }}>
        Fetching the latest · measuring every glyph
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: "6px", height: "6px", background: "#1a1008", borderRadius: "50%",
            animation: `dotBounce 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes dotBounce { from { transform: translateY(0); opacity: 0.3; } to { transform: translateY(-8px); opacity: 1; } }
      `}</style>
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace", fontSize: "9px",
      letterSpacing: "0.12em", color: "#8B3A0F",
      background: "rgba(139,58,15,0.08)", border: "1px dashed #8B3A0F",
      padding: "6px 12px", textAlign: "center", textTransform: "uppercase",
    }}>
      ⚠ API NOTE: {message} — displaying archive edition
    </div>
  )
}

export default function App() {
  const [fontSize, setFontSize] = useState(15)
  const [exclusion, setExclusion] = useState(null)
  const { articles, loading, error, source } = useNewsData()

  const handleExclusionChange = useCallback((ex) => {
    setExclusion(ex)
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <div style={{
      minHeight: "100vh", background: "#e8e0cc",
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(180,140,80,0.06) 31px, rgba(180,140,80,0.06) 32px)`,
    }}>
      <FontChaosSlider fontSize={fontSize} onFontSizeChange={setFontSize} />

      <div style={{
        maxWidth: "960px", margin: "0 auto", background: "#f5efe0",
        boxShadow: "0 0 0 1px rgba(26,16,8,0.12), 4px 4px 0 rgba(26,16,8,0.08), 8px 8px 0 rgba(26,16,8,0.04)",
        minHeight: "100vh",
      }}>
        <Masthead
          source={source} articleCount={articles.length}
          fontSize={fontSize} articles={articles}
          onExclusionChange={handleExclusionChange}
        />

        {error && <ErrorBanner message={error} />}

        <div style={{ padding: "0 24px" }}>
          <div style={{
            fontFamily: "'Courier New', Courier, monospace", fontSize: "7.5px",
            letterSpacing: "0.14em", color: "#9a7a5a", textTransform: "uppercase",
            padding: "8px 0 6px", borderBottom: "1px solid #c9b89a", marginBottom: "0",
            display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px",
          }}>
            <span>⬡ powered by pretext · zero dom reads · all layout computed in js</span>
            <span>grab a letter from the masthead · drag it into the articles below</span>
          </div>

          {articles.map((article, i) => (
            <NewspaperLayout
              key={article.id}
              article={article}
              fontSize={fontSize}
              isFirst={i === 0}
              exclusion={exclusion}
            />
          ))}
        </div>

        <footer style={{
          borderTop: "3px double #1a1008", padding: "12px 24px",
          fontFamily: "'Courier New', Courier, monospace", fontSize: "8px",
          letterSpacing: "0.12em", color: "#9a7a5a",
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px",
          background: "#f5efe0",
        }}>
          <span>THE PRETEXT CHRONICLE · EST. 2025</span>
          <span>LAYOUT ENGINE: @CHENGLOU/PRETEXT</span>
          <span>NO GETBOUNDINGCLIENTRECT WAS HARMED IN THIS PRODUCTION</span>
        </footer>
      </div>
    </div>
  )
}