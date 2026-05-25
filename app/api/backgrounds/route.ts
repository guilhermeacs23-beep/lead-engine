import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/* ═══════════════════════════════════════════════════
   GET /api/backgrounds
   Lê public/backgrounds/ e retorna lista de arquivos
   Suporte: .jpg .jpeg .png .webp .gif → image
            .mp4 .webm               → video
═══════════════════════════════════════════════════ */

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const VIDEO_EXTS = new Set(['.mp4', '.webm'])

export interface CustomBackground {
  id:    string
  label: string
  src:   string
  type:  'image' | 'video'
}

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'backgrounds')

    // If folder doesn't exist yet, return empty array
    if (!fs.existsSync(dir)) {
      return NextResponse.json({ items: [] })
    }

    const files = fs.readdirSync(dir)
    const items: CustomBackground[] = []

    for (const file of files) {
      // Skip hidden files and .gitkeep
      if (file.startsWith('.')) continue

      const ext = path.extname(file).toLowerCase()
      if (!IMAGE_EXTS.has(ext) && !VIDEO_EXTS.has(ext)) continue

      const type = VIDEO_EXTS.has(ext) ? 'video' : 'image'

      // Build a readable label from filename
      const nameWithoutExt = path.basename(file, ext)
      const label = nameWithoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

      items.push({
        id:    `custom-${nameWithoutExt}`,
        label,
        src:   `/backgrounds/${file}`,
        type,
      })
    }

    // Sort: images first, then videos; alphabetically within each group
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'image' ? -1 : 1
      return a.label.localeCompare(b.label)
    })

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[/api/backgrounds]', err)
    return NextResponse.json({ items: [] })
  }
}
