'use client'
import { LoginValora } from '@/components/valora/login-valora'
import { supabase } from '@/lib/supabase'

/**
 * A tela é da Valora e vive em components/valora/login-valora.tsx — a mesma
 * para todo produto da casa. Aqui fica só o que é do Lead+: quem autentica e
 * para onde vai depois.
 */
export default function LoginPage() {
  async function entrar(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      return error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message
    }
    localStorage.setItem('ld_session_date', new Date().toISOString().slice(0, 10))
    window.location.href = '/home'
  }

  return (
    <LoginValora
      produto="Lead+"
      tagline="Inteligência que impulsiona"
      onEntrar={entrar}
      hrefCriarConta="/cadastro"
    />
  )
}
