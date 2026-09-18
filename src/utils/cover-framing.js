// How a cover sits in its frame: a focus point, in percent of the image, and a
// zoom factor. The focus is used as both object-position (which part survives
// a crop into a different shape) and transform-origin (which point a zoom
// closes in on), so one pair of numbers frames the cover everywhere it shows:
// the lead on /blog, the list thumbnails, and the top of the post.

export const ZOOM_MIN = 1
export const ZOOM_MAX = 3

export const DEFAULT_FRAMING = { x: 50, y: 50, zoom: 1 }

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// `coverFocus: 50% 30%` and `coverZoom: 1.2` from a post's frontmatter
export const parseFraming = (focus, zoom) => {
  const [x, y] = (String(focus ?? '').match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  const scale = Number(zoom)

  return {
    x: Number.isFinite(x) ? clamp(x, 0, 100) : DEFAULT_FRAMING.x,
    y: Number.isFinite(y) ? clamp(y, 0, 100) : DEFAULT_FRAMING.y,
    zoom: Number.isFinite(scale) ? clamp(scale, ZOOM_MIN, ZOOM_MAX) : DEFAULT_FRAMING.zoom,
  }
}

// Not rounded: a slow drag moves by fractions of a percent per event
export const clampFraming = ({ x, y, zoom }) => ({
  x: clamp(x, 0, 100),
  y: clamp(y, 0, 100),
  zoom: clamp(zoom, ZOOM_MIN, ZOOM_MAX),
})

// Inline style for the <img>. The zoom goes on `transform`, which composes with
// the `scale` property Tailwind's hover utilities use rather than replacing it.
export const framingStyle = ({ x, y, zoom }) => ({
  objectPosition: `${x}% ${y}%`,
  transformOrigin: `${x}% ${y}%`,
  transform: zoom === 1 ? undefined : `scale(${zoom})`,
})
