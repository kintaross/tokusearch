import { getAdminSession } from '@/lib/admin-auth';
import { fetchColumnsFromSheet } from '@/lib/columns';
import { fetchDealsForAdmin } from '@/lib/deals-data';
import Header from '@/components/admin/Header';
import Link from 'next/link';
import { FileText, Tag, Eye, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getAdminSession();
  const columns = await fetchColumnsFromSheet();
  const deals = await fetchDealsForAdmin();

  // 統計情報
  const publishedColumns = columns.filter((c) => c.status === 'published');
  const draftColumns = columns.filter((c) => c.status === 'draft');
  const publicDeals = deals.filter((d) => d.is_public === true);

  // 最近のコラム（5件）
  const recentColumns = [...columns]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // 最近のお得情報（5件）
  const recentDeals = [...deals]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: '公開中のコラム',
      value: publishedColumns.length,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      label: '下書きのコラム',
      value: draftColumns.length,
      icon: FileText,
      color: 'bg-yellow-500',
    },
    {
      label: '公開中のお得情報',
      value: publicDeals.length,
      icon: Tag,
      color: 'bg-green-500',
    },
    {
      label: '総閲覧数（コラム）',
      value: columns.reduce((sum, c) => sum + c.view_count, 0),
      icon: Eye,
      color: 'bg-purple-500',
    },
  ];

  return (
    <>
      <Header
        title="ダッシュボード"
        subtitle="TokuSearch 管理画面へようこそ"
        user={session?.user}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 最近のコラム */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                最近のコラム
              </h2>
              <Link
                href="/admin/columns"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                すべて見る →
              </Link>
            </div>
            <div className="space-y-3">
              {recentColumns.length === 0 ? (
                <p className="text-sm text-gray-500">コラムがありません</p>
              ) : (
                recentColumns.map((column) => (
                  <Link
                    key={column.id}
                    href={`/admin/columns/${column.id}/edit`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {column.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(column.created_at).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          column.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : column.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {column.status === 'published'
                          ? '公開'
                          : column.status === 'draft'
                          ? '下書き'
                          : 'アーカイブ'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* 最近のお得情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                最近のお得情報
              </h2>
              <Link
                href="/admin/deals"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                すべて見る →
              </Link>
            </div>
            <div className="space-y-3">
              {recentDeals.length === 0 ? (
                <p className="text-sm text-gray-500">お得情報がありません</p>
              ) : (
                recentDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/admin/deals/${deal.id}/edit`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {deal.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(deal.created_at).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          deal.is_public === true
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {deal.is_public === true ? '公開' : '非公開'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

