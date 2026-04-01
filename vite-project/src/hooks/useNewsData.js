import { useState, useEffect } from "react"
import { fallbackArticles } from "../data/fallbackArticles"

const GUARDIAN_API = "https://content.guardianapis.com/search"

export function useNewsData() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState("api")

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GUARDIAN_API_KEY

    if (!apiKey || apiKey === "get_your_key_at_open-platform.theguardian.com") {
      console.warn("No Guardian API key found — using fallback articles.")
      setArticles(fallbackArticles)
      setSource("fallback")
      setLoading(false)
      return
    }

    const url = `${GUARDIAN_API}?api-key=${apiKey}&show-fields=bodyText,headline&page-size=4&order-by=newest&lang=en`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Guardian API error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const results = data.response.results

        const formatted = results
          .filter((item) => item.fields?.bodyText && item.fields?.headline)
          .map((item) => ({
            id: item.id,
            headline: item.fields.headline,
            body: item.fields.bodyText
              .replace(/<[^>]+>/g, "")
              .replace(/\s+/g, " ")
              .trim(),
          }))

        if (formatted.length === 0) throw new Error("No usable articles returned")

        setArticles(formatted)
        setSource("api")
      })
      .catch((err) => {
        console.error("Falling back to static articles:", err.message)
        setArticles(fallbackArticles)
        setSource("fallback")
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  return { articles, loading, error, source }
}