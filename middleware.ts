import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * MAINTENANCE_MODE=1 のとき、サイト訪問者を /maintenance に誘導します。
 * - /maintenance, /admin, /login は常に許可
 * - ログイン済み（有効な NextAuth セッション）の場合は全ページ許可（管理者裏口）
 * - API は matcher で除外
 */
export async function middleware(req: NextRequest) {
  const maintenance = process.env.MAINTENANCE_MODE === '1'
  if (!maintenance) return NextResponse.next()

  const { pathname } = req.nextUrl

  // Allow maintenance page itself and admin routes (back door: login then access admin).
  if (pathname.startsWith('/maintenance')) return NextResponse.next()
  if (pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname === '/login') return NextResponse.next()
  if (pathname === '/signin') return NextResponse.next()

  // Back door: only admin/editor can bypass maintenance; end-users see maintenance.
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const role = token?.role as string | undefined
  if (role === 'admin' || role === 'editor') return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/maintenance'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    // Exclude Next internals, public assets, and API routes.
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|force-reload.html|google2a688dc37dc48928.html).*)',
  ],
}

