'use client'
import { useState, useEffect, useMemo } from 'react'
import { fetchCalendarActivities } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, X, Phone, Mail, Users, FileText, MessageSquare, TrendingUp, Loader2 } from 'lucide-react'

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ligacao:  { label: 'Ligação',   color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  icon: Phone          },
  email:    { label: 'E-mail',    color: '#34d399', bg: 'rgba(52,211,153,0.15)',  icon: Mail           },
  reuniao:  { label: 'Reunião',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  icon: Users          },
  nota:     { label: 'Nota',      color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', icon: FileText       },
  proposta: { label: 'Proposta',  color: '#f472b6', bg: 'rgba(244,114,182,0.15)', icon: TrendingUp     },
  status:   { label: 'Status',    color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: MessageSquare  },
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function CalendarioPage() {
  const today  = new Date()
  const [year,     setYear]     = useState(today.getFullYear())
  const [month,    setMonth]    = useState(today.getMonth())
  const [acts,     setActs]     = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<string | null>(null) // "YYYY-MM-DD"

  useEffect(() => {
    setLoading(true)
    fetchCalendarActivities(year, month).then(data => {
      setActs(data)
      setLoading(false)
    })
  }, [year, month])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  // Build calendar grid
  const { grid, totalDays } = useMemo(() => {
    const firstDay  = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const cells     = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    const grid = []
    for (let i = 0; i < cells.length; i += 7) grid.push(cells.slice(i, i + 7))
    return { grid, totalDays }
  }, [year, month])

  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {}
    acts.forEach(a => { if (!m[a.dataKey]) m[a.dataKey] = []; m[a.dataKey].push(a) })
    return m
  }, [acts])

  const dayKey = (d: number | null) =>
    d ? `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : ''

  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const selectedActs = selected ? (byDay[selected] ?? []) : []

  return (
    <div className="flex h-full overflow-hidden">

      {/* Calendar */}
      <div className="flex flex-1 flex-col overflow-auto p-5">

        {/* Header */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white"
              style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <ChevronLeft size={15} />
            </button>
            <h2 className="w-44 text-center text-[17px] font-bold text-white">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white"
              style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <ChevronRight size={15} />
            </button>
          </div>
          <span className="text-sm text-white/40">
            {loading ? 'Carregando…' : `${acts.length} atividades registradas`}
          </span>

          {/* Legenda */}
          <div className="ml-auto flex items-center gap-3">
            {Object.entries(TIPO_CONFIG).slice(0,4).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-[12px] text-white/55">
                <span className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                {v.label}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-white/40">
            <Loader2 size={18} className="animate-spin" />Carregando atividades…
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-xl"
            style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>

            {/* Weekday headers */}
            <div className="grid grid-cols-7"
              style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
              {WEEKDAYS.map(w => (
                <div key={w} className="py-2.5 text-center text-[12px] font-semibold text-white/40">{w}</div>
              ))}
            </div>

            {/* Rows */}
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7"
                style={{ borderBottom: wi < grid.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
                {week.map((day, di) => {
                  const key   = dayKey(day)
                  const dayActs = day ? (byDay[key] ?? []) : []
                  const isToday   = key === todayKey
                  const isSelected = key === selected
                  return (
                    <div key={di}
                      onClick={() => day && setSelected(isSelected ? null : key)}
                      className="relative min-h-[80px] cursor-pointer p-2 transition-all"
                      style={{
                        borderRight: di < 6 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                        background: isSelected
                          ? 'rgba(99,102,241,0.12)'
                          : day ? 'transparent' : 'rgba(0,0,0,0.15)',
                      }}
                    >
                      {day && (
                        <>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-medium ${
                            isToday
                              ? 'bg-indigo-500 text-white font-bold'
                              : 'text-white/70'
                          }`}>
                            {day}
                          </span>
                          {/* Activity dots */}
                          <div className="mt-1.5 flex flex-col gap-1">
                            {dayActs.slice(0, 3).map((a, i) => {
                              const cfg = TIPO_CONFIG[a.tipo]
                              return (
                                <div key={i}
                                  className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{ background: cfg?.bg ?? 'rgba(255,255,255,0.1)', color: cfg?.color ?? '#fff' }}>
                                  {a.empresa}
                                </div>
                              )
                            })}
                            {dayActs.length > 3 && (
                              <span className="text-[10px] text-white/35">+{dayActs.length - 3} mais</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side panel — selected day */}
      {selected && (
        <div className="flex w-72 shrink-0 flex-col overflow-hidden"
          style={{ borderLeft: '0.5px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center justify-between px-4 py-4"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
            <div>
              <p className="text-[14px] font-semibold text-white">
                {Number(selected.slice(8))} de {MONTHS[Number(selected.slice(5,7)) - 1]}
              </p>
              <p className="text-[12px] text-white/40">{selectedActs.length} atividade{selectedActs.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setSelected(null)}
              className="text-white/30 hover:text-white/60 transition-all">
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {selectedActs.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/30">Nenhuma atividade neste dia</p>
            ) : (
              selectedActs.map(a => {
                const cfg  = TIPO_CONFIG[a.tipo]
                const Icon = cfg?.icon
                return (
                  <div key={a.id} className="rounded-xl p-3.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md"
                        style={{ background: cfg?.bg ?? 'rgba(255,255,255,0.1)' }}>
                        {Icon && <Icon size={12} strokeWidth={1.5} style={{ color: cfg?.color }} />}
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: cfg?.color }}>{cfg?.label}</span>
                      <span className="ml-auto text-[11px] text-white/30">{formatTime(a.created_at)}</span>
                    </div>
                    <p className="text-[13px] font-semibold text-white">{a.empresa}</p>
                    {a.contato && <p className="text-[11px] text-white/45">{a.contato}</p>}
                    {a.descricao && (
                      <p className="mt-1.5 text-[12px] text-white/60 leading-relaxed">{a.descricao}</p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
