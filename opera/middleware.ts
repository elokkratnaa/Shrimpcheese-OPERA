import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware(routing)

const PROTECTED_ROUTES = ['/home', '/dump', '/session', '/chat', '/history', '/profile']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware
  const response = intlMiddleware(request)

  // 2. Run Supabase session logic
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Locale-aware route checking
  const pathname = request.nextUrl.pathname
  
  // Strip locale prefix if present for route matching
  const segments = pathname.split('/')
  const hasLocale = routing.locales.includes(segments[1] as any)
  const pathnameWithoutLocale = hasLocale ? `/${segments.slice(2).join('/')}` : pathname

  const isProtected = PROTECTED_ROUTES.some(route => pathnameWithoutLocale.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathnameWithoutLocale.startsWith(route))

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    // Prepend locale if detected in the original request
    const prefix = hasLocale ? `/${segments[1]}` : ''
    redirectUrl.pathname = `${prefix}/login`
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone()
    const prefix = hasLocale ? `/${segments[1]}` : ''
    redirectUrl.pathname = `${prefix}/home`
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_proxy, /_auth, /_static, /_vercel (Vercel internals)
    // - all root files (e.g. /favicon.ico, /robots.txt, etc.)
    '/((?!api|_next|_proxy|_auth|_static|_vercel|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
