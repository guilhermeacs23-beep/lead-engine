'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, Truck, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [senha,    setSenha]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #1e1b4b 0%, #0c0a1e 60%, #000 100%)' }}>

      {/* Glow orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-64 w-64 rounded-full opacity-20"
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
            <p className="text-xs text-white/45">Acesse sua conta</p>
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

        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
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
                placeholder="••••••••" required minLength={6}
                className="flex-1 bg-transparent text-sm text-white/85 outline-none placeholder:text-white/25"
              />
            </div>
          </div>

          {/* Botão */}
          <button type="submit" disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Entrando…</> : 'Entrar'}
          </button>
        </form>

        {/* Link cadastro */}
        <p className="mt-6 text-center text-[12px] text-white/35">
          Novo na equipe?{' '}
          <Link href="/cadastro" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
