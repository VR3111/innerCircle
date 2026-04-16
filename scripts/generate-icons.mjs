/**
 * Generates PWA icons for Inner Circle using pure JavaScript (pngjs).
 * Draws the ◈ logo: dark background + outer diamond ring + filled inner diamond.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { PNG } from 'pngjs'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// ── colour palette ────────────────────────────────────────────────────────────
const BG    = { r: 10,  g: 10,  b: 10,  a: 255 }  // #0A0A0A
const WHITE = { r: 255, g: 255, b: 255, a: 255 }
const CLEAR = { r: 0,   g: 0,   b: 0,   a: 0   }

// ── geometry helpers ──────────────────────────────────────────────────────────

/** Distance from point (px,py) to the line segment (ax,ay)→(bx,by). */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

/** Signed distance from (px,py) to the interior of a convex polygon. Negative = inside. */
function sdfConvex(px, py, pts) {
  let minDist = Infinity
  let inside = true
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[(i + 1) % n]
    // Edge normal (pointing outward for CCW polygon)
    const nx = -(by - ay), ny = bx - ax
    const len = Math.hypot(nx, ny)
    const d = ((px - ax) * nx + (py - ay) * ny) / len
    if (d > 0) inside = false
    minDist = Math.min(minDist, distToSegment(px, py, ax, ay, bx, by))
  }
  return inside ? -minDist : minDist
}

// ── icon renderer ─────────────────────────────────────────────────────────────

function renderIcon(size) {
  const png = new PNG({ width: size, height: size, filterType: -1 })
  const c = size / 2          // centre
  const pad = size * 0.10     // padding around the diamond

  // Outer diamond vertices (axis-aligned rhombus)
  const outerR = c - pad
  const outerDiamond = [
    [c,        c - outerR],   // top
    [c + outerR, c       ],   // right
    [c,        c + outerR],   // bottom
    [c - outerR, c       ],   // left
  ]

  // Inner diamond (filled gem) — 42 % of outer radius
  const innerR = outerR * 0.42
  const innerDiamond = [
    [c,        c - innerR],
    [c + innerR, c       ],
    [c,        c + innerR],
    [c - innerR, c       ],
  ]

  // Ring stroke half-width (scales with size)
  const strokeHW = outerR * 0.065

  // Anti-aliasing feather distance (1 px equivalent)
  const aa = 1.2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4

      // Is this pixel inside the outer-ring area?
      const dOuter = sdfConvex(x + 0.5, y + 0.5, outerDiamond)
      const dInner = sdfConvex(x + 0.5, y + 0.5, innerDiamond)

      // Ring: pixels that are inside the outer diamond outline
      // We approximate the ring by pixels within strokeHW of the outer diamond edge
      const ringDist = Math.abs(dOuter) - strokeHW   // > 0 means outside ring band
      const onRing   = ringDist < aa

      // Filled inner diamond
      const inInner  = dInner <= aa

      if (inInner || onRing) {
        // Alpha: 1 at centre of shape, fades at edge for anti-aliasing
        const alpha = inInner
          ? Math.min(1, Math.max(0, (aa - dInner) / aa))
          : Math.min(1, Math.max(0, (aa - ringDist) / aa))

        const a = Math.round(alpha * 255)
        png.data[idx]     = WHITE.r
        png.data[idx + 1] = WHITE.g
        png.data[idx + 2] = WHITE.b
        png.data[idx + 3] = a
      } else {
        // Background
        png.data[idx]     = BG.r
        png.data[idx + 1] = BG.g
        png.data[idx + 2] = BG.b
        png.data[idx + 3] = BG.a
      }
    }
  }

  return PNG.sync.write(png)
}

// ── generate files ────────────────────────────────────────────────────────────

const icons = [
  { name: 'icon-192x192.png',     size: 192 },
  { name: 'icon-512x512.png',     size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of icons) {
  const buf = renderIcon(size)
  const dest = join(publicDir, name)
  writeFileSync(dest, buf)
  console.log(`  ✓  ${name}  (${size}×${size})`)
}

console.log('\nPWA icons written to /public')
