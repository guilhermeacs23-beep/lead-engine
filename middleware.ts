import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // Atualiza a sessão nos cookies (refresh token se necessário)
  const { data: { session } } = await supabase.auth.getSession()

  const pathname    = req.nextUrl.pathname
  const isProtected = [
    '/dashboard', '/pipeline', '/leads', '/relatorios',
    '/mapa', '/automacoes', '/configuracoes',
  ].some(p => pathname.startsWith(p))

  // Redireciona / para dashboard ou login
  if (pathname === '/') {
    const url = req.nextUrl.clone()
    url.pathname = session ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  // Rota protegida sem sessão → login
  if (!session && isProtected) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
