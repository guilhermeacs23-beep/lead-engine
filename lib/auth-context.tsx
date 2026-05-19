'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  tenant_id: string
  nome: string
  iniciais: string
  cor: string
  role: 'admin' | 'gerente' | 'vendedor'
}

interface AuthContextValue {
  user:    User    | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  isGerente: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null, profile: null, session: null,
  loading: true, signOut: async () => {},
  isAdmin: false, isGerente: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User    | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, signOut,
      isAdmin:   profile?.role === 'admin',
      isGerente: profile?.role === 'admin' || profile?.role === 'gerente',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
