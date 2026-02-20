import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateUser } from '@/lib/auth';
import { ADMIN_SESSION_COOKIE, createAdminSessionValue } from '@/lib/admin-session';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const username = String(body?.username ?? '').trim();
    const password = String(body?.password ?? '');

    if (!username || !password) {
      return NextResponse.json({ error: 'ユーザー名とパスワードが必要です' }, { status: 400 });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 });
    }

    const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
    if (!secret) {
      return NextResponse.json({ error: 'サーバー設定エラー（SECRET未設定）' }, { status: 500 });
    }

    const value = createAdminSessionValue({ user, secret });
    const cookieStore = await cookies();
    cookieStore.set({
      name: ADMIN_SESSION_COOKIE,
      value,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (e) {
    console.error('admin login failed:', e);
    return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 });
  }
}

