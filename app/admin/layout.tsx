import { requireAuth } from '@/lib/admin-auth';
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 認証チェック（ログインしていなければリダイレクト）
  // next build / vercel-build（ビルド時）はリクエストが無いので認証チェックをスキップ
  const lifecycle = process.env.npm_lifecycle_event;
  const isBuildTime = lifecycle === 'build' || lifecycle === 'vercel-build';
  if (!isBuildTime) {
    await requireAuth();
  }

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}

