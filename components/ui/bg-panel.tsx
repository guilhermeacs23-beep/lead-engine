'use client'
import React from 'react'
import { useUIStore } from '@/store/ui-store'
import { useEffect, useRef } from 'react'
import { Upload } from 'lucide-react'

const THEMES = [
  { id: 'bg-cosmos',  label: 'Cosmos',       g: '#0f0c29,#302b63,#24243e' },
  { id: 'bg-ocean',   label: 'Oceano',       g: '#1a1a2e,#16213e,#0f3460' },
  { id: 'bg-carbon',  label: 'Carbono',      g: '#0d1117,#161b22,#0d1117' },
  { id: 'bg-nebula',  label: 'Nebulosa',     g: '#1a0533,#12052e,#0a0a1a' },
  { id: 'bg-abyss',   label: 'Abissal',      g: '#0a1628,#0d2137,#071520' },
  { id: 'bg-forest',  label: 'Floresta',     g: '#0b3d2e,#0f4c35,#072519' },
  { id: 'bg-amber',   label: 'Âmbar',        g: '#2d1b00,#3d2200,#1a0f00' },
  { id: 'bg-violet',  label: 'Violeta',      g: '#1a0020,#2d0035,#0d0015' },
  { id: 'bg-gold',    label: 'Dourado',      g: '#1a1500,#2d2400,#0d0c00' },
  { id: 'bg-navy',    label: 'Marinho',      g: '#001a2d,#00263d,#000d1a' },
] as const

type ThemeId = typeof THEMES[number]['id']

export function BgPanel() {
  const { bgTheme, bgPanelOpen, toggleBgPanel, setBgTheme, setBgImage } = useUIStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (bgPanelOpen) toggleBgPanel()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [bgPanelOpen, toggleBgPanel])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setBgImage(url)
    toggleBgPanel()
  }

  if (!bgPanelOpen) return null

  return (
    <div ref={panelRef}
      className="absolute right-4 top-[56px] z-50 w-64 animate-slide-up rounded-xl p-4"
      style={{
        background: 'rgba(10,8,30,0.88)',
        backdropFilter: 'blur(32px)',
        border: '0.5px solid rgba(255,255,255,0.15)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      <p className="mb-3 text-xs font-medium text-white/80">Personalizar fundo</p>

      <p className="mb-2 text-[10px] text-white/35">Temas do sistema</p>
      <div className="grid grid-cols-5 gap-1.5">
        {THEMES.map(({ id, label, g }) => (
          <button key={id} title={label} onClick={() => setBgTheme(id as ThemeId)}
            className="aspect-video w-full rounded-md transition-all duration-150"
            style={{
              background: `linear-gradient(135deg, ${g.split(',').join(', ')})`,
              border: bgTheme === id
                ? '2px solid #a78bfa'
                : '2px solid transparent',
              outline: bgTheme === id ? '1px solid rgba(167,139,250,0.3)' : 'none',
            }}
          />
        ))}
      </div>

      <p className="mb-2 mt-4 text-[10px] text-white/35">Imagem personalizada</p>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-white/45 transition-all hover:bg-white/[0.07] hover:text-white/70"
        style={{ border: '0.5px dashed rgba(255,255,255,0.20)' }}
      >
        <Upload size={12} strokeWidth={1.5} />
        Carregar do computador
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
