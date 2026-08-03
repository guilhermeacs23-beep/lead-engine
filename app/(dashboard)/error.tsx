'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: '#ef4444', fontSize: 40 }}>⚠️</div>
      <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Erro nesta página</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, maxWidth: 400, textAlign: 'center' }}>
        {error?.message || 'Erro desconhecido'}
      </p>
      {error?.digest && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0, fontFamily: 'monospace' }}>
          {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{ padding: '8px 20px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
