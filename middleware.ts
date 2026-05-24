import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas protegidas (requerem autenticação)
const PROTECTED = [
  '/dashboard',
  '/pipeline',
  '/leads',
  '/relatorios',
  '/mapa',
  '/automacoes',
  '/configuracoes',
]

// Rotas públicas (redireciona para /dashboard se já autenticado)
const AUTH_ROUTES = ['/login', '/cadastro']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = req.nextUrl.pathname

  const isProtected  = PROTECTED.some(p => pathname.startsWith(p))
  const isAuthRoute  = AUTH_ROUTES.some(p => pathname.startsWith(p))
  const isRoot       = pathname === '/'

  // Não autenticado tentando acessar rota protegida → /login
  if (!user && isProtected) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Já autenticado tentando acessar /login, /cadastro ou / → /dashboard
  if (user && (isAuthRoute || isRoot)) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
