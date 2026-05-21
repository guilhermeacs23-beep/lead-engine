'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BgTheme =
  | 'bg-cosmos' | 'bg-ocean' | 'bg-carbon' | 'bg-nebula' | 'bg-abyss'
  | 'bg-forest' | 'bg-amber' | 'bg-violet' | 'bg-gold'   | 'bg-navy'

export interface KanbanColumn {
  id: string
  title: string
  color: string   // pode ser hex ou CSS gradient string
  fixed?: boolean
}

// Gradientes frio → quente para as colunas padrão
export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'novo',       title: 'Novo Lead',         color: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  { id: 'contactado', title: 'Contactado',         color: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { id: 'proposta',   title: 'Proposta',           color: 'linear-gradient(135deg,#f59e0b,#fb923c)' },
  { id: 'negociando', title: 'Negociando',         color: 'linear-gradient(135deg,#f97316,#ec4899)' },
  { id: 'fechado',    title: 'Finalizado Fechado', color: 'linear-gradient(135deg,#10b981,#34d399)', fixed: true },
  { id: 'perdido',    title: 'Finalizado Perdido', color: 'linear-gradient(135deg,#ef4444,#f43f5e)', fixed: true },
]

// Paleta de gradientes disponíveis para o usuário escolher
export const GRADIENT_PRESETS = [
  'linear-gradient(135deg,#6366f1,#818cf8)',   // indigo
  'linear-gradient(135deg,#3b82f6,#06b6d4)',   // azul-ciano
  'linear-gradient(135deg,#06b6d4,#10b981)',   // ciano-verde
  'linear-gradient(135deg,#10b981,#84cc16)',   // verde-lima
  'linear-gradient(135deg,#f59e0b,#fb923c)',   // âmbar-laranja
  'linear-gradient(135deg,#f97316,#ef4444)',   // laranja-vermelho
  'linear-gradient(135deg,#ec4899,#f43f5e)',   // rosa-vermelho
  'linear-gradient(135deg,#a855f7,#ec4899)',   // roxo-rosa
  'linear-gradient(135deg,#0ea5e9,#6366f1)',   // céu-índigo
  'linear-gradient(135deg,#34d399,#06b6d4)',   // esmeralda-ciano
  'linear-gradient(135deg,#fbbf24,#f472b6)',   // amarelo-rosa
  'linear-gradient(135deg,#64748b,#94a3b8)',   // cinza neutro
]

// Mantido para compatibilidade com o formulário de nova coluna
export const COLUMN_COLOR_OPTIONS = GRADIENT_PRESETS

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
