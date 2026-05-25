import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ═══════════════════════════════════════════════════
   AMBIENT BACKGROUND SYSTEM — Store
   Completamente separado do ThemeStore (cor ≠ fundo)
═══════════════════════════════════════════════════ */

export type BgType      = 'css-gradient' | 'css-animated' | 'particles' | 'video' | 'image'
export type BgCategory  = 'dark' | 'light' | 'nature' | 'abstract' | 'cinematic' | 'photo'
export type OverlayMode = 'auto' | 'none' | 'light' | 'medium' | 'strong'
export type ContrastMode = 'dark' | 'light'

export interface BackgroundItem {
  id:          string
  label:       string
  category:    BgCategory
  type:        BgType
  /** CSS gradient string used as thumbnail and as fallback */
  preview:     string
  /** CSS class applied to the background div (for animated gradients) */
  cssClass?:   string
  /** For video / static image */
  src?:        string
  /** Which text contrast to force: dark=white text, light=dark text */
  contrastMode: ContrastMode
  /** Suggested overlay intensity (0–1) */
  defaultOverlay: number
  isNew?:      boolean
}

export const BACKGROUNDS: BackgroundItem[] = [
  /* ── Dark / Espacial ── */
  {
    id: 'cosmos', label: 'Cosmos', category: 'dark', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.20,
    preview: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
    cssClass: 'bg-anim-cosmos',
  },
  {
    id: 'midnight', label: 'Midnight', category: 'dark', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.15,
    preview: 'linear-gradient(135deg,#0a0a1a,#0f0c29,#1a1040)',
    cssClass: 'bg-anim-midnight',
  },
  {
    id: 'carbon', label: 'Carbon', category: 'dark', type: 'css-gradient', contrastMode: 'dark', defaultOverlay: 0.10,
    preview: 'linear-gradient(135deg,#0d1117,#161b22,#0d1117)',
    cssClass: 'bg-carbon',
  },
  {
    id: 'abyss', label: 'Abismo', category: 'dark', type: 'css-gradient', contrastMode: 'dark', defaultOverlay: 0.12,
    preview: 'linear-gradient(135deg,#0a1628,#0d2137,#071520)',
    cssClass: 'bg-abyss',
  },

  /* ── Abstract / Animados ── */
  {
    id: 'nebula', label: 'Nebulosa', category: 'abstract', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.28, isNew: true,
    preview: 'linear-gradient(135deg,#1a0533,#6d28d9,#ec4899,#0f172a)',
    cssClass: 'bg-anim-nebula',
  },
  {
    id: 'aurora', label: 'Aurora', category: 'abstract', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.25, isNew: true,
    preview: 'linear-gradient(135deg,#042f2e,#065f46,#0891b2,#1e1b4b)',
    cssClass: 'bg-anim-aurora',
  },
  {
    id: 'sunset', label: 'Sunset', category: 'abstract', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#1a0a00,#7c2d12,#c2410c,#9d174d)',
    cssClass: 'bg-anim-sunset',
  },
  {
    id: 'violet-dream', label: 'Violet Dream', category: 'abstract', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.22, isNew: true,
    preview: 'linear-gradient(135deg,#1e1b4b,#4c1d95,#6d28d9,#2e1065)',
    cssClass: 'bg-anim-violet',
  },
  {
    id: 'ocean', label: 'Oceano', category: 'nature', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.20,
    preview: 'linear-gradient(135deg,#0c4a6e,#0369a1,#0ea5e9,#0c4a6e)',
    cssClass: 'bg-anim-ocean',
  },

  /* ── Claros ── */
  {
    id: 'frost', label: 'Frost', category: 'light', type: 'css-animated', contrastMode: 'light', defaultOverlay: 0.08,
    preview: 'linear-gradient(135deg,#f0f9ff,#e0f2fe,#f8fafc,#ede9fe)',
    cssClass: 'bg-anim-frost',
  },
  {
    id: 'sakura', label: 'Sakura', category: 'light', type: 'css-animated', contrastMode: 'light', defaultOverlay: 0.10, isNew: true,
    preview: 'linear-gradient(135deg,#fdf2f8,#fce7f3,#fbcfe8,#f5d0fe)',
    cssClass: 'bg-anim-sakura',
  },
  {
    id: 'parchment', label: 'Pergaminho', category: 'light', type: 'css-gradient', contrastMode: 'light', defaultOverlay: 0.05,
    preview: 'linear-gradient(135deg,#fffbeb,#fef3c7,#fde68a)',
    cssClass: 'bg-amber',
  },


  /* ── Fotográficos — Unsplash (gratuito) ── */
  {
    id: 'photo-alps',
    label: 'Alpes Suíços',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.28,
    preview: 'linear-gradient(135deg,#4a6fa5,#6b8cba,#2d4a6e)',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=85',
    isNew: true,
  },
  {
    id: 'photo-milkyway',
    label: 'Via Láctea',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.20,
    preview: 'linear-gradient(135deg,#0a0a1a,#1a1040,#2d1b5e)',
    src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=85',
    isNew: true,
  },
  {
    id: 'photo-aurora-real',
    label: 'Aurora Boreal',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.22,
    preview: 'linear-gradient(135deg,#042f2e,#065f46,#1e3a5f)',
    src: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=85',
    isNew: true,
  },
  {
    id: 'photo-ocean',
    label: 'Oceano Turquesa',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.25,
    preview: 'linear-gradient(135deg,#0369a1,#0ea5e9,#38bdf8)',
    src: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=85',
    isNew: true,
  },
  {
    id: 'photo-forest',
    label: 'Floresta',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.30,
    preview: 'linear-gradient(135deg,#14532d,#166534,#052e16)',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-desert',
    label: 'Deserto',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.30,
    preview: 'linear-gradient(135deg,#92400e,#b45309,#78350f)',
    src: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-city-night',
    label: 'Cidade à Noite',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.25,
    preview: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
    src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-mountains-fog',
    label: 'Montanhas Nevoeiro',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.22,
    preview: 'linear-gradient(135deg,#374151,#6b7280,#9ca3af)',
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-cherry-blossom',
    label: 'Cerejeiras',
    category: 'photo', type: 'image', contrastMode: 'light', defaultOverlay: 0.10,
    preview: 'linear-gradient(135deg,#fce7f3,#fbcfe8,#f9a8d4)',
    src: 'https://images.unsplash.com/photo-1490750967868-88df5691cc77?auto=format&fit=crop&w=1920&q=85',
    isNew: true,
  },
  {
    id: 'photo-winter',
    label: 'Inverno',
    category: 'photo', type: 'image', contrastMode: 'light', defaultOverlay: 0.12,
    preview: 'linear-gradient(135deg,#e0f2fe,#f0f9ff,#dbeafe)',
    src: 'https://images.unsplash.com/photo-1483921210049-ed13e3aae56a?auto=format&fit=crop&w=1920&q=85',
    isNew: true,
  },

  /* ── Cinemático (video — infra pronta, arquivo em /public/backgrounds/) ── */
  {
    id: 'clouds-video', label: 'Nuvens', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.45,
    preview: 'linear-gradient(135deg,#64748b,#94a3b8,#cbd5e1)',
    src: '/backgrounds/clouds.mp4',
  },
  {
    id: 'stars-video', label: 'Estrelas', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.35,
    preview: 'linear-gradient(135deg,#020617,#0f172a,#1e1b4b)',
    src: '/backgrounds/stars.mp4',
  },
  {
    id: 'aurora-video', label: 'Aurora (vídeo)', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#042f2e,#065f46,#0d9488)',
    src: '/backgrounds/aurora.mp4',
  },
]

export const CATEGORY_LABELS: Record<BgCategory, string> = {
  dark: 'Escuros', light: 'Claros', nature: 'Natureza',
  abstract: 'Abstrato', cinematic: 'Cinemático',
}

interface BackgroundState {
  activeId:       string
  overlayMode:    OverlayMode
  overlayStrength: number     // 0–1 (manual override)
  motionEnabled:  boolean
  particlesOn:    boolean
  galleryOpen:    boolean
  /* actions */
  setBackground:      (id: string) => void
  setOverlayMode:     (m: OverlayMode) => void
  setOverlayStrength: (v: number) => void
  setMotionEnabled:   (v: boolean) => void
  toggleMotion:       () => void
  toggleParticles:    () => void
  setGalleryOpen:     (v: boolean) => void
  reset:              () => void
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      activeId:        'cosmos',
      overlayMode:     'auto',
      overlayStrength: 0,
      motionEnabled:   true,
      particlesOn:     false,
      galleryOpen:     false,

      setBackground:      (id) => set({ activeId: id }),
      setOverlayMode:     (m)  => set({ overlayMode: m }),
      setOverlayStrength: (v)  => set({ overlayStrength: v }),
      setMotionEnabled:   (v)  => set({ motionEnabled: v }),
      toggleMotion:       ()   => set((s) => ({ motionEnabled: !s.motionEnabled })),
      toggleParticles:    ()   => set((s) => ({ particlesOn: !s.particlesOn })),
      setGalleryOpen:     (v)  => set({ galleryOpen: v }),
      reset: () => set({ activeId: 'cosmos', overlayMode: 'auto', overlayStrength: 0, motionEnabled: true }),
    }),
    { name: 'le-background', partialize: (s) => ({ activeId: s.activeId, overlayMode: s.overlayMode, overlayStrength: s.overlayStrength, motionEnabled: s.motionEnabled }) }
  )
)

/** Resolve effective overlay based on bg + mode */
export function resolveOverlay(bg: BackgroundItem, mode: OverlayMode, manualStrength: number): number {
  if (mode === 'none') return 0
  if (mode !== 'auto') {
    const fixed = { light: 0.20, medium: 0.38, strong: 0.55 }
    return fixed[mode] ?? 0.30
  }
  return manualStrength > 0 ? manualStrength : bg.defaultOverlay
}
