import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const VIDEO_EXTS = new Set(['.mp4', '.webm'])

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lpljcfvhwwpgqeyincub.supabase.co'
const SUPABASE_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbGpjZnZod3dwZ3FleWluY3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzU5NDksImV4cCI6MjA4OTM1MTk0OX0.hfjxMIuTTZBofwuAGfyj1lAR2Os65k9T-CpS2MKrHMk'
const STORAGE_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public/backgrounds/`

export interface CustomBackground {
  id:    string
  label: string
  src:   string
  type:  'image' | 'video'
}

function makeLabel(filename: string, ext: string) {
  return path.basename(filename, ext)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase())
    .slice(0, 40)
}

export async function GET() {
  const items: CustomBackground[] = []

  // 1. Imagens locais (public/backgrounds/)
  try {
    const dir = path.join(process.cwd(), 'public', 'backgrounds')
    if (fs.existsSync(dir)) {
      for (const file of fs.readdirSync(dir)) {
        if (file.startsWith('.')) continue
        const ext = path.extname(file).toLowerCase()
        if (!IMAGE_EXTS.has(ext)) continue
        items.push({ id: `local-${file}`, label: makeLabel(file, ext), src: `/backgrounds/${file}`, type: 'image' })
      }
    }
  } catch {}

  // 2. Vídeos do Supabase Storage
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/backgrounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ prefix: '', limit: 200, sortBy: { column: 'name', order: 'asc' } }),
    })
    if (res.ok) {
      const files: { name: string }[] = await res.json()
      for (const f of files) {
        const ext = path.extname(f.name).toLowerCase()
        if (!VIDEO_EXTS.has(ext) && !IMAGE_EXTS.has(ext)) continue
        const type = VIDEO_EXTS.has(ext) ? 'video' : 'image'
        items.push({ id: `storage-${f.name}`, label: makeLabel(f.name, ext), src: `${STORAGE_PUBLIC}${encodeURIComponent(f.name)}`, type })
      }
    }
  } catch {}

  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'image' ? -1 : 1
    return a.label.localeCompare(b.label)
  })

  return NextResponse.json({ items })
}
