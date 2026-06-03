'use client'

import { useEffect, useRef, useState } from 'react'
import { useBackgroundStore, resolveOverlay, BACKGROUNDS, BackgroundItem } from '@/store/background-store'

/* ═══════════════════════════════════════════════════
   BackgroundProvider
   ─ Renders the fixed fullscreen background layer
   ─ Handles: css-gradient, css-animated, video, image
   ─ Page Visibility API: pauses video when tab hidden
   ─ Smart overlay: rgba(0,0,0,strength) on top
   ─ Ambient glow: subtle radial at bottom for depth
═══════════════════════════════════════════════════ */

export function BackgroundProvider() {
  const { activeId, overlayMode, overlayStrength, motionEnabled, customBgSrc, customBgType } = useBackgroundStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  // Se o id não está nos BACKGROUNDS, usa customBgSrc (vídeos/imagens de "Meus Fundos")
  const customFallback: BackgroundItem | undefined = (!BACKGROUNDS.find(b => b.id === activeId) && customBgSrc) ? {
    id: activeId, label: 'Custom', category: 'cinematic', type: customBgType ?? 'video', src: customBgSrc,
    preview: 'linear-gradient(135deg,#1a1a2e,#0f172a)', contrastMode: 'dark', defaultOverlay: 0.30,
  } : undefined
  const bg: BackgroundItem | undefined =
    BACKGROUNDS.find(b => b.id === activeId) ?? customFallback ?? BACKGROUNDS[0]

  const overlay = resolveOverlay(bg, overlayMode, overlayStrength)

  /* ── Sync contrastMode → data-contrast on <html> ─ */
  useEffect(() => {
    const mode = bg?.contrastMode ?? 'dark'
    document.documentElement.setAttribute('data-contrast', mode)
    return () => document.documentElement.removeAttribute('data-contrast')
  }, [bg?.contrastMode])

  /* ── Pause / resume video on tab visibility ─── */
  useEffect(() => {
    if (bg?.type !== 'video') return
    const el = videoRef.current
    if (!el) return

    const handleVisibility = () => {
      if (document.hidden) {
        el.pause()
      } else {
        el.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [bg?.type])

  /* ── Respect motionEnabled — pause/play ─────── */
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (!motionEnabled) {
      el.pause()
    } else {
      el.play().catch(() => {})
    }
  }, [motionEnabled])

  /* ── Reset video-ready when bg changes ─────── */
  useEffect(() => {
    setVideoReady(false)
  }, [activeId])

  if (!bg) return null

  /* ── CSS Gradient (static) ─────────────────── */
  if (bg.type === 'css-gradient') {
    return (
      <div
        className="bg-layer"
        style={{ background: bg.preview }}
        aria-hidden="true"
      >
        {overlay > 0 && (
          <div
            className="bg-overlay"
            style={{ background: `rgba(0,0,0,${overlay})` }}
          />
        )}
      </div>
    )
  }

  /* ── CSS Animated Gradient ─────────────────── */
  if (bg.type === 'css-animated') {
    return (
      <div
        className={`bg-layer ${motionEnabled ? (bg.cssClass ?? '') : ''}`}
        style={
          !motionEnabled
            ? { background: bg.preview }
            : undefined
        }
        aria-hidden="true"
      >
        {overlay > 0 && (
          <div
            className="bg-overlay"
            style={{ background: `rgba(0,0,0,${overlay})` }}
          />
        )}
        {/* Ambient depth glow at bottom */}
        <div
          className="bg-overlay"
          style={{
            background: 'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(0,0,0,0.30) 0%, transparent 70%)',
          }}
        />
      </div>
    )
  }

  /* ── Image ─────────────────────────────────── */
  if (bg.type === 'image' && bg.src) {
    return (
      <div
        className="bg-layer"
        style={{
          backgroundImage: `url(${bg.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden="true"
      >
        {overlay > 0 && (
          <div
            className="bg-overlay"
            style={{ background: `rgba(0,0,0,${overlay})` }}
          />
        )}
      </div>
    )
  }

  /* ── Video ─────────────────────────────────── */
  if (bg.type === 'video' && bg.src) {
    return (
      <div className="bg-layer" aria-hidden="true">
        {/* Fallback shown while video loads */}
        {!videoReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: bg.preview,
              transition: 'opacity 0.6s ease',
            }}
          />
        )}
        <video
          key={bg.src ?? bg.id}
          ref={videoRef}
          src={bg.src}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
        {overlay > 0 && (
          <div
            className="bg-overlay"
            style={{ background: `rgba(0,0,0,${overlay})` }}
          />
        )}
        {/* Subtle vignette */}
        <div
          className="bg-overlay"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.25) 100%)',
          }}
        />
      </div>
    )
  }

  /* ── Particles placeholder ─────────────────── */
  if (bg.type === 'particles') {
    return (
      <div
        className="bg-layer"
        style={{ background: bg.preview }}
        aria-hidden="true"
      >
        {/* TODO: integrate tsparticles when needed */}
        {overlay > 0 && (
          <div
            className="bg-overlay"
            style={{ background: `rgba(0,0,0,${overlay})` }}
          />
        )}
      </div>
    )
  }

  return null
}
