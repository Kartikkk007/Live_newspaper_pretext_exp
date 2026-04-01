# The Pretext Chronicle

A live newspaper layout engine built with React + Vite that demonstrates the full power
of the [Pretext](https://github.com/chenglou/pretext) library by @chenglou —
a pure JavaScript/TypeScript library for multiline text measurement and layout
that operates with zero DOM reads.

## What is this?

Most web apps that need to know how text will lay out are forced to measure it by
injecting it into the DOM and reading back properties like `getBoundingClientRect`
or `offsetHeight`. This triggers layout reflow — one of the most expensive operations
a browser can perform.

Pretext eliminates this entirely. It implements its own text measurement logic using
the browser's font engine via Canvas as ground truth, giving you precise line counts,
line widths, and layout geometry before a single pixel is painted.

This project puts that capability on full display inside a retro tabloid-style
live newspaper, fed by real headlines from the Guardian Open Platform API.

## Features

### Live Guardian News Feed
Pulls real articles from the Guardian API on load. Falls back to a set of
static archive articles if no API key is configured, so the app always works.

### Multi-Column Reflow Engine
Article body text is distributed across two balanced columns using a binary search
algorithm that calls Pretext's `prepare()` + `layout()` to measure line counts —
never touching the DOM. Columns rebalance instantly on every font size change or
window resize via a `ResizeObserver`.

### Binary-Search Headline Stretcher
Each article headline is automatically scaled to snap to exactly 1, 2, or 3 lines
within its container. Pretext runs up to 20 iterations of binary search to find the
precise pixel font size that achieves the target line count. Toggle between 1L, 2L,
and 3L per article and watch the headline resize instantly.

### Click-to-Pull Quote Injector
Hover over any sentence in the first column and click to pull it out as a large
typographic block quote. Pretext remeasures the before and after body segments plus
the quote itself — three separate layout passes — and the column reflows around it.
A debug bar shows live line counts for each segment, all derived from Pretext with
zero DOM reads.

### Font Chaos Slider
A sticky toolbar at the top of the page lets you drag a slider from 10px to 32px.
Every component — columns, headlines, pull quotes — remeasures and reflows
simultaneously via Pretext on every change. Five preset buttons (Fine Print →
Shouting) snap to common sizes.

### Pretext Geometry Overlays
Every column and headline renders a canvas overlay drawn from Pretext's line arrays,
showing amber baseline guides, red x-height guides, and alternating line band shading —
making the invisible typographic grid visible.

### Crawling News Ticker
A Breaking News ticker crawls all live article headlines continuously across the
masthead in classic tabloid style, with seamless looping and speed proportional
to total headline length.

## Tech Stack

| Tool | Role |
|---|---|
| React + Vite | UI framework and dev server |
| @chenglou/pretext | Text measurement and layout engine |
| Guardian Open Platform API | Live news content |
| Canvas API | Geometry overlays drawn from Pretext output |
| ResizeObserver | Triggers reflow on container width changes |

## Getting Started

### 1. Clone and install

git clone https://github.com/your-username/pretext-newspaper.git
cd pretext-newspaper
npm install

### 2. Get a free Guardian API key

Sign up at https://open-platform.theguardian.com
It is completely free and works directly from the browser with no backend needed.

### 3. Add your key

Create a .env file in the project root:

VITE_GUARDIAN_API_KEY=your_key_here

### 4. Run

npm run dev

If you skip the API key the app will load with a set of built-in fallback articles
so you can still explore all the layout features.

## How Pretext is Used

| Feature | Pretext API |
|---|---|
| Column line count measurement | `prepare()` + `layout()` |
| Headline binary search | `prepare()` + `layout()` × 20 iterations |
| Pull quote line arrays | `prepareWithSegments()` + `layoutWithLines()` |
| Canvas baseline overlays | Drawn from `layoutWithLines().lines` |
| Font chaos reflow | All of the above, triggered on every slider change |

Every number you see in the metrics bars — line counts, column widths, font sizes,
iteration counts — comes directly from Pretext output. There is not a single call to
`getBoundingClientRect`, `offsetHeight`, or any other DOM measurement API anywhere
in the codebase.

## Deployment

Deployed on Vercel. Add your Guardian API key as an environment variable:

VITE_GUARDIAN_API_KEY=your_key_here

The VITE_ prefix is required for Vite to expose the variable to the browser bundle
via import.meta.env.

## Credits

- [Pretext](https://github.com/chenglou/pretext) by [@chenglou](https://github.com/chenglou)
- [Guardian Open Platform](https://open-platform.theguardian.com) for the news feed
