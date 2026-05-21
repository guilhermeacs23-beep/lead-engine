'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

function LELogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="s1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#ccd8ea" />
          <stop offset="100%" stopColor="#8fa0b8" />
        </linearGradient>
        <linearGradient id="s2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#b0c4dc" />
          <stop offset="100%" stopColor="#6a80a0" />
        </linearGradient>
      </defs>
      <path d="M5 8 L5 40 L18 40 L18 36 L9 36 L9 8 Z" fill="url(#s1)" />
      <path d="M5 8 L7 10 L7 36 L18 36 L18 40 L5 40 Z" fill="white" opacity="0.25" />
      <path d="M22 8 L22 40 L26 40 L26 8 Z" fill="url(#s1)" />
      <path d="M22 8 L39 8 L39 12 L22 12 Z" fill="url(#s2)" />
      <path d="M22 22 L36 22 L36 26 L22 26 Z" fill="url(#s2)" />
      <path d="M22 36 L39 36 L39 40 L22 40 Z" fill="url(#s2)" />
      <path d="M22 8 L39 8 L39 9.5 L22 9.5 Z" fill="white" opacity="0.4" />
      <path d="M22 22 L36 22 L36 23.5 L22 23.5 Z" fill="white" opacity="0.3" />
      <path d="M22 36 L39 36 L39 37.5 L22 37.5 Z" fill="white" opacity="0.3" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')

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
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 55% 30%, #1a4a8a 0%, #0d2d6b 35%, #071840 70%, #030c24 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(100,160,255,0.10) 0%, transparent 60%)' }} />

      <div
        className="relative z-10 w-full max-w-sm rounded-2xl px-8 py-9"
        style={{
          background: 'rgba(0,0,0,0.72)',
          border: '0.5px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="mb-8 flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(145deg, #0d2d6b, #0a1f4e)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <LELogo size={40} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.95)', letterSpacing: '0.05em' }}>
              Lead Engine
            </h1>
            <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Acesse sua conta</p>
          </div>
        </div>

        {erro && (
          <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-300"
            style={{ background: 'rgba(239,68,68,0.10)', border: '0.5px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={13} strokeWidth={1.5} />
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <div>
            <p className="mb-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>E-mail</p>
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <Mail size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com.br" required
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Senha</p>
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}>
              <Lock size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 0 28px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" />Entrando…</> : 'Entrar'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <p className="text-center text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Novo na equipe?{' '}
          <Link href="/cadastro" className="transition-colors" style={{ color: 'rgba(147,197,253,0.85)' }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
