'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

// ─── Weekly rotating backgrounds ──────────────────────────────────────────────
// Alterna automaticamente a cada 7 dias — paisagens e animais fofinhos 🐾🌿
const BG_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85', // Lago de montanha
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1920&q=85', // Raposa na neve
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=85', // Floresta manhã
  'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1920&q=85', // Panda fofo
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85', // Islândia
  'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=1920&q=85', // Filhote de veado
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=85', // Fiordes Noruega
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=85', // Gato fofo
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1920&q=85', // Ouriço fofo
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=85', // Luz na floresta
  'https://images.unsplash.com/photo-1439853949212-36089c04f669?w=1920&q=85', // Valle paisagem
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=1920&q=85', // Coelho fofo
]

function getWeeklyBg(): string {
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return BG_IMAGES[weekIndex % BG_IMAGES.length]
}

export default function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')
  const [showPwd, setShowPwd] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
      setLoading(false)
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem('ld_session_date', today)
    window.location.href = '/home'
  }

  const bgUrl = getWeeklyBg()

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundImage: `url(${bgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Overlay escuro */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,25,0.42)' }} />

      {/* ── Branding centro-esquerda ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '0 0 0 12%',
      }}>
        {/* Nome */}
        <h1 style={{
          margin: 0, fontSize: 56, fontWeight: 900,
          letterSpacing: '-2px', lineHeight: 1, color: '#ffffff',
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        }}>
          Lead<span style={{ color: '#fb923c' }}>+</span>
        </h1>

        {/* Tagline */}
        <p style={{
          margin: '10px 0 4px', fontSize: 18, fontWeight: 400,
          color: 'rgba(255,255,255,0.80)',
          textShadow: '0 1px 8px rgba(0,0,0,0.4)',
          letterSpacing: '0.01em',
        }}>
          Inteligência que impulsiona
        </p>

        {/* Assinatura */}
        <p style={{
          margin: 0, fontSize: 12,
          color: 'rgba(255,255,255,0.40)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          by VALORA System Tecnology
        </p>
      </div>

      {/* ── Card de login ── */}
      <div style={{ position: 'relative', zIndex: 10, padding: '0 72px 0 0', flexShrink: 0 }}>
        <div style={{
          width: 400,
          background: '#ffffff',
          borderRadius: 24,
          padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.18)',
        }}>
          {/* Título */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>
              Fazer login no Lead<span style={{ color: '#E04F0A' }}>+</span>
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9ca3af' }}>Entre na sua conta</p>
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 18,
              color: '#dc2626', fontSize: 13,
            }}>
              <AlertCircle size={13} strokeWidth={1.5} />
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* E-mail */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#555' }}>
                E-mail
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 12,
                background: '#f8f8f8', border: '1.5px solid #ececec', transition: 'border 0.15s',
              }}>
                <Mail size={14} strokeWidth={1.5} style={{ color: '#bbb', flexShrink: 0 }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br" required
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#111' }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#555' }}>
                Senha
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 12,
                background: '#f8f8f8', border: '1.5px solid #ececec',
              }}>
                <Lock size={14} strokeWidth={1.5} style={{ color: '#bbb', flexShrink: 0 }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={senha} onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#111' }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', lineHeight: 0, padding: 0 }}>
                  {showPwd ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #E04F0A 0%, #bf3d00 100%)',
                boxShadow: '0 6px 20px rgba(224,79,10,0.4)',
                fontSize: 14, fontWeight: 700, color: '#fff',
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
              }}
            >
              {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />Entrando…</> : 'Entrar'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#ececec' }} />
            <span style={{ fontSize: 11, color: '#ccc' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: '#ececec' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#bbb', margin: 0 }}>
            Novo na equipe?{' '}
            <Link href="/cadastro" style={{ color: '#E04F0A', fontWeight: 700, textDecoration: 'none' }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        fontSize: 11, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.04em',
      }}>
        Lead+ · Prospecção inteligente para equipes de campo
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
