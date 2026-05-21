'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BgTheme =
  | 'bg-cosmos' | 'bg-ocean' | 'bg-carbon' | 'bg-nebula' | 'bg-abyss'
  | 'bg-forest' | 'bg-amber' | 'bg-violet' | 'bg-gold'   | 'bg-navy'

export interface KanbanColumn {
  id: string
  title: string
  color: string
  fixed?: boolean
}

export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'novo',       title: 'Novo Lead',          color: '#818cf8' },
  { id: 'contactado', title: 'Contactado',          color: '#60a5fa' },
  { id: 'proposta',   title: 'Proposta',            color: '#fbbf24' },
  { id: 'negociando', title: 'Negociando',          color: '#f472b6' },
  { id: 'fechado',    title: 'Finalizado Fechado',  color: '#34d399', fixed: true },
  { id: 'perdido',    title: 'Finalizado Perdido',  color: '#f87171', fixed: true },
]

export const COLUMN_COLOR_OPTIONS = [
  '#818cf8', '#60a5fa', '#fbbf24', '#f472b6',
  '#2dd4bf', '#fb923c', '#c084fc', '#f87171',
]

interface UIStore {
  bgTheme: BgTheme
  bgImage: string | null
  setBgTheme: (theme: BgTheme) => void
  setBgImage: (url: string | null) => void
  bgPanelOpen: boolean
  toggleBgPanel: () => void

  columns: KanbanColumn[]
  addColumn: (col: KanbanColumn) => void
  removeColumn: (id: string) => void
  renameColumn: (id: string, title: string) => void
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

      columns: DEFAULT_COLUMNS,
      addColumn: (col) => set((s) => {
        // Insert before the two fixed columns at the end
        const fixed = s.columns.filter(c => c.fixed)
        const mutable = s.columns.filter(c => !c.fixed)
        return { columns: [...mutable, col, ...fixed] }
      }),
      removeColumn: (id) => set((s) => ({
        columns: s.columns.filter(c => c.id !== id || c.fixed)
      })),
      renameColumn: (id, title) => set((s) => ({
        columns: s.columns.map(c => c.id === id ? { ...c, title } : c)
      })),
    }),
    { name: 'le-ui' }
  )
)
