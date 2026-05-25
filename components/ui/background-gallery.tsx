'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X, Check, Play, Pause, ChevronLeft, ChevronRight,
  Sun, Moon, Sparkles, Film, Sliders, RotateCcw,
} from 'lucide-react'
import {
  useBackgroundStore,
  BACKGROUNDS,
  BackgroundItem,
  BgCategory,
  OverlayMode,
} from '@/store/background-store'
import type { CustomBackground } from '@/app/api/backgrounds/route'

/* ═══════════════════════════════════════════════════
   BackgroundGallery
   ─ Modal gallery like Bitrix24 theme picker
   ─ Category tabs: Todos / Escuro / Claro / Vídeo
   ─ Animated mini-preview per card
   ─ Overlay strength slider
   ─ Motion toggle
═══════════════════════════════════════════════════ */

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'all' | BgCategory | 'video' | 'photo' | 'custom'

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'all',      label: 'Todos',    Icon: Sparkles },
  { id: 'dark',     label: 'Escuro',   Icon: Moon     },
  { id: 'light',    label: 'Claro',    Icon: Sun      },
  { id: 'abstract', label: 'Abstrato', Icon: Sparkles },
  { id: 'photo',    label: 'Fotos',    Icon: Sun      },
  { id: 'video',    label: 'Vídeo',    Icon: Film     },
  { id: 'custom',   label: 'Meus Fundos', Icon: Sparkles },
]

const OVERLAY_OPTIONS: { value: OverlayMode; label: string }[] = [
  { value: 'none',   label: 'Nenhum'  },
  { value: 'light',  label: 'Leve'    },
  { value: 'auto',   label: 'Auto'    },
  { value: 'medium', label: 'Médio'   },
  { value: 'strong', label: 'Forte'   },
]

function BgCard({
  bg,
  isActive,
  onSelect,
}: {
  bg: BackgroundItem
  isActive: boolean
  onSelect: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (hovered) {
      el.play().catch(() => {})
    } else {
      el.pause()
      el.currentTime = 0
    }
  }, [hovered])

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{
        border: isActive
          ? '2px solid #6366f1'
          : '2px solid rgba(255,255,255,0.10)',
        boxShadow: isActive
          ? '0 0 0 3px rgba(99,102,241,0.35), 0 4px 20px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        transform: hovered && !isActive ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {/* Preview */}
      {bg.type === 'video' && bg.src ? (
        <>
          <div style={{ position: 'absolute', inset: 0, background: bg.preview }} />
          <video
            ref={videoRef}
            src={bg.src}
            muted
            loop
            playsInline
            preload="metadata"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
          {!hovered && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={12} fill="white" stroke="white" />
              </div>
            </div>
          )}
        </>
      ) : bg.type === 'image' && bg.src ? (
        /* Foto real — usa backgroundImage com a URL */
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${bg.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        /* CSS gradient ou animated */
        <div
          className={bg.cssClass ?? ''}
          style={
            !bg.cssClass
              ? { background: bg.preview, position: 'absolute', inset: 0 }
              : { position: 'absolute', inset: 0 }
          }
        />
      )}

      {/* Overlay vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            lineHeight: 1.2,
          }}
        >
          {bg.label}
        </span>
        {bg.isNew && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              background: '#6366f1',
              borderRadius: 4,
              padding: '2px 5px',
              letterSpacing: '0.04em',
            }}
          >
            NOVO
          </span>
        )}
      </div>

      {/* Active checkmark */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px rgba(99,102,241,0.6)',
          }}
        >
          <Check size={12} strokeWidth={3} color="#fff" />
        </div>
      )}
    </button>
  )
}

export function BackgroundGallery({ open, onClose }: Props) {
  const {
    activeId,
    overlayMode,
    overlayStrength,
    motionEnabled,
    setBackground,
    setOverlayMode,
    setOverlayStrength,
    setMotionEnabled,
    reset,
  } = useBackgroundStore()

  const [tab, setTab] = useState<Tab>('all')
  const [customBgs, setCustomBgs] = useState<CustomBackground[]>([])
  const [customLoading, setCustomLoading] = useState(false)

  // Fetch custom backgrounds when tab opens or user switches to 'custom'
  useEffect(() => {
    if (!open) return
    setCustomLoading(true)
    fetch('/api/backgrounds')
      .then(r => r.json())
      .then(d => setCustomBgs(d.items ?? []))
      .catch(() => setCustomBgs([]))
      .finally(() => setCustomLoading(false))
  }, [open])

  if (!open) return null

  // Build combined list: static BACKGROUNDS + custom as BackgroundItem shape
  const customAsItems: BackgroundItem[] = customBgs.map(c => ({
    id: c.id,
    label: c.label,
    category: 'cinematic' as BgCategory,
    type: c.type,
    src: c.src,
    preview: c.type === 'video'
      ? 'linear-gradient(135deg,#1a1a2e,#0f172a)'
      : 'linear-gradient(135deg,#374151,#6b7280)',
    contrastMode: 'dark' as const,
    defaultOverlay: c.type === 'video' ? 0.30 : 0.20,
  }))

  const filtered = tab === 'custom'
    ? customAsItems
    : BACKGROUNDS.filter(bg => {
        if (tab === 'all') return true
        if (tab === 'video') return bg.type === 'video'
        if (tab === 'photo') return bg.type === 'image'
        return bg.category === tab
      })

  const activeBg = BACKGROUNDS.find(b => b.id === activeId)

  return (
    <>
      {/* Full-screen wrapper — flexbox centers the panel reliably */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease forwards',
        }}
      >
      {/* Panel — stopPropagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(860px, 100%)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(10,8,28,0.96)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.10)',
          overflow: 'hidden',
          animation: 'scaleIn 0.22s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)) forwards',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              Fundo do Ambiente
            </h2>
            <p
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.50)',
                margin: '2px 0 0',
              }}
            >
              Escolha o plano de fundo do sistema
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.10)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.70)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '12px 24px 0',
            flexShrink: 0,
          }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: active
                    ? 'rgba(99,102,241,0.22)'
                    : 'rgba(255,255,255,0.05)',
                  border: active
                    ? '1px solid rgba(99,102,241,0.45)'
                    : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: '140px',
            gap: 10,
            alignContent: 'start',
          }}
        >
          {tab === 'custom' && customLoading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,0.40)', fontSize: 13, padding: '32px 0' }}>
              Carregando seus fundos…
            </div>
          )}
          {tab === 'custom' && !customLoading && filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 24px' }}>
              <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13, marginBottom: 8 }}>
                Nenhum arquivo encontrado em <code style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>public/backgrounds/</code>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: 11 }}>
                Adicione imagens (.jpg .png .webp) ou vídeos (.mp4 .webm) e faça git push
              </p>
            </div>
          )}
          {!(tab === 'custom' && customLoading) && tab !== 'custom' && filtered.length === 0 && (
            <div
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.30)',
                fontSize: 13,
                padding: '32px 0',
              }}
            >
              Nenhum fundo nesta categoria
            </div>
          )}
          {filtered.map(bg => (
            <BgCard
              key={bg.id}
              bg={bg}
              isActive={bg.id === activeId}
              onSelect={() => setBackground(bg.id)}
            />
          ))}
        </div>

        {/* Controls Footer */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          {/* Overlay mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Sobreposição
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {OVERLAY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setOverlayMode(opt.value)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: overlayMode === opt.value ? 600 : 500,
                    color: overlayMode === opt.value ? '#fff' : 'rgba(255,255,255,0.50)',
                    background: overlayMode === opt.value
                      ? 'rgba(99,102,241,0.25)'
                      : 'rgba(255,255,255,0.05)',
                    border: overlayMode === opt.value
                      ? '1px solid rgba(99,102,241,0.40)'
                      : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual strength slider — only when mode is 'none' override */}
          {overlayMode === 'none' || overlayMode === 'medium' || overlayMode === 'strong' || overlayMode === 'light' ? null : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span
                style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                Intensidade ({Math.round(overlayStrength * 100)}%)
              </span>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={overlayStrength}
                onChange={e => setOverlayStrength(parseFloat(e.target.value))}
                style={{ width: 120, accentColor: '#6366f1' }}
              />
            </div>
          )}

          {/* Motion toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 'auto' }}>
            <span
              style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Animação
            </span>
            <button
              onClick={() => setMotionEnabled(!motionEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                color: motionEnabled ? '#fff' : 'rgba(255,255,255,0.50)',
                background: motionEnabled
                  ? 'rgba(99,102,241,0.22)'
                  : 'rgba(255,255,255,0.07)',
                border: motionEnabled
                  ? '1px solid rgba(99,102,241,0.40)'
                  : '1px solid rgba(255,255,255,0.10)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {motionEnabled ? <Play size={12} /> : <Pause size={12} />}
              {motionEnabled ? 'Ativada' : 'Pausada'}
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={reset}
            title="Restaurar padrão"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.45)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.80)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            <RotateCcw size={11} />
            Padrão
          </button>
        </div>
      </div>
      </div>
    </>
  )
}
