/**
 * sync-clientes-recap v5
 * ======================
 * Dois modos:
 *   ?mode=incremental (padrão) — só o arquivo cronologicamente mais recente
 *   ?mode=full        — todos os arquivos (setup inicial / resync mensal)
 *
 * Formatos de data suportados: dd/mm/yyyy, dd/mm/yy e yyyy-mm-dd
 *
 * Fluxo:
 *  1. Lê index_455.csv → lista de arquivos
 *  2. Ordena cronologicamente via fileDateKey()
 *  3. Para cada arquivo: streaming linha a linha (sem carregar tudo em RAM)
 *  4. Agrega por CNPJ Pagador: mantém MAX(Data de Emissao) e preenche contato
 *  5. Calcula scores de reativação
 *  6. Upsert via RPC upsert_clientes_recap (preserva registros aprovados/descartados)
 *
 * Variáveis de ambiente: auto-injetadas pelo Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ─── Configuração ─────────────────────────────────────────────────────────────

const STORAGE_BASE = "https://lpljcfvhwwpgqeyincub.supabase.co/storage/v1/object/public/crpa-relatorios/455"
const INDEX_FILE   = "index_455.csv"
const BATCH_SIZE   = 300
const MIN_COLS     = 166   // idx 165 = vendedor, precisa existir

// Índices das colunas do CSV SSW
const C = {
  data  : 5,
  cnpj  : 25,
  nome  : 26,
  cidade: 29,
  uf    : 30,
  fone  : 31,
  seg   : 32,
  cfop  : 52,
  cel   : 97,
  vend  : 165,
} as const

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClientData {
  cnpj   : string
  nome   : string
  cidade : string | null
  uf     : string | null
  fone   : string | null
  cel    : string | null
  seg    : string | null
  cfop   : string | null
  vend   : string | null
  ult    : Date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanCNPJ(s: string): string | null {
  const d = s.replace(/\D/g, "")
  return d.length === 14 ? d : null
}

function cleanPhone(s: string): string | null {
  const d = s.replace(/\D/g, "")
  return d.length >= 8 ? d : null
}

function parseDate(s: string): Date | null {
  const str = s.trim()
  // dd/mm/yyyy (4 dígitos — arquivos até 2025)
  const m4 = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m4) return new Date(`${m4[3]}-${m4[2]}-${m4[1]}`)
  // dd/mm/yy (2 dígitos — arquivos 2026+)
  const m2 = str.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
  if (m2) return new Date(`20${m2[3]}-${m2[2]}-${m2[1]}`)
  // yyyy-mm-dd (ISO)
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str) : null
}

/**
 * Ordena arquivos cronologicamente.
 * Ex: "07.26.csv" → 2607, "12.25_p6.csv" → 2512
 * Garante que o mais recente fique no fim do array.
 */
function fileDateKey(name: string): number {
  const m = name.match(/^(\d{2})\.(\d{2})(?:_p\d+)?\.csv$/)
  return m ? parseInt(m[2]) * 100 + parseInt(m[1]) : 0
}

const UF_SCORE: Record<string, number> = {
  SP: 10, PR: 10, SC: 10, RS: 10, MG: 10, RJ: 10,
  GO: 7,  MS: 7,  MT: 7,  ES: 7,  BA: 7,
}

function buildRecord(c: ClientData) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dias  = Math.floor((today.getTime() - c.ult.getTime()) / 86_400_000)
  const sr    = dias <= 90 ? 50 : dias <= 180 ? 40 : dias <= 270 ? 30 : dias <= 365 ? 20 : dias <= 540 ? 10 : 5
  const sc    = c.fone ? 25 : c.cel ? 10 : 0
  const scf   = (c.cfop ?? "").startsWith("6") ? 15 : (c.cfop ?? "").startsWith("5") ? 10 : 5
  const su    = UF_SCORE[(c.uf ?? "").toUpperCase()] ?? 4
  const total = sr + sc + scf + su
  const cat   = total >= 70 ? "QUENTE" : total >= 50 ? "MORNO" : total >= 30 ? "FRIO" : "PERDIDO"
  return {
    nome: c.nome, cnpj: c.cnpj, cfop: c.cfop, cidade: c.cidade, uf: c.uf,
    telefone: c.fone, celular: c.cel, email: null, vendedor_codigo: c.vend ?? null,
    ult_movimento: c.ult.toISOString().slice(0, 10), dias_inativo: dias,
    score_reativacao: total, score_recencia: sr, score_contato: sc,
    score_cfop: scf, score_uf: su, categoria: cat, status: "pendente", observacao: c.seg,
  }
}

// ─── Streaming CSV parser ─────────────────────────────────────────────────────

async function processFile(filename: string, clients: Map<string, ClientData>): Promise<void> {
  const res = await fetch(`${STORAGE_BASE}/${filename}`)
  if (!res.ok || !res.body) { console.warn(`  ⚠ ${filename}: ${res.status}`); return }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buf       = ""
  let first     = true

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""

    for (const line of lines) {
      const l = first ? line.replace(/^﻿/, "") : line; first = false
      const p = l.split(";")
      if (p.length < MIN_COLS) continue

      const cnpj = cleanCNPJ(p[C.cnpj].trim()); if (!cnpj) continue
      const dt   = parseDate(p[C.data].trim());  if (!dt)   continue

      const ex = clients.get(cnpj)
      if (!ex) {
        clients.set(cnpj, {
          cnpj, nome: p[C.nome].trim(), cidade: p[C.cidade].trim() || null,
          uf: p[C.uf].trim() || null, fone: cleanPhone(p[C.fone]),
          cel: cleanPhone(p[C.cel]), seg: p[C.seg].trim() || null,
          cfop: p[C.cfop].trim() || null, vend: p[C.vend].trim() || null, ult: dt,
        })
      } else {
        if (dt > ex.ult) {
          ex.ult = dt; ex.nome = p[C.nome].trim() || ex.nome
          ex.cidade = p[C.cidade].trim() || ex.cidade; ex.uf = p[C.uf].trim() || ex.uf
          ex.cfop = p[C.cfop].trim() || ex.cfop; ex.vend = p[C.vend].trim() || ex.vend
        }
        if (!ex.fone) ex.fone = cleanPhone(p[C.fone])
        if (!ex.cel)  ex.cel  = cleanPhone(p[C.cel])
      }
    }
  }
}

// ─── Lê o índice de arquivos ──────────────────────────────────────────────────

async function readIndex(): Promise<string[]> {
  const res = await fetch(`${STORAGE_BASE}/${INDEX_FILE}`)
  if (!res.ok) throw new Error(`Índice indisponível: ${res.status}`)
  const text = await res.text()
  return text.replace(/^﻿/, "").split("\n").slice(1).map(l => l.trim()).filter(l => l.endsWith(".csv"))
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const mode = (new URL(req.url)).searchParams.get("mode") ?? "incremental"
  const t0   = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // 1. Lê e ordena índice cronologicamente
    const allFiles = await readIndex()
    const sorted   = [...allFiles].sort((a, b) => fileDateKey(a) - fileDateKey(b))
    const files    = mode === "full" ? sorted : [sorted[sorted.length - 1]]
    console.log(`[sync] modo=${mode} | arquivos: ${files.join(", ")}`)

    // 2. Processa em streaming
    const clients = new Map<string, ClientData>()
    for (const fname of files) {
      console.log(`  ↓ ${fname}`)
      await processFile(fname, clients)
    }
    console.log(`  → ${clients.size} clientes`)

    // 3. Calcula scores e ordena
    const records = Array.from(clients.values()).map(buildRecord)
    records.sort((a, b) => b.score_reativacao - a.score_reativacao)

    // 4. Upsert em batches
    let upserted = 0
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.rpc("upsert_clientes_recap", { records: batch })
      if (error) throw new Error(`Batch ${i}: ${error.message}`)
      upserted += batch.length
    }

    const cats: Record<string, number> = {}
    for (const r of records) cats[r.categoria] = (cats[r.categoria] ?? 0) + 1

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    console.log(`✅ ${elapsed}s — ${clients.size} clientes [${mode}]`)

    return new Response(JSON.stringify({
      ok: true, mode, clientes: clients.size, upserted,
      distribuicao: cats, arquivos: files, elapsed_s: parseFloat(elapsed),
      timestamp: new Date().toISOString(),
    }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } })

  } catch (err) {
    console.error("❌", err)
    return new Response(JSON.stringify({ ok: false, mode, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        