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
  { id: 'novo',       title: 'Novo Lead',         color: '#7c3aed' },
  { id: 'contactado', title: 'Contactado',         color: '#2563eb' },
  { id: 'proposta',   title: 'Proposta',           color: '#d97706' },
  { id: 'negociando', title: 'Negociando',         color: '#db2777' },
  { id: 'fechado',    title: 'Finalizado Fechado', color: '#059669', fixed: true },
  { id: 'perdido',    title: 'Finalizado Perdido', color: '#dc2626', fixed: true },
]

// Paleta sólida estilo PowerPoint — 6 colunas × 4 linhas
export const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb923c',
  '#64748b', '#475569', '#7c3aed', '#2563eb', '#0369a1', '#059669',
]

// Alias para compatibilidade
export const GRADIENT_PRESETS = COLOR_PALETTE
export const COLUMN_COLOR_OPTIONS = COLOR_PALETTE

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
  changeColumnColor: (id: string, color: string) => void
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
        const fixed   = s.columns.filter(c => c.fixed)
        const mutable = s.columns.filter(c => !c.fixed)
        return { columns: [...mutable, col, ...fixed] }
      }),
      removeColumn: (id) => set((s) => ({
        columns: s.columns.filter(c => c.id !== id || c.fixed)
      })),
      renameColumn: (id, title) => set((s) => ({
        columns: s.columns.map(c => c.id === id ? { ...c, title } : c)
      })),
      changeColumnColor: (id, color) => set((s) => ({
        columns: s.columns.map(c => c.id === id ? { ...c, color } : c)
      })),
    }),
    { name: 'le-ui' }
  )
)
