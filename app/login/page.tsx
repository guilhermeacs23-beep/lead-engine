'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

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
    window.location.href = '/dashboard'
    
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-end overflow-hidden"
      style={{
        backgroundImage: 'url(/telainicia.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* overlay muito sutil para não escurecer demais o fundo claro */}
      <div className="absolute inset-0" style={{ background: 'rgba(240,245,255,0.25)' }} />

      {/* branding no canto inferior esquerdo — estilo Bitrix */}
      <div className="absolute bottom-10 left-12 z-10">
        <p className="text-sm font-medium" style={{ color: 'rgba(30,40,80,0.55)' }}>
          Plataforma de prospecção inteligente
        </p>
      </div>

      {/* Card — branco, deslocado para a direita */}
      <div
        className="relative z-10 w-full max-w-[400px] rounded-2xl px-10 py-10 mr-16 mt-0"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          border: '0.5px solid rgba(255,255,255,0.9)',
        }}
      >
        {/* Logo + nome */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="/logo-engine.png"
            alt="Lead Engine"
            className="h-14 w-14 object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
              Lead Engine
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: '#64748b' }}>
              Acesse sua conta
            </p>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-600"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={13} strokeWidth={1.5} />
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: '#475569' }}>
              E-mail
            </label>
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Mail size={14} strokeWidth={1.5} style={{ color: '#94a3b8' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com.br" required
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#0f172a' }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: '#475569' }}>
              Senha
            </label>
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Lock size={14} strokeWidth={1.5} style={{ color: '#94a3b8' }} />
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#0f172a' }}
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
              boxShadow: '0 4px 16px rgba(29,78,216,0.35)',
            }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" />Entrando…</> : 'Entrar'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
          <span className="text-[11px]" style={{ color: '#94a3b8' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
        </div>

        <p className="text-center text-xs" style={{ color: '#94a3b8' }}>
          Novo na equipe?{' '}
          <Link href="/cadastro" className="font-medium transition-colors" style={{ color: '#1d4ed8' }}>
            Criar conta
          </Link>
        </p>
      </di