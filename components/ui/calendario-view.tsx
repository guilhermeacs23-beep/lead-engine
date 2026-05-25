'use client'
import { useState, useEffect, useMemo } from 'react'
import { fetchCalendarActivities } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, X, Phone, Mail, Users, FileText, MessageSquare, TrendingUp, Loader2 } from 'lucide-react'

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ligacao:  { label: 'Ligação',   color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  icon: Phone       },
  email:    { label: 'E-mail',    color: '#34d399', bg: 'rgba(52,211,153,0.15)',  icon: Mail        },
  reuniao:  { label: 'Reunião',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  icon: Users       },
  nota:     { label: 'Nota',      color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', icon: FileText    },
  proposta: { label: 'Proposta',  color: '#f472b6', bg: 'rgba(244,114,182,0.15)', icon: TrendingUp  },
  status:   { label: 'Status',    color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: MessageSquare },
}

const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function CalendarioView() {
  const today  = new Date()
  const [year,     setYear]     = useState(today.getFullYear())
  const [month,    setMonth]    = useState(today.getMonth())
  const [acts,     setActs]     = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchCalendarActivities(year, month).then(data => {
      setActs(data)
      setLoading(false)
    })
  }, [year, month])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelected(null)
  }

  const { grid } = useMemo(() => {
    const firstDay  = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    const grid = []
    for (let i = 0; i < cells.length; i += 7) grid.push(cells.slice(i, i + 7))
    return { grid }
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
      <div className="flex flex-1 flex-col overflow-auto p-4">

        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all"
              style={{ border: '1px solid #e5e7eb' }}>
              <ChevronLeft size={14} />
            </button>
            <span className="w-40 text-center text-[15px] font-bold text-gray-800">{MONTHS[month]} {year}</span>
            <button onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-all"
              style={{ border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <ChevronRight size={14} />
            </button>
          </div>
          <span className="text-sm text-gray-400">
            {loading ? 'Carregando…' : `${acts.length} atividades`}
          </span>
          <div className="ml-auto hidden items-center gap-3 sm:flex">
            {Object.entries(TIPO_CONFIG).slice(0,4).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="h-2 w-2 rounded-full" style={{ background: v.color }} />{v.label}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 size={18} className="animate-spin" />Carregando atividades…
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-xl"
            style={{ border: '1px solid #e5e7eb' }}>
            {/* Weekday headers */}
            <div className="grid grid-cols-7"
              style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {WEEKDAYS.map(w => (
                <div key={w} className="py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase">{w}</div>
              ))}
            </div>
            {/* Days */}
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7"
                style={{ borderBottom: wi < grid.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                {week.map((day, di) => {
                  const key = dayKey(day)
                  const dayActs = day ? (byDay[key] ?? []) : []
                  const isToday    = key === todayKey
                  const isSelected = key === selected
                  return (
                    <div key={di}
                      onClick={() => day && setSelected(isSelected ? null : key)}
                      className="relative min-h-[72px] cursor-pointer p-1.5 transition-all"
                      style={{
                        borderRight: di < 6 ? '1px solid #e5e7eb' : 'none',
                        background: isSelected ? '#eef2ff' : day ? '#fff' : '#f9fafb',
                      }}>
                      {day && (
                        <>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium ${
                            isToday ? 'bg-indigo-500 text-white font-bold' : 'text-gray-700'
                          }`}>{day}</span>
                          <div className="mt-1 flex flex-col gap-0.5">
                            {dayActs.slice(0, 2).map((a, i) => {
                              const cfg = TIPO_CONFIG[a.tipo]
                              return (
                                <div key={i} className="truncate rounded px-1 py-0.5 text-[9px] font-medium"
                                  style={{ background: cfg?.bg ?? 'rgba(255,255,255,0.1)', color: cfg?.color ?? '#6b7280' }}>
                                  {a.empresa}
                                </div>
                              )
                            })}
                            {dayActs.length > 2 && (
                              <span className="text-[9px] text-gray-400">+{dayActs.length - 2}</span>
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

      {/* Day detail panel */}
      {selected && (
        <div className="flex w-64 shrink-0 flex-col overflow-hidden"
          style={{ borderLeft: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">
                {Number(selected.slice(8))} de {MONTHS[Number(selected.slice(5,7)) - 1]}
              </p>
              <p className="text-[11px] text-gray-400">{selectedActs.length} atividade{selectedActs.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-all">
              <X size={13} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {selectedActs.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhuma atividade</p>
            ) : selectedActs.map(a => {
              const cfg  = TIPO_CONFIG[a.tipo]
              const Icon = cfg?.icon
              return (
                <div key={a.id} className="rounded-xl p-3"
                  style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md"
                      style={{ background: cfg?.bg ?? 'rgba(255,255,255,0.1)' }}>
                      {Icon && <Icon size={10} strokeWidth={1.5} style={{ color: cfg?.color }} />}
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: cfg?.color }}>{cfg?.label}</span>
                    <span className="ml-auto text-[10px] text-gray-400">{formatTime(a.created_at)}</span>
                  </div>
                  <p className="text-[12px] font-semibold text-gray-800">{a.empresa}</p>
                  {a.contato && <p className="text-[10px] text-gray-400">{a.contato}</p>}
                  {a.descricao && <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">{a.descricao}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
