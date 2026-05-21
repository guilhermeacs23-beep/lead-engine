'use client'
import { LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
  features: string[]
}

export function ComingSoon({ icon: Icon, title, description, features }: ComingSoonProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">

        {/* Ícone com glow */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '0.5px solid rgba(99,102,241,0.3)',
            boxShadow: '0 0 32px rgba(99,102,241,0.15)',
          }}>
          <Icon size={28} strokeWidth={1.5} className="text-indigo-400" />
        </div>

        <h2 className="mb-3 text-2xl font-semibold text-white">{title}</h2>

        <span className="mb-4 inline-block rounded-full px-3 py-1 text-sm font-medium"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '0.5px solid rgba(245,158,11,0.3)' }}>
          Em desenvolvimento
        </span>

        <p className="mb-8 text-sm leading-relaxed text-white/60">{description}</p>

        <div className="rounded-xl p-4 text-left"
          style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/50">
            Funcionalidades previstas
          </p>
          <ul className="flex flex-col gap-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[14px] font-medium text-white">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
