import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const ADMIN_ROLES = ['admin', 'editor'];

/**
 * /api/me/* 用: 一般ユーザー（Googleログイン）のセッションのみ許可。
 * 管理者/編集者は admin_users に属するため、ここでは null を返す。
 */
export async function getSessionForMe(): Promise<{ id: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (role && ADMIN_ROLES.includes(role)) return null;
  const id = (session.user as { id?: string }).id;
  if (!id) return null;
  return { id };
}
