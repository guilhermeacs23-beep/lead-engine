'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

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
    // Salva data do login para expiração diária
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem('ld_session_date', today)
    window.location.href = '/dashboard'
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — imagem de fundo */}
      <div
        className="hidden lg:flex flex-col justify-end flex-1 p-12"
        style={{
          backgroundImage: 'url(/bg-leadplus.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ background: 'rgba(0,0,0,0.45)', padding: '24px 28px', borderRadius: 16, maxWidth: 400 }}>
          <p className="text-white font-bold text-xl mb-2">Lead+</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Plataforma de prospecção inteligente para equipes de campo.
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div
        className="flex flex-1 items-center justify-center px-8 py-12 lg:max-w-[480px]"
        style={{ background: '#ffffff' }}
      >
        <div className="w-full max-w-[380px]">
          {/* Logo + nome */}
          <div className="mb-10 flex flex-col items-center gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                border: '1.5px solid #e5e5e5',
                boxShadow: '0 4px 16px rgba(224,79,10,0.15)',
              }}
            >
              <img src="/logo-leadplus.png" alt="Lead+" className="h-12 w-12 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#111' }}>
                Lead<span style={{ color: '#E04F0A' }}>+</span>
              </h1>
              <p className="mt-1 text-sm" style={{ color: '#888' }}>Entre na sua conta</p>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="mb-5 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-600"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <AlertCircle size={13} strokeWidth={1.5} />
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* E-mail */}
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#555' }}>E-mail</label>
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3"
                style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
                <Mail size={14} strokeWidth={1.5} style={{ color: '#aaa' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br" required
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: '#111' }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#555' }}>Senha</label>
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3"
                style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
                <Lock size={14} strokeWidth={1.5} style={{ color: '#aaa' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={senha} onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: '#111' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="flex-shrink-0"
                  style={{ color: '#aaa', lineHeight: 0 }}
                >
                  {showPwd
                    ? <EyeOff size={14} strokeWidth={1.5} />
                    : <Eye size={14} strokeWidth={1.5} />
                  }
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit" disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #E04F0A, #c43d00)',
                boxShadow: '0 4px 18px rgba(224,79,10,0.35)',
              }}
            >
              {loading ? <><Loader2 size={15} className="animate-spin" />Entrando…</> : 'Entrar'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
            <span className="text-[11px]" style={{ color: '#bbb' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
          </div>

          <p className="text-center text-xs" style={{ color: '#aaa' }}>
            Novo na equipe?{' '}
            <Link href="/cadastro" className="font-semibold transition-colors" style={{ color: '#E04F0A' }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
