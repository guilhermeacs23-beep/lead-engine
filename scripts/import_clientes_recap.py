"""
═══════════════════════════════════════════════════════════
 LEAD ENGINE — Importação CSV SSW → Supabase
 Módulo: Recap de Clientes

 Como usar:
   1. Instale dependências: pip install requests
   2. Preencha SUPABASE_URL e SUPABASE_KEY abaixo
   3. Coloque o CSV na mesma pasta e ajuste CSV_PATH
   4. Execute: python import_clientes_recap.py
═══════════════════════════════════════════════════════════
"""

import csv
import io
import json
import re
import requests
from datetime import date, datetime

# ── Configuração ────────────────────────────────────────
SUPABASE_URL = "https://SEU_PROJETO.supabase.co"   # <-- preencha
SUPABASE_KEY = "sua_service_role_key"              # <-- preencha (service role)
CSV_PATH     = "historico_cliente_23_a_25.csv"
TENANT_ID    = "00000000-0000-0000-0000-000000000001"
BATCH_SIZE   = 200   # registros por requisição

TARGET_UFS   = {"MG", "RJ", "SP", "PR", "SC", "RS"}
TODAY        = date.today()

# ── Score de Reativação ─────────────────────────────────

def calc_score(row: dict) -> dict:
    """Calcula score de reativação (0–100) a partir dos campos do CSV."""

    # 1. Recência (0–50): sweet spot = 91-365 dias parado
    ult = parse_date(row.get("ULT MOVIMENTO", ""))
    if ult:
        days = (TODAY - ult).days
    else:
        days = None

    if days is None:
        rec = 0
    elif 91 <= days <= 180:
        rec = 50   # em queda — máxima urgência
    elif 181 <= days <= 365:
        rec = 42   # inativo — alto potencial
    elif 31 <= days <= 90:
        rec = 25   # pode ser sazonal
    elif 366 <= days <= 730:
        rec = 18   # longo prazo — vale tentar
    elif days > 730:
        rec = 5    # muito frio
    else:
        rec = 10   # ativo recente (não é alvo de reativação)

    # 2. Contato (0–25)
    email  = clean(row.get("EMAIL", "")) or clean(row.get("EMAIL DE ENVIO DO CT-e E XML", ""))
    fone   = clean_phone(row.get("FONE", ""))
    cel    = clean_phone(row.get("CELULAR", ""))
    has_email = bool(email)
    has_phone = bool(fone or cel)

    if has_email and has_phone:
        cont = 25
    elif has_email:
        cont = 15
    elif has_phone:
        cont = 10
    else:
        cont = 0

    # 3. CFOP (0–15): C = comprador/destinatário é o mais valioso
    cfop_map = {"C": 15, "I": 12, "N": 8, "T": 5}
    cfop_s   = cfop_map.get(clean(row.get("CFOP", "")), 5)

    # 4. UF Prioritária (0–10): baseado no volume de operações EBT
    uf_map = {"SP": 10, "PR": 9, "RJ": 8, "MG": 8, "SC": 6, "RS": 6}
    uf_s   = uf_map.get(clean(row.get("UF", "")), 0)

    total = rec + cont + cfop_s + uf_s

    if total >= 70:
        categoria = "QUENTE"
    elif total >= 50:
        categoria = "MORNO"
    elif total >= 30:
        categoria = "FRIO"
    else:
        categoria = "PERDIDO"

    return {
        "score_reativacao": total,
        "score_recencia":   rec,
        "score_contato":    cont,
        "score_cfop":       cfop_s,
        "score_uf":         uf_s,
        "categoria":        categoria,
        "dias_inativo":     days,
    }

# ── Helpers ─────────────────────────────────────────────

def clean(s: str) -> str:
    return s.strip() if s else ""

def clean_phone(s: str) -> str:
    s = clean(s)
    if not s or s in ("(  )", "(  )         "):
        return ""
    digits = re.sub(r"\D", "", s)
    return s if len(digits) >= 8 else ""

def parse_date(s: str):
    s = clean(s)
    for fmt in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except:
            pass
    return None

def parse_coord(s: str):
    s = clean(s).replace(",", ".")
    try:
        v = float(s)
        return v if v != 0 else None
    except:
        return None

def build_record(row: dict) -> dict:
    email = (
        clean(row.get("EMAIL", ""))
        or clean(row.get("EMAIL DE ENVIO DO CT-e E XML", ""))
        or clean(row.get("EMAIL COBRANCA", ""))
    )
    # Take only first email if multiple separated by comma/semicolon
    if email and ("," in email or ";" in email):
        email = re.split(r"[,;]", email)[0].strip()

    ult_mov = parse_date(row.get("ULT MOVIMENTO", ""))
    score   = calc_score(row)

    return {
        "tenant_id":        TENANT_ID,
        "nome":             clean(row.get("CLIENTE", ""))[:255],
        "cnpj":             re.sub(r"\D", "", clean(row.get("CNPJ/CPF", "")))[:18],
        "cfop":             clean(row.get("CFOP", ""))[:1],
        "endereco":         clean(row.get("ENDERECO", ""))[:200],
        "numero":           clean(row.get("NUMERO", ""))[:20],
        "bairro":           clean(row.get("BAIRRO", ""))[:100],
        "cep":              re.sub(r"\D", "", clean(row.get("CEP", "")))[:8],
        "cidade":           clean(row.get("CIDADE", ""))[:100],
        "uf":               clean(row.get("UF", ""))[:2],
        "latitude":         parse_coord(row.get("LATITUDE", "")),
        "longitude":        parse_coord(row.get("LONGITUDE", "")),
        "telefone":         clean_phone(row.get("FONE", ""))[:20],
        "celular":          clean_phone(row.get("CELULAR", ""))[:20],
        "email":            email[:200] if email else None,
        "vendedor_codigo":  clean(row.get("VENDEDOR", ""))[:20],
        "classificacao":    clean(row.get("CLASSIFICACAO", ""))[:10],
        "cnae":             clean(row.get("CNAE", ""))[:10] or None,
        "ult_movimento":    ult_mov.isoformat() if ult_mov else None,
        **score,
        "status":           "pendente",
    }

# ── Supabase upsert ─────────────────────────────────────

def upsert_batch(records: list) -> bool:
    url     = f"{SUPABASE_URL}/rest/v1/clientes_recap"
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates",
    }
    resp = requests.post(url, headers=headers, json=records, timeout=30)
    if resp.status_code not in (200, 201):
        print(f"  ERRO {resp.status_code}: {resp.text[:200]}")
        return False
    return True

# ── Main ─────────────────────────────────────────────────

def main():
    print("═" * 55)
    print(" LEAD ENGINE — Importação Recap de Clientes")
    print("═" * 55)
    print(f" Arquivo : {CSV_PATH}")
    print(f" Estados : {', '.join(sorted(TARGET_UFS))}")
    print(f" Data ref: {TODAY}\n")

    with open(CSV_PATH, "r", encoding="latin-1") as f:
        lines = f.readlines()

    # Pula 2 linhas de cabeçalho do SSW
    data_lines = lines[2:]
    reader     = csv.DictReader(io.StringIO("".join(data_lines)), delimiter=";")
    rows       = list(reader)
    print(f" Total no arquivo: {len(rows):,}")

    # Filtra UFs alvo
    target = [r for r in rows if clean(r.get("UF", "")) in TARGET_UFS]
    print(f" Após filtro UF  : {len(target):,}")

    # Constrói registros
    records, skipped = [], 0
    for row in target:
        nome = clean(row.get("CLIENTE", ""))
        if not nome:
            skipped += 1
            continue
        records.append(build_record(row))

    print(f" Registros válidos: {len(records):,}  |  Ignorados: {skipped}")

    # Estatísticas de score
    cats = {"QUENTE": 0, "MORNO": 0, "FRIO": 0, "PERDIDO": 0}
    for r in records:
        cats[r["categoria"]] += 1
    print(f"\n Distribuição:")
    print(f"   🔥 QUENTE  : {cats['QUENTE']:>5,}")
    print(f"   🟡 MORNO   : {cats['MORNO']:>5,}")
    print(f"   🔵 FRIO    : {cats['FRIO']:>5,}")
    print(f"   ❄️  PERDIDO : {cats['PERDIDO']:>5,}")

    # Envia em batches
    print(f"\n Enviando para Supabase em batches de {BATCH_SIZE}...")
    ok_total, err_total = 0, 0
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        n     = i + len(batch)
        ok    = upsert_batch(batch)
        if ok:
            ok_total += len(batch)
            print(f"  ✓ {n:>5}/{len(records)} registros")
        else:
            err_total += len(batch)
            print(f"  ✗ Batch {i}–{n} falhou")

    print(f"\n{'═'*55}")
    print(f" Concluído: {ok_total:,} inseridos  |  {err_total:,} erros")
    print(f"{'═'*55}")

if __name__ == "__main__":
    main()
