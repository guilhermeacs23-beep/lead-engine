'use client'
import React, { useState } from 'react'
import { VitrineValora } from './vitrine-valora'

/* ═══════════════════════════════════════════════════════════════════════
   TELA DE LOGIN VALORA — a mesma porta para todo produto da casa.

   A logo da Valora manda; o nome do produto vem pequeno embaixo. Foi a
   inversão que resolveu o impasse: se a tela mostrasse só a Valora, a
   atendente do restaurante abriria o tablet às sete da noite e poderia achar
   que digitou o endereço errado — ela comprou "o sistema do restaurante" e
   talvez nunca ouça falar da Valora. Com a casa em cima e o produto embaixo,
   a marca lidera e a porta continua identificada.

   ESTE COMPONENTE NÃO SABE AUTENTICAR. Ele recebe `onEntrar` e devolve
   e-mail e senha; quem fala com o Supabase é cada aplicativo, porque cada um
   tem o seu cliente e o seu destino depois do login. É a regra do núcleo:
   componente não busca dado, recebe por props e devolve evento.

   Uma peça, uma propriedade de diferença entre sistemas:
     <LoginValora produto="Lead+" onEntrar={...} />
     <LoginValora produto="Rustic Burger" onEntrar={...} />
     <LoginValora onEntrar={...} />   ← sem produto: só a Valora
   ═══════════════════════════════════════════════════════════════════════ */

/* Fundo que troca sozinho a cada 7 dias. Mantido igual ao que já rodava no
   Lead+: paisagens e bichos, nada que canse quem entra todo dia. */
const FUNDOS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85',
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1920&q=85',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=85',
  'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1920&q=85',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85',
  'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=1920&q=85',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=85',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=85',
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1920&q=85',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=85',
  'https://images.unsplash.com/photo-1439853949212-36089c04f669?w=1920&q=85',
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=1920&q=85',
]

export function fundoDaSemana(lista: string[] = FUNDOS): string {
  const semana = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return lista[semana % lista.length]
}

/* Azuis tirados do próprio logo: o ciano das linhas e o azul escuro do "V".
   O botão é da Valora, não do produto — senão cada sistema quer a sua cor e
   a peça deixa de ser única. */
const AZUL = '#1273C4'
const AZUL_ESCURO = '#0E3A6B'
const CIANO = '#22B8F0'

export type LoginValoraProps = {
  /** Nome do produto, pequeno sob a logo. Sem ele, aparece só a Valora. */
  produto?: string
  /** Frase curta abaixo do nome do produto. */
  tagline?: string
  /** Cada app tem a sua logo em public/valora.png — mesmo caminho, mesmo arquivo. */
  logoSrc?: string
  /** Recebe as credenciais e devolve erro em texto, ou nada se deu certo. */
  onEntrar: (email: string, senha: string) => Promise<string | void>
  /** Link de "criar conta". Sem ele, a linha não aparece. */
  hrefCriarConta?: string
  /** Mostra os quadrinhos do que a Valora faz. */
  vitrine?: boolean
  fundos?: string[]
}

export function LoginValora({
  produto,
  tagline,
  logoSrc = '/valora.png',
  onEntrar,
  hrefCriarConta,
  vitrine = true,
  fundos,
}: LoginValoraProps) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const problema = await onEntrar(email, senha)
      if (problema) {
        setErro(problema)
        setCarregando(false)
      }
      // Sem problema: quem chamou cuida do redirecionamento. Não desligamos o
      // "Entrando…" de propósito — a tela vai trocar, e piscar o botão de
      // volta para "Entrar" no meio do caminho parece que falhou.
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não consegui entrar. Tente de novo.')
      setCarregando(false)
    }
  }

  const rotulo = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
  const campo: React.CSSProperties = {
    width: '100%', padding: '11px 40px 11px 38px', fontSize: 14,
    border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none',
    color: '#111', background: '#fff', boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        minHeight: '100vh', overflow: 'hidden',
        backgroundImage: `url(${fundoDaSemana(fundos)})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .valora-marca { padding-left: 8% !important; }
          .valora-card-area { padding: 0 8% !important; }
          .valora-card { width: 100% !important; max-width: 400px; }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,25,0.42)' }} />

      {vitrine && <VitrineValora />}

      {/* ── A casa, e depois o produto ── */}
      <div
        className="valora-marca"
        style={{
          position: 'relative', zIndex: 10, flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 0 0 12%',
        }}
      >
        <img
          src={logoSrc}
          alt="Valora Business Technology"
          style={{ width: 'min(360px, 60%)', height: 'auto', filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.45))' }}
        />

        {produto && (
          <p
            style={{
              margin: '18px 0 0', fontSize: 22, fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)', letterSpacing: '-0.01em',
            }}
          >
            {produto}
          </p>
        )}

        {tagline && (
          <p
            style={{
              margin: '4px 0 0', fontSize: 15,
              color: 'rgba(255,255,255,0.70)', textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            }}
          >
            {tagline}
          </p>
        )}
      </div>

      {/* ── Card ── */}
      <div className="valora-card-area" style={{ position: 'relative', zIndex: 10, padding: '0 72px 0 0', flexShrink: 0 }}>
        <div
          className="valora-card"
          style={{
            width: 400, background: '#fff', borderRadius: 24, padding: '40px 36px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.18)',
          }}
        >
          <div style={{ marginBottom: 26, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Fazer login</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9ca3af' }}>Entre na sua conta</p>
          </div>

          {erro && (
            <div
              role="alert"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 18,
                color: '#dc2626', fontSize: 13,
              }}
            >
              {erro}
            </div>
          )}

          <form onSubmit={enviar}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="valora-email" style={rotulo}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: 12, color: '#9ca3af', fontSize: 15 }}>✉</span>
                <input
                  id="valora-email" type="email" required autoComplete="email"
                  placeholder="seu@email.com.br" value={email}
                  onChange={(e) => setEmail(e.target.value)} style={campo}
                />
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label htmlFor="valora-senha" style={rotulo}>Senha</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: 12, color: '#9ca3af', fontSize: 15 }}>🔒</span>
                <input
                  id="valora-senha" type={verSenha ? 'text' : 'password'} required
                  autoComplete="current-password" placeholder="••••••••" value={senha}
                  onChange={(e) => setSenha(e.target.value)} style={campo}
                />
                <button
                  type="button" onClick={() => setVerSenha((v) => !v)}
                  aria-label={verSenha ? 'Esconder a senha' : 'Mostrar a senha'}
                  style={{
                    position: 'absolute', right: 10, top: 8, background: 'none',
                    border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15, padding: 4,
                  }}
                >
                  {verSenha ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={carregando}
              style={{
                width: '100%', padding: '13px 0', fontSize: 15, fontWeight: 700, color: '#fff',
                background: carregando ? AZUL_ESCURO : `linear-gradient(135deg, ${CIANO}, ${AZUL})`,
                border: 'none', borderRadius: 12,
                cursor: carregando ? 'default' : 'pointer',
                boxShadow: `0 8px 22px ${AZUL}44`,
                transition: 'filter .15s',
              }}
              onMouseOver={(e) => { if (!carregando) e.currentTarget.style.filter = 'brightness(1.08)' }}
              onMouseOut={(e) => { e.currentTarget.style.filter = 'none' }}
            >
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {hrefCriarConta && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                <span style={{ fontSize: 12, color: '#c4c4c4' }}>ou</span>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
              </div>
              <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
                Novo na equipe?{' '}
                <a href={hrefCriarConta} style={{ color: AZUL, fontWeight: 700, textDecoration: 'none' }}>
                  Criar conta
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginValora
