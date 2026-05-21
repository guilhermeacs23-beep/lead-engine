'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BgTheme =
  | 'bg-cosmos' | 'bg-ocean' | 'bg-carbon' | 'bg-nebula' | 'bg-abyss'
  | 'bg-forest' | 'bg-amber' | 'bg-violet' | 'bg-gold'   | 'bg-navy'

interface UIStore {
  bgTheme: BgTheme
  bgImage: string | null
  setBgTheme: (theme: BgTheme) => void
  setBgImage: (url: string | null) => void
  bgPanelOpen: boolean
  toggleBgPanel: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      bgTheme: 'bg-cosmos',
      bgImage: null,
      bgPanelOpen: false,
      setBgTheme: (bgTheme) => set({ bgTheme, bgImage: null }),
      setBgImage:  (bgImage)  => set({ bgImage }),
      toggleBgPanel: () => set((s) => ({ bgPanelOpen: !s.bgPanelOpen })),
    }),
    { name: 'le-ui' }
  )
)
