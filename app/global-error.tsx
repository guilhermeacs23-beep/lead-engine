'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ margin: 0, background: '#0c0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ color: '#ef4444', fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Algo deu errado</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 8px' }}>
            {error?.message || 'Erro desconhecido'}
          </p>
          {error?.digest && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '0 0 24px', fontFamily: 'monospace' }}>
              ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ padding: '10px 24px', borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
