import { requireAuth } from '@/lib/admin-auth';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 認証チェック（ログインしていなければリダイレクト）
  await requireAuth();

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}

