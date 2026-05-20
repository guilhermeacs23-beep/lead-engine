'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, User, Loader2, Truck, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function CadastroPage() {
  const router = useRouter()
  const [nome,    setNome]    = useState('')
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')
  const [ok,      setOk]      = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const iniciais = nome
      .split(' ')
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase()

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
          iniciais,
          role: 'vendedor',
          tenant_id: '00000000-0000-0000-0000-000000000001',
        },
      },
    })

    if (error) {
      setErro(
        error.message === 'User already registered'
          ? 'Este e-mail já está cadastrado.'
          : error.message
      )
      setLoading(false)
      return
    }

    setOk(true)
    setLoading(false)
  }

  if (ok) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #1e1b4b 0%, #0c0a1e 60%, #000 100%)' }}>
        <div className="relative z-10 w-full max-w-sm rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(32px)',
          }}>
          <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-400" strokeWidth={1.5} />
          <h2 className="mb-2 text-base font-semibold text-white/95">Conta criada!</h2>
          <p className="mb-6 text-sm text-white/50">
            Verifique seu e-mail para confirmar o cadastro, depois faça o login.
          </p>
          <Link href="/login"
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #1e1b4b 0%, #0c0a1e 60%, #000 100%)' }}>

      {/* Glow orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-64 w-64 rounded-full opacity-20"
        style={{ background: '#6366f1', filter: 'blur(80px)' }} />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full opacity-15"
        style={{ background: '#8b5cf6', filter: 'blur(60px)' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(32px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Truck size={22} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white/95">Lead Engine</h1>
            <p className="text-xs text-white/45">Crie sua conta na equipe</p>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-300"
            style={{ background: 'rgba(239,68,68,0.12)', border: '0.5px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle size={13} strokeWidth={1.5} />
            {erro}
          </div>
        )}

        <form onSubmit={handleCadastro} className="flex flex-col gap-3.5">
          {/* Nome */}
          <div>
            <p className="mb-1.5 text-[11px] text-white/45">Seu nome</p>
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
              <User size={14} className="text-white/30" strokeWidth={1.5} />
              <input
                type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Ex: João Silva" required
                className="flex-1 bg-transparent text-sm text-white/85 outline-none placeholder:text-white/25"
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <p className="mb-1.5 text-[11px] text-white/45">E-mail</p>
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
              <Mail size={14} className="text-white/30" strokeWidth={1.5} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com.br" required
                className="flex-1 bg-transparent text-sm text-white/85 outline-none placeholder:text-white/25"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <p className="mb-1.5 text-[11px] text-white/45">Senha</p>
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
              <Lock size={14} className="text-white/30" strokeWidth={1.5} />
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="mínimo 6 caracteres" required minLength={6}
                className="flex-1 bg-transparent text-sm text-white/85 outline-none placeholder:text-white/25"
              />
            </div>
          </div>

          {/* Role info */}
          <div className="rounded-xl px-3.5 py-2.5 text-[11px] text-white/40"
            style={{ background: 'rgba(99,102,241,0.08)', border: '0.5px solid rgba(99,102,241,0.2)' }}>
            Novos usuários entram como <span className="text-indigo-300">Vendedor</span>. O administrador pode promover para Gerente nas configurações.
          </div>

          {/* Botão */}
          <button type="submit" disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Criando conta…</> : 'Criar conta'}
          </button>
        </form>

        {/* Link login */}
        <p className="mt-6 text-center text-[12px] text-white/35">
          Já tem conta?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
