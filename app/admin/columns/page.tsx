import { getAdminSession } from '@/lib/admin-auth';
import { fetchColumnsFromSheet } from '@/lib/columns';
import Header from '@/components/admin/Header';
import Link from 'next/link';
import { Plus, FileText, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminColumnsPage() {
  const session = await getAdminSession();
  const columns = await fetchColumnsFromSheet();

  // ステータスごとに集計
  const publishedCount = columns.filter((c) => c.status === 'published').length;
  const draftCount = columns.filter((c) => c.status === 'draft').length;
  const archivedCount = columns.filter((c) => c.status === 'archived').length;

  // 最新順にソート
  const sortedColumns = [...columns].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <>
      <Header
        title="コラム管理"
        subtitle={`全 ${columns.length} 件のコラム`}
        user={session?.user}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">公開中</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {publishedCount}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">下書き</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {draftCount}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">アーカイブ</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">
              {archivedCount}
            </div>
          </div>
        </div>

        {/* アクションバー */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-3">
            <Link
              href="/admin/columns/new"
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新規作成</span>
              <span className="sm:hidden">作成</span>
            </Link>
          </div>
        </div>

        {/* コラム一覧（デスクトップ: テーブル、スマホ: カード） */}
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
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  閲覧数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新日
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedColumns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">コラムがありません</p>
                    <p className="text-sm text-gray-400 mt-1">
                      新規作成ボタンからコラムを作成してください
                    </p>
                  </td>
                </tr>
              ) : (
                sortedColumns.map((column) => (
                  <tr key={column.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {column.is_featured && (
                          <span className="mr-2 text-yellow-500">⭐</span>
                        )}
                        <div>
                          <Link
                            href={`/admin/columns/${column.id}/edit`}
                            className="font-medium text-brand-600 hover:text-brand-700 block"
                          >
                            {column.title}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {column.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {column.category}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
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
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {column.view_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(column.updated_at).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* スマホ: カード表示 */}
        <div className="md:hidden space-y-4">
          {sortedColumns.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">コラムがありません</p>
              <p className="text-sm text-gray-400 mt-1">
                新規作成ボタンからコラムを作成してください
              </p>
            </div>
          ) : (
            sortedColumns.map((column) => (
              <div
                key={column.id}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {column.is_featured && (
                        <span className="text-yellow-500">⭐</span>
                      )}
                      <Link
                        href={`/admin/columns/${column.id}/edit`}
                        className="font-medium text-brand-600 hover:text-brand-700 truncate block"
                      >
                        {column.title}
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{column.slug}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {column.category}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
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
                  <span className="flex items-center gap-1 text-gray-500">
                    <Eye className="w-3 h-3" />
                    {column.view_count}
                  </span>
                  <span className="text-gray-500">
                    {new Date(column.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

