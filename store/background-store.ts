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
  /** Poster/thumbnail image URL for video cards */
  poster?:     string
  /** Which text contrast to force: dark=white text, light=dark text */
  contrastMode: ContrastMode
  /** Suggested overlay intensity (0–1) */
  defaultOverlay: number
  isNew?:      boolean
}

export const BACKGROUNDS: BackgroundItem[] = [
  /* ── Dark / Escuro ── */
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
    preview: 'linear-gradient(160deg,#000000,#0a0a0a,#050510)',
  },
  /* ── Abstract ── */
  {
    id: 'aurora', label: 'Aurora', category: 'abstract', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.25,
    preview: 'linear-gradient(135deg,#00c6ff,#0072ff,#7928ca)',
    cssClass: 'bg-anim-aurora',
  },
  {
    id: 'ocean', label: 'Oceano', category: 'nature', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.20,
    preview: 'linear-gradient(135deg,#0066cc,#004499,#001133)',
    cssClass: 'bg-anim-ocean',
  },
  /* ── Light ── */
  {
    id: 'frost', label: 'Frost', category: 'light', type: 'css-animated', contrastMode: 'light', defaultOverlay: 0.08,
    preview: 'linear-gradient(135deg,#e8f4f8,#dde8f0,#cce0ee)',
    cssClass: 'bg-anim-frost',
  },
  {
    id: 'white-clean',
    label: 'Branco', category: 'light', type: 'css-gradient', contrastMode: 'light', defaultOverlay: 0,
    preview: 'linear-gradient(135deg,#ffffff,#f8f9fa)',
  },
  {
    id: 'light-gray',
    label: 'Cinza Claro', category: 'light', type: 'css-gradient', contrastMode: 'light', defaultOverlay: 0,
    preview: 'linear-gradient(135deg,#f0f2f5,#e8ecf1,#f0f2f5)',
  },
  {
    id: 'light-blue',
    label: 'Azul Claro', category: 'light', type: 'css-gradient', contrastMode: 'light', defaultOverlay: 0,
    preview: 'linear-gradient(135deg,#eef2ff,#e0e7ff,#f0f4ff)',
  },
  /* ── Vivid Gradients ── */
  {
    id: 'neon-pulse',
    label: 'Neon Pulse', category: 'abstract', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.22, isNew: true,
    preview: 'linear-gradient(135deg,#ff006e,#8338ec,#3a86ff)',
    cssClass: 'bg-anim-neon',
  },
  {
    id: 'royal-mesh',
    label: 'Royal', category: 'abstract', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.22, isNew: true,
    preview: 'linear-gradient(135deg,#141e30,#243b55,#3c1053)',
    cssClass: 'bg-anim-royal',
  },
  {
    id: 'candy',
    label: 'Candy', category: 'abstract', type: 'css-animated', contrastMode: 'dark', defaultOverlay: 0.18, isNew: true,
    preview: 'linear-gradient(135deg,#fc5c7d,#6a3093,#2196f3)',
    cssClass: 'bg-anim-candy',
  },

  /* ══════════════════════════════════════════════
     FOTOS — Unsplash (todas testadas e ativas)
  ══════════════════════════════════════════════ */
  {
    id: 'photo-alps',
    label: 'Alpes Suíços',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.20,
    preview: 'linear-gradient(135deg,#2d5a3d,#4a7c5b,#6b9e7a)',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-milkyway',
    label: 'Via Láctea',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.15,
    preview: 'linear-gradient(135deg,#0a0a2e,#1a1a4e,#2d1b69)',
    src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-aurora-real',
    label: 'Aurora Boreal',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.20,
    preview: 'linear-gradient(135deg,#0a2a1a,#1a5a3a,#0d4a6b)',
    src: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-ocean',
    label: 'Oceano Turquesa',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.18,
    preview: 'linear-gradient(135deg,#006994,#0096a0,#00b4b0)',
    src: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-forest',
    label: 'Floresta',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.22,
    preview: 'linear-gradient(135deg,#1a3a1a,#2d5a2d,#1a4a2a)',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-desert',
    label: 'Deserto',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.25,
    preview: 'linear-gradient(135deg,#c5853a,#d4a55a,#b8743a)',
    src: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-city-night',
    label: 'Cidade à Noite',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.20,
    preview: 'linear-gradient(135deg,#0a0a1a,#1a1a3a,#0f0f2a)',
    src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-mountains-fog',
    label: 'Montanhas Nevoeiro',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.25,
    preview: 'linear-gradient(135deg,#374151,#6b7280,#9ca3af)',
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-cherry-blossom',
    label: 'Cerejeiras',
    category: 'photo', type: 'image', contrastMode: 'light', defaultOverlay: 0.10,
    preview: 'linear-gradient(135deg,#fce7f3,#fbcfe8,#f9a8d4)',
    src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&q=85',
    isNew: true,
  },
  {
    id: 'photo-winter',
    label: 'Inverno',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.18,
    preview: 'linear-gradient(135deg,#e8f4f8,#d0e8f0,#b8d8e8)',
    src: 'https://images.unsplash.com/photo-1483921210049-ed13e3aae56a?auto=format&fit=crop&w=1920&q=85',
  },

  /* ── Novas fotos ── */
  {
    id: 'photo-tokyo-night',
    label: 'Tóquio',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.18, isNew: true,
    preview: 'linear-gradient(135deg,#0a0a2a,#1a0a3a,#2a1a4a)',
    src: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-architecture',
    label: 'Arquitetura',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.22, isNew: true,
    preview: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
    src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-tropical',
    label: 'Tropical',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.15, isNew: true,
    preview: 'linear-gradient(135deg,#006994,#0096a0,#2ecc71)',
    src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-snow-peaks',
    label: 'Picos Nevados',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.20, isNew: true,
    preview: 'linear-gradient(135deg,#c8d6df,#9eb8c8,#6a92aa)',
    src: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-earth-space',
    label: 'Terra do Espaço',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.12, isNew: true,
    preview: 'linear-gradient(135deg,#000010,#001a40,#002060)',
    src: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-desert-road',
    label: 'Estrada no Deserto',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.20, isNew: true,
    preview: 'linear-gradient(135deg,#c5853a,#8b5e3c,#5c3d2e)',
    src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-nebula-real',
    label: 'Nebulosa',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.18, isNew: true,
    preview: 'linear-gradient(135deg,#1a0a2e,#2d1a5a,#4a2a8a)',
    src: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-dark-office',
    label: 'Escritório',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.25, isNew: true,
    preview: 'linear-gradient(135deg,#0d0d0d,#1a1a1a,#0a0a0a)',
    src: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-volcano',
    label: 'Vulcão',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.28, isNew: true,
    preview: 'linear-gradient(135deg,#3d0000,#7a1a00,#b34700)',
    src: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 'photo-abstract-glass',
    label: 'Vidro Abstrato',
    category: 'photo', type: 'image', contrastMode: 'dark', defaultOverlay: 0.20, isNew: true,
    preview: 'linear-gradient(135deg,#1a2a4a,#2a4a6a,#1a3a5a)',
    src: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?auto=format&fit=crop&w=1920&q=85',
  },

  /* ── Vídeos — Supabase Storage ── */
  {
    id: 'vid-107027', label: 'Partículas', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#0a0a2e,#1a1a4e,#2d1b69)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/107027-674703679_medium.mp4',
  },
  {
    id: 'vid-121311', label: 'Nuvens', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.35, isNew: true,
    preview: 'linear-gradient(135deg,#374151,#6b7280,#9ca3af)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/121311-724697082_medium.mp4',
  },
  {
    id: 'vid-121490', label: 'Oceano', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#006994,#0096a0,#00b4b0)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/121490-724709875_medium.mp4',
  },
  {
    id: 'vid-121601', label: 'Galáxia', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.25, isNew: true,
    preview: 'linear-gradient(135deg,#1a0533,#12052e,#0a0a1a)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/121601-724710302_medium.mp4',
  },
  {
    id: 'vid-121702', label: 'Floresta', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.35, isNew: true,
    preview: 'linear-gradient(135deg,#0b3d2e,#0f4c35,#072519)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/121702-724719441_medium.mp4',
  },
  {
    id: 'vid-155242', label: 'Cidade', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.35, isNew: true,
    preview: 'linear-gradient(135deg,#0a0a1a,#1a1a3a,#0f0f2a)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/155242-809619008_medium.mp4',
  },
  {
    id: 'vid-156116', label: 'Montanhas', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#374151,#4b5563,#6b7280)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/156116-811878064_medium.mp4',
  },
  {
    id: 'vid-165208', label: 'Aurora', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.25, isNew: true,
    preview: 'linear-gradient(135deg,#0a2a1a,#1a5a3a,#0d4a6b)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/165208-832102298_medium.mp4',
  },
  {
    id: 'vid-165229', label: 'Espaço', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.20, isNew: true,
    preview: 'linear-gradient(135deg,#000010,#001a40,#002060)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/165229-832460001_medium.mp4',
  },
  {
    id: 'vid-176072', label: 'Fogo', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.35, isNew: true,
    preview: 'linear-gradient(135deg,#3d0000,#7a1a00,#b34700)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/176072-854875280_medium.mp4',
  },
  {
    id: 'vid-178809', label: 'Natureza', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#1a3a1a,#2d5a2d,#1a4a2a)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/178809-860734631_medium.mp4',
  },
  {
    id: 'vid-17925', label: 'Abstrato', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/17925-286994396_medium.mp4',
  },
  {
    id: 'vid-180624', label: 'Chuva', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.40, isNew: true,
    preview: 'linear-gradient(135deg,#1a2a3a,#2a3a4a,#0a1a2a)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/180624-864656657_medium.mp4',
  },
  {
    id: 'vid-184324', label: 'Tecnologia', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#0a1628,#0d2137,#071520)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/184324-873170054_medium.mp4',
  },
  {
    id: 'vid-191684', label: 'Ondas', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.30, isNew: true,
    preview: 'linear-gradient(135deg,#006994,#004499,#001133)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/191684-891315375_medium.mp4',
  },
  {
    id: 'vid-28236', label: 'Deserto', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.35, isNew: true,
    preview: 'linear-gradient(135deg,#c5853a,#d4a55a,#b8743a)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/28236-368501609_medium.mp4',
  },
  {
    id: 'vid-53640', label: 'Neon', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.25, isNew: true,
    preview: 'linear-gradient(135deg,#ff006e,#8338ec,#3a86ff)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/53640-473869916_medium.mp4',
  },
  {
    id: 'vid-blue-gradient', label: 'Gradiente Azul', category: 'cinematic', type: 'video', contrastMode: 'dark', defaultOverlay: 0.20, isNew: true,
    preview: 'linear-gradient(135deg,#001a2d,#00263d,#000d1a)',
    src: 'https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/backgrounds/Blue%20Dark%20Blue%20Gradient%20Color%20and%20Style%20Video%20Background.mp4',
  },
]

/* ─── Utility ──────────────────────────────────── */

export function resolveOverlay(
  bg: BackgroundItem,
  mode: OverlayMode,
  manualStrength: number,
): number {
  if (mode === 'none')   return 0
  if (mode === 'light')  return 0.12
  if (mode === 'medium') return 0.35
  if (mode === 'strong') return 0.55
  if (mode === 'auto')   return bg.defaultOverlay
  return manualStrength
}

/* ─── Store ─────────────────────────────────────── */

interface BackgroundState {
  activeId:        string
  overlayMode:     OverlayMode
  overlayStrength: number
  motionEnabled:   boolean
  particlesOn:     boolean
  galleryOpen:     boolean

  setBackground:      (id: string) => void
  setOverlayMode:     (mode: OverlayMode) => void
  setOverlayStrength: (v: number) => void
  setMotionEnabled:   (v: boolean) => void
  toggleMotion:       () => void
  toggleParticles:    () => void
  customBgSrc:        string | null
  customBgType:       'video' | 'image' | null
  setCustomBg:        (src: string, type: 'video' | 'image') => void
  setGalleryOpen:     (v: boolean) => void
  reset:              () => void
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      activeId:        'white-clean',
      overlayMode:     'auto',
      overlayStrength: 0.25,
      motionEnabled:   true,
      particlesOn:     false,
      galleryOpen:     false,

      customBgSrc:  null,
      customBgType: null,
      setCustomBg: (src, type) => set({ customBgSrc: src, customBgType: type }),
      setBackground:      (id) => set({ activeId: id, customBgSrc: null, customBgType: null }),
      setOverlayMode:     (mode) => set({ overlayMode: mode }),
      setOverlayStrength: (v) => set({ overlayStrength: v }),
      setMotionEnabled:   (v) => set({ motionEnabled: v }),
      toggleMotion:       () => set((s) => ({ motionEnabled: !s.motionEnabled })),
      toggleParticles:    () => set((s) => ({ particlesOn: !s.particlesOn })),
      setGalleryOpen:     (v) => set({ galleryOpen: v }),
      reset:              () => set({ activeId: 'white-clean', overlayMode: 'auto', overlayStrength: 0.25 }),
    }),
    {
      name: 'lead-engine-background',
      partialize: (s) => ({
        activeId:        s.activeId,
        overlayMode:     s.overlayMode,
        overlayStrength: s.overlayStrength,
        motionEnabled:   s.motionEnabled,
        particlesOn:     s.particlesOn,
        customBgSrc:     s.customBgSrc,
        customBgType:    s.customBgType,
        // galleryOpen is transient — not persisted
      }),
    },
  ),
)
