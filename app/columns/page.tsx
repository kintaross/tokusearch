import Link from 'next/link';
import { Metadata } from 'next';
import { BookOpen, TrendingUp, Calendar, Eye, Sparkles, List } from 'lucide-react';
import { fetchColumnsFromSheet, getAllCategories, paginateColumns } from '@/lib/columns';
import { RequestButton } from '@/components/columns/RequestButton';
import { Pagination } from '@/components/columns/Pagination';
import { ColumnImage } from '@/components/columns/ColumnImage';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'お得の基礎知識コラム | TokuSearch',
  description: 'お得活動に役立つ基礎知識やTipsをコラム形式でお届け。マイル変換、ポイント活用術、税金支払い方法など。',
  openGraph: {
    title: 'お得の基礎知識コラム | TokuSearch',
    description: 'お得活動に役立つ基礎知識やTips',
    url: 'https://tokusearch.vercel.app/columns',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/columns',
  },
};

type PageProps = {
  searchParams: { tag?: string; view?: string; category?: string; page?: string };
};

export default async function ColumnsPage({ searchParams }: PageProps) {
  const selectedTag = searchParams.tag;
  const view = searchParams.view || 'newest'; // 'newest', 'ranking', 'category'
  const selectedCategory = searchParams.category;
  const currentPage = parseInt(searchParams.page || '1', 10);
  
  let [allColumns, allCategories] = await Promise.all([
    fetchColumnsFromSheet({ status: 'published' }).catch(() => [] as Awaited<ReturnType<typeof fetchColumnsFromSheet>>),
    getAllCategories().catch(() => [] as string[]),
  ]);
  
  // タグでフィルタリング
  if (selectedTag) {
    allColumns = allColumns.filter(column => {
      const tags = column.tags ? column.tags.split(',').map(t => t.trim()) : [];
      return tags.includes(selectedTag);
    });
  }
  
  // カテゴリでフィルタリング
  if (selectedCategory) {
    allColumns = allColumns.filter(c => c.category === selectedCategory);
  }
  
  // カテゴリごとに分類
  const columnsByCategory: Record<string, typeof allColumns> = {};
  allCategories.forEach(category => {
    columnsByCategory[category] = allColumns.filter(c => c.category === category);
  });

  // 新着順（published_at降順）
  const sortedNewestColumns = [...allColumns].sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at).getTime();
    const dateB = new Date(b.published_at || b.created_at).getTime();
    return dateB - dateA;
  });
  
  // 新着順をページネーション
  const { columns: newestColumns, totalPages: newestTotalPages } = paginateColumns(
    sortedNewestColumns,
    currentPage,
    12
  );

  // ランキング順（view_count降順）
  const sortedRankingColumns = [...allColumns].sort((a, b) => b.view_count - a.view_count);
  
  // ランキング順をページネーション
  const { columns: rankingColumns, totalPages: rankingTotalPages } = paginateColumns(
    sortedRankingColumns,
    currentPage,
    12
  );
  
  // カテゴリ別（選択時）をページネーション
  const categoryColumns = selectedCategory ? columnsByCategory[selectedCategory] || [] : [];
  const { columns: paginatedCategoryColumns, totalPages: categoryTotalPages } = selectedCategory
    ? paginateColumns(categoryColumns, currentPage, 12)
    : { columns: [], totalPages: 1 };

  // 注目記事
  const featuredColumns = allColumns.filter(c => c.is_featured).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-brand-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">
              お得の基礎知識コラム
            </h1>
          </div>
          <RequestButton variant="secondary" size="md" />
        </div>
        <p className="text-sm md:text-base text-[#4c4f55]">
          お得活動に役立つ基礎知識やTipsをコラム形式でお届けします
        </p>
      </div>

      {/* 表示形式切り替えボタン */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/columns?view=newest"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'newest'
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-[#ebe7df] text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          新着
        </Link>
        <Link
          href="/columns?view=ranking"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'ranking'
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-[#ebe7df] text-gray-700 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          ランキング
        </Link>
        <Link
          href="/columns?view=category"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'category'
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-[#ebe7df] text-gray-700 hover:bg-gray-50'
          }`}
        >
          <List className="w-4 h-4 inline mr-2" />
          カテゴリ一覧
        </Link>
      </div>

      {/* カテゴリフィルタボタン（カテゴリ一覧表示時のみ） */}
      {view === 'category' && allCategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {allCategories.map((category) => (
            <Link
              key={category}
              href={`/columns?view=category&category=${encodeURIComponent(category)}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-[#ebe7df] text-gray-700 hover:bg-brand-50 hover:border-brand-300'
              }`}
            >
              {category}
            </Link>
          ))}
          {selectedCategory && (
            <Link
              href="/columns?view=category"
              className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              すべて表示
            </Link>
          )}
        </div>
      )}

      {/* タグフィルタ表示 */}
      {selectedTag && (
        <div className="mb-6 flex items-center gap-3 bg-white border border-[#ebe7df] rounded-lg p-4">
          <span className="text-gray-600">タグ:</span>
          <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full font-medium">
            #{selectedTag}
          </span>
          <Link 
            href={`/columns?view=${view}`}
            className="ml-auto text-sm text-brand-600 hover:text-brand-700 hover:underline"
          >
            フィルタをクリア
          </Link>
        </div>
      )}

      {allColumns.length === 0 ? (
        /* Coming Soon */
        <div className="bg-white border border-[#ebe7df] rounded-xl p-12 text-center">
          <div className="text-6xl mb-6">📝</div>
          <h2 className="text-2xl font-bold text-[#0f1419] mb-3">
            Coming Soon
          </h2>
          <p className="text-sm text-[#6b6f76] mb-6">
            お得の基礎知識コラムは現在準備中です
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 新着表示 */}
          {view === 'newest' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0f1419] mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-brand-600" />
                新着コラム
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newestColumns.map((column) => (
                  <Link
                    key={column.id}
                    href={`/columns/${column.slug}`}
                    className="bg-white border border-[#ebe7df] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {column.thumbnail_url && (
                      <div className="w-full h-48 overflow-hidden">
                        <ColumnImage
                          src={column.thumbnail_url}
                          alt={column.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="text-xs text-brand-600 font-medium mb-2">
                        {column.category}
                      </div>
                      <h3 className="font-bold text-lg text-[#0f1419] mb-2 line-clamp-2">
                        {column.title}
                      </h3>
                      <p className="text-sm text-[#6b6f76] line-clamp-2 mb-3">
                        {column.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(column.published_at || column.created_at).toLocaleDateString('ja-JP')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {column.view_count}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={newestTotalPages}
                baseUrl="/columns"
                searchParams={{ view: 'newest', tag: selectedTag }}
              />
            </div>
          )}

          {/* ランキング表示 */}
          {view === 'ranking' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0f1419] mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-brand-600" />
                人気ランキング
              </h2>
              <div className="bg-white border border-[#ebe7df] rounded-xl divide-y">
                {rankingColumns.map((column, index) => {
                  // ランキング表示では、ページネーション後のインデックスを計算
                  const globalIndex = (currentPage - 1) * 12 + index;
                  return (
                    <Link
                      key={column.id}
                      href={`/columns/${column.slug}`}
                      className="block p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-lg">
                          {globalIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-brand-600 font-medium">
                              {column.category}
                            </span>
                            {column.thumbnail_url && (
                              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                <ColumnImage
                                  src={column.thumbnail_url}
                                  alt={column.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-lg text-[#0f1419] mb-2 line-clamp-2">
                            {column.title}
                          </h3>
                          <p className="text-sm text-[#6b6f76] line-clamp-2 mb-3">
                            {column.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(column.published_at || column.created_at).toLocaleDateString('ja-JP')}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-brand-600">
                              <Eye className="w-3 h-3" />
                              {column.view_count} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={rankingTotalPages}
                baseUrl="/columns"
                searchParams={{ view: 'ranking', tag: selectedTag }}
              />
            </div>
          )}

          {/* カテゴリ別一覧 */}
          {view === 'category' && (
            <>
              {selectedCategory ? (
                // 選択されたカテゴリのみ表示
                <div>
                  <h2 className="text-2xl font-bold text-[#0f1419] mb-6">
                    {selectedCategory}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedCategoryColumns.map((column) => (
                      <Link
                        key={column.id}
                        href={`/columns/${column.slug}`}
                        className="bg-white border border-[#ebe7df] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {column.thumbnail_url && (
                          <div className="w-full h-48 overflow-hidden">
                            <ColumnImage
                              src={column.thumbnail_url}
                              alt={column.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-bold text-lg text-[#0f1419] mb-2 line-clamp-2">
                            {column.title}
                          </h3>
                          <p className="text-sm text-[#6b6f76] line-clamp-2 mb-3">
                            {column.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(column.published_at || column.created_at).toLocaleDateString('ja-JP')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {column.view_count}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={categoryTotalPages}
                    baseUrl="/columns"
                    searchParams={{ view: 'category', category: selectedCategory, tag: selectedTag }}
                  />
                </div>
              ) : (
                // 全カテゴリを表示
                <>
                  {Object.entries(columnsByCategory).map(([category, columns]) => {
                    if (columns.length === 0) return null;

                    return (
                      <div key={category} className="mb-12">
                        <h2 className="text-2xl font-bold text-[#0f1419] mb-6">
                          {category}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {columns.map((column) => (
                            <Link
                              key={column.id}
                              href={`/columns/${column.slug}`}
                              className="bg-white border border-[#ebe7df] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                            >
                              {column.thumbnail_url && (
                                <div className="w-full h-48 overflow-hidden">
                                  <ColumnImage
                                    src={column.thumbnail_url}
                                    alt={column.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="p-4">
                                <h3 className="font-bold text-lg text-[#0f1419] mb-2 line-clamp-2">
                                  {column.title}
                                </h3>
                                <p className="text-sm text-[#6b6f76] line-clamp-2 mb-3">
                                  {column.description}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(column.published_at || column.created_at).toLocaleDateString('ja-JP')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {column.view_count}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

