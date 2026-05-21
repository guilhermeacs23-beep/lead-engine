'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/app-shell'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login'
      } else {
        setChecked(true)
      }
    })
  }, [])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm"
        style={{ background: '#0c0a1e', color: 'rgba(255,255,255,0.3)' }}>
        <Loader2 size={16} className="animate-spin" />
        Verificando sessão…
      </div>
    )
  }

  return <AppShell>{children}</AppShell>
}
