import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function getAdminSession() {
  return await getServerSession(authOptions);
}

