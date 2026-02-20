import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, type AdminSession, verifyAdminSessionValue } from '@/lib/admin-session';

const ADMIN_ROLES = ['admin', 'editor'] as const;

export function isAdminSession(session: { user?: { role?: string } } | null): boolean {
  const role = session?.user && (session.user as { role?: string }).role;
  return typeof role === 'string' && ADMIN_ROLES.includes(role as any);
}

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
}

export async function requireAuth() {
  const secret = getSecret();
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || '';
  const session: AdminSession | null = verifyAdminSessionValue({ value, secret });

  if (!session) redirect('/login');
  if (!isAdminSession(session as any)) redirect('/');

  return session;
}

export async function getAdminSession() {
  const secret = getSecret();
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || '';
  return verifyAdminSessionValue({ value, secret });
}

