import { getAdminSession } from '@/lib/admin-auth';
import { fetchDealsForAdmin } from '@/lib/deals-data';
import Header from '@/components/admin/Header';
import Link from 'next/link';
import { Tag, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDealsPage() {
  const session = await getAdminSession();
  const deals = await fetchDealsForAdmin();

  // ステータスごとに集計
  const publicCount = deals.filter((d) => d.is_public === true).length;
  const privateCount = deals.filter((d) => d.is_public !== true).length;

  // 最新順にソート
  const sortedDeals = [...deals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      <Header
        title="お得情報管理"
        subtitle={`全 ${deals.length} 件のお得情報`}
        user={session?.user}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">公開中</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {publicCount}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">非公開</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">
              {privateCount}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 お得情報はn8nワークフローで自動収集されています。
            こちらの画面では閲覧と基本的な編集のみ可能です。
          </p>
        </div>

        {/* お得情報一覧（デスクトップ: テーブル、スマホ: カード） */}
        {/* デスクトップ: テーブル表示 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイトル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  サービス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  優先度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDeals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">お得情報がありません</p>
                  </td>
                </tr>
              ) : (
                sortedDeals.slice(0, 50).map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/deals/${deal.id}/edit`}
                        className="font-medium text-brand-600 hover:text-brand-700 max-w-md truncate block"
                      >
                        {deal.title}
                      </Link>
                      <div className="text-xs text-gray-500">
                        {deal.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {deal.service}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          deal.priority === 'A'
                            ? 'bg-red-100 text-red-700'
                            : deal.priority === 'B'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {deal.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          deal.is_public === true
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {deal.is_public === true ? '公開' : '非公開'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(deal.created_at).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {sortedDeals.length > 50 && (
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs sm:text-sm text-gray-600">
              ※ 最新50件のみ表示しています（全{sortedDeals.length}件）
            </div>
          )}
        </div>

        {/* スマホ: カード表示 */}
        <div className="md:hidden space-y-4">
          {sortedDeals.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">お得情報がありません</p>
            </div>
          ) : (
            sortedDeals.slice(0, 50).map((deal) => (
              <div
                key={deal.id}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/deals/${deal.id}/edit`}
                      className="font-medium text-brand-600 hover:text-brand-700 mb-1 line-clamp-2 block"
                    >
                      {deal.title}
                    </Link>
                    <p className="text-xs text-gray-500 truncate">{deal.id}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {deal.service}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      deal.priority === 'A'
                        ? 'bg-red-100 text-red-700'
                        : deal.priority === 'B'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {deal.priority}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      deal.is_public === true
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {deal.is_public === true ? '公開' : '非公開'}
                  </span>
                  <span className="text-gray-500">
                    {new Date(deal.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))
          )}
          {sortedDeals.length > 50 && (
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
              ※ 最新50件のみ表示しています（全{sortedDeals.length}件）
            </div>
          )}
        </div>
      </div>
    </>
  );
}

