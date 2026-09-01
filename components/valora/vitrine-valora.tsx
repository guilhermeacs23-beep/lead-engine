'use client'
import React from 'react'

/* ═══════════════════════════════════════════════════════════════════════
   VITRINE VALORA — o que a casa faz, na tela de entrada de todo produto.

   Escrita para ser MOVIDA, não copiada. Não importa nada do Lead+, nem do
   Next além do 'use client', nem biblioteca de ícone: os símbolos são SVG
   inline. Quando o visual for aprovado, este arquivo vai inteiro para o
   valora-nucleo e os outros sistemas passam a consumir dali.

   Foi assim de propósito. A agenda virou seis cópias porque cada projeto
   levou a sua; se esta tela for copiada em cinco repositórios, mudar o
   texto de um card vira cinco commits e três deles ficam para trás.

   Quem vê isto já é cliente — está fazendo login. Então não é anúncio de
   captação, é venda cruzada: "você usa este, a gente também faz aqueles".
   Por isso os cards são discretos e não clicam: informam sem atrapalhar
   quem só quer entrar e trabalhar.
   ═══════════════════════════════════════════════════════════════════════ */

export type ProdutoValora = {
  id: string
  nome: string
  descricao: string
  /** Duas cores do degradê do quadrinho */
  cor: [string, string]
  icone: React.ReactNode
}

const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/* Conteúdo separado do desenho: mudar texto ou ordem não encosta no layout. */
export const PRODUTOS_VALORA: ProdutoValora[] = [
  {
    id: 'crm',
    nome: 'CRM',
    descricao: 'clientes e funil',
    cor: ['#0F766E', '#14B8A6'],
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" {...traco}>
        <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3.2" />
        <path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.2a4 4 0 0 1 0 7.6" />
      </svg>
    ),
  },
  {
    id: 'estoque',
    nome: 'Estoque',
    descricao: 'entradas e saídas',
    cor: ['#166534', '#22C55E'],
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" {...traco}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.3 7.3 12 12l8.7-4.7M12 22V12" />
      </svg>
    ),
  },
  {
    id: 'financeiro',
    nome: 'Financeiro',
    descricao: 'caixa e recebíveis',
    cor: ['#B45309', '#F59E0B'],
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" {...traco}>
        <path d="M3 17V9M9 17V5M15 17v-6M21 17v-9" />
        <path d="M3 21h18" />
      </svg>
    ),
  },
  {
    id: 'chatbot',
    nome: 'Chatbot',
    descricao: 'atende no WhatsApp',
    cor: ['#1D4ED8', '#3B82F6'],
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" {...traco}>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.9-.9L3 20.5l1.6-4.7A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" />
        <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
      </svg>
    ),
  },
  {
    id: 'sites',
    nome: 'Sites',
    descricao: 'presença e catálogo',
    cor: ['#6D28D9', '#A78BFA'],
    icone: (
      <svg viewBox="0 0 24 24" width="18" height="18" {...traco}>
        <circle cx="12" cy="12" r="9.2" />
        <path d="M2.8 12h18.4M12 2.8a15 15 0 0 1 0 18.4 15 15 0 0 1 0-18.4z" />
      </svg>
    ),
  },
]

export function VitrineValora({
  produtos = PRODUTOS_VALORA,
  titulo = 'A Valora também faz',
}: {
  produtos?: ProdutoValora[]
  titulo?: string
}) {
  return (
    <div
      aria-label="Outros produtos da Valora"
      style={{
        position: 'absolute',
        top: 28,
        left: 28,
        zIndex: 20,
        maxWidth: 'min(560px, calc(100vw - 56px))',
      }}
    >
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
          textShadow: '0 1px 6px rgba(0,0,0,0.5)',
          fontWeight: 600,
        }}
      >
        {titulo}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {produtos.map((p) => (
          <div
            key={p.id}
            title={`${p.nome} — ${p.descricao}`}
            style={{
              width: 104,
              padding: '10px 11px 11px',
              borderRadius: 12,
              background: `linear-gradient(150deg, ${p.cor[0]}, ${p.cor[1]})`,
              // A borda clara por dentro segura o quadrinho quando o fundo do
              // dia é uma foto clara — sem ela o card some no céu.
              boxShadow:
                'inset 0 0 0 1px rgba(255,255,255,0.16), 0 6px 18px rgba(0,0,0,0.28)',
              color: '#fff',
            }}
          >
            <div style={{ opacity: 0.9, marginBottom: 7 }}>{p.icone}</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.15 }}>{p.nome}</div>
            <div
              style={{
                fontSize: 10.5,
                lineHeight: 1.3,
                marginTop: 2,
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              {p.descricao}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VitrineValora
