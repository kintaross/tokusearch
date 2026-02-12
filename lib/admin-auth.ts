import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';

const ADMIN_ROLES = ['admin', 'editor'] as const;

export function isAdminSession(session: { user?: { role?: string } } | null): boolean {
  const role = session?.user && (session.user as { role?: string }).role;
  return typeof role === 'string' && ADMIN_ROLES.includes(role as any);
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!isAdminSession(session)) {
    redirect('/');
  }

  return session;
}

export async function getAdminSession() {
  return await getServerSession(authOptions);
}

