import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `R$ ${(value / 1_000).toFixed(0)}k`
  return formatCurrency(value)
}

export function getScoreColor(score: number): { color: string; bg: string } {
  if (score >= 80) return { color: '#34d399', bg: 'rgba(16,185,129,0.15)' }
  if (score >= 60) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)'  }
  return              { color: '#f87171',  bg: 'rgba(239,68,68,0.15)'   }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}
