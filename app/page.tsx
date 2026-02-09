import Link from 'next/link';
import { Metadata } from 'next';
import { fetchDealsForPublic } from '@/lib/deals-data';
import { CategoryMain } from '@/types/deal';
import {
  calculateTodayStatus,
  getMustCheckDeals,
  getEndingSoonDeals,
  getTodayNewDeals,
  getCategoryCount,
  getWelkatsuCount,
  isWelkatsuPeriod,
  calculateRemainingDays,
  isActiveNow,
} from '@/lib/home-utils';
import { 
  AreaTypeBadge, 
  TargetUserTypeBadge,
  CategoryBadge 
} from '@/components/DealBadges';
import SearchBar from '@/components/SearchBar';
import { Clock, Calendar, TrendingUp, Sparkles, ShoppingBag, Star, BookOpen, Eye } from 'lucide-react';
import { fetchColumnsFromSheet } from '@/lib/columns';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TokuSearch | 今日のお得ダッシュボード',
  description: '今日チェックすべきお得情報を10秒で把握。マストチェック、締切間近、新着情報を一目で確認できる日次ダッシュボード。',
  keywords: ['お得情報', 'キャンペーン', '割引', 'ポイント還元', 'セール情報', 'クーポン', 'ダッシュボード'],
  openGraph: {
    title: 'TokuSearch | 今日のお得ダッシュボード',
    description: '今日チェックすべきお得情報を10秒で把握できる日次ダッシュボード',
    url: 'https://tokusearch.vercel.app',
    siteName: 'TokuSearch',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokuSearch | 今日のお得ダッシュボード',
    description: '今日チェックすべきお得情報を10秒で把握',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app',
  },
};

const CATEGORIES: CategoryMain[] = [
  'ドラッグストア・日用品',
  'スーパー・量販店・EC',
  'グルメ・外食',
  '旅行・交通',
  '決済・ポイント',
  'タバコ・嗜好品',
  'その他',
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const allDeals = await fetchDealsForPublic();
  
  // コラムを取得してランダムに1件選択
  const allColumns = await fetchColumnsFromSheet({ status: 'published' });
  const randomColumn = allColumns.length > 0 
    ? allColumns[Math.floor(Math.random() * allColumns.length)]
    : null;
  
  // 検索パラメータの取得
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const area_type = typeof searchParams.area_type === 'string' ? searchParams.area_type : '';
  const filter = typeof searchParams.filter === 'string' ? searchParams.filter : '';
  
  // 各種データ取得（フィルター前に必要）
  const todayStatus = calculateTodayStatus(allDeals);
  const isWelkatsu = isWelkatsuPeriod();
  const welkatsuCount = getWelkatsuCount(allDeals);
  
  let filteredDeals = allDeals;
  let filteredColumns: typeof allColumns = [];
  
  // ステータスフィルター（新着・開催中・終了間近）
  if (filter) {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfterTomorrow = new Date(Date.now() + 172800000).toISOString().slice(0, 10);
    
    if (filter === 'new') {
      // 過去24時間以内の新着（created_atベース）
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      filteredDeals = allDeals
        .filter((deal) => {
          if (!deal.is_public || !deal.created_at) return false;
          const createdAt = new Date(deal.created_at);
          return createdAt >= twentyFourHoursAgo && createdAt <= now;
        })
        .sort((a, b) => {
          // created_at降順（新しい順）
          return (b.created_at || '').localeCompare(a.created_at || '');
        });
    } else if (filter === 'active') {
      // 開催中（is_publicがtrueで期限が今日以降）
      filteredDeals = allDeals
        .filter((deal) => deal.is_public && isActiveNow(deal.expiration))
        .sort((a, b) => {
          // score降順 → priority（A→B→C） → discount_amount降順
          if (b.score !== a.score) return b.score - a.score;
          const priorityOrder: Record<string, number> = { A: 1, B: 2, C: 3 };
          const priorityA = priorityOrder[a.priority] || 4;
          const priorityB = priorityOrder[b.priority] || 4;
          if (priorityA !== priorityB) return priorityA - priorityB;
          const amountA = a.discount_amount || 0;
          const amountB = b.discount_amount || 0;
          return amountB - amountA;
        });
    } else if (filter === 'ending') {
      // 終了間近（今日〜2日後に終了、全件）
      filteredDeals = allDeals
        .filter((deal) => 
          deal.is_public &&
          (deal.expiration?.includes(today) ||
           deal.expiration?.includes(tomorrow) ||
           deal.expiration?.includes(dayAfterTomorrow))
        )
        .sort((a, b) => {
          // expiration昇順 → score降順
          const dateA = new Date(a.expiration || '9999-12-31');
          const dateB = new Date(b.expiration || '9999-12-31');
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          return b.score - a.score;
        });
    }
  }
  // 検索・絞り込みフィルター
  else if (search || category || area_type) {
    // お得情報のフィルタリング
    filteredDeals = allDeals.filter((deal) => {
      // is_publicのお得のみ表示
      if (!deal.is_public) return false;
      
      // キーワード検索（title, summary, detail, serviceを対象）
      if (search) {
        const searchText = `${deal.title} ${deal.summary} ${deal.detail} ${deal.service || ''}`.toLowerCase();
        if (!searchText.includes(search.toLowerCase())) {
          return false;
        }
      }
      
      // カテゴリフィルター
      if (category && deal.category_main !== category) {
        return false;
      }
      
      // チャネルフィルター
      if (area_type && deal.area_type !== area_type) {
        return false;
      }
      
      return true;
    });
    
    // コラムの検索（キーワード検索のみ、カテゴリ・チャネルフィルターはお得情報専用）
    if (search) {
      filteredColumns = allColumns.filter((column) => {
        const searchText = `${column.title} ${column.description} ${column.content_markdown || ''}`.toLowerCase();
        return searchText.includes(search.toLowerCase());
      });
    }
  }
  
  // 検索・フィルターが適用されているかチェック
  const isFiltered = !!(search || category || area_type || filter);
  
  // フィルター後のデータ取得（通常表示用、件数制限あり）
  const mustCheckDeals = isFiltered ? [] : getMustCheckDeals(allDeals);
  const endingSoonDeals = isFiltered ? [] : getEndingSoonDeals(allDeals);
  const todayNewDeals = isFiltered ? [] : getTodayNewDeals(allDeals);

  // ピックアップ・ランキング・ウエル活の件数取得
  const pickupCount = allDeals.filter((deal) => deal.is_public && deal.priority === 'A' && isActiveNow(deal.expiration)).length;
  const rankingCount = allDeals.filter((deal) => deal.is_public && isActiveNow(deal.expiration)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      {/* ヘッダー */}
      <section className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-[#0f1419] mb-2">
          今日の「お得」を、10秒でチェック。
        </h1>
        <p className="text-sm md:text-base text-[#4c4f55] mb-4">
          1日1回見るだけで、今日優先すべきお得情報が分かります
        </p>
        
        {/* 厳選コラム（ランダム1件） - 新着バナー位置に統合 */}
        {randomColumn && (
          <Link
            href={`/columns/${randomColumn.slug}`}
            className="block bg-gradient-to-r from-brand-500 to-brand-400 text-white rounded-lg p-3 mb-4 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium mb-1">📖 厳選コラム</div>
                <div className="text-xs opacity-90 line-clamp-1">{randomColumn.title}</div>
              </div>
              <div className="text-xl">→</div>
            </div>
          </Link>
        )}

        {/* 今日のステータス（3大カテゴリ） */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Link href="/?filter=new" className="bg-white border border-[#ebe7df] rounded-lg p-2 md:p-3 text-center hover:shadow-md hover:border-brand-200 transition-all cursor-pointer">
            <div className="text-[10px] md:text-xs text-[#6b6f76]">新着</div>
            <div className="text-lg md:text-2xl font-bold text-brand-600">{todayStatus.newToday}</div>
          </Link>
          <Link href="/?filter=active" className="bg-white border border-[#ebe7df] rounded-lg p-2 md:p-3 text-center hover:shadow-md hover:border-brand-200 transition-all cursor-pointer">
            <div className="text-[10px] md:text-xs text-[#6b6f76]">開催中</div>
            <div className="text-lg md:text-2xl font-bold text-[#0f1419]">{todayStatus.activeCount}</div>
          </Link>
          <Link href="/?filter=ending" className="bg-white border border-[#ebe7df] rounded-lg p-2 md:p-3 text-center hover:shadow-md hover:border-brand-200 transition-all cursor-pointer">
            <div className="text-[10px] md:text-xs text-[#6b6f76]">終了間近</div>
            <div className="text-lg md:text-2xl font-bold text-red-600">{todayStatus.endingSoon}</div>
          </Link>
        </div>
        
        {/* 検索バー */}
        <div className="mb-3">
          <SearchBar />
        </div>

        {/* ピックアップ・ランキング・ウエル活リンク（通常表示時のみ） */}
        {!isFiltered && (
          <div className="grid grid-cols-3 gap-2">
            <Link href="/pickup" className="bg-white border border-[#ebe7df] rounded-lg p-2 md:p-3 text-center hover:shadow-md hover:border-brand-200 transition-all cursor-pointer">
              <div className="text-xs md:text-sm font-medium text-[#0f1419]">ピックアップ</div>
            </Link>
            <Link href="/ranking" className="bg-white border border-[#ebe7df] rounded-lg p-2 md:p-3 text-center hover:shadow-md hover:border-brand-200 transition-all cursor-pointer">
              <div className="text-xs md:text-sm font-medium text-[#0f1419]">ランキング</div>
            </Link>
            <Link href="/welkatsu" className="bg-white border border-[#ebe7df] rounded-lg p-2 md:p-3 text-center hover:shadow-md hover:border-brand-200 transition-all cursor-pointer">
              <div className="text-xs md:text-sm font-medium text-[#0f1419]">ウエル活</div>
            </Link>
          </div>
        )}
      </section>

      {/* 検索・フィルター結果表示 */}
      {isFiltered ? (
        <>
          {/* お得情報の検索結果 */}
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-[#0f1419] mb-2 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-brand-600" />
                  {filter === 'new' && '新着のお得'}
                  {filter === 'active' && '開催中のお得'}
                  {filter === 'ending' && '終了間近のお得'}
                  {!filter && 'お得情報'}
                </h2>
                <p className="text-xs md:text-sm text-[#6b6f76]">
                  {filteredDeals.length}件のお得が見つかりました
                </p>
              </div>
              <Link 
                href="/"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                クリア
              </Link>
            </div>
            
            {filteredDeals.length === 0 ? (
              <div className="bg-white border border-[#ebe7df] rounded-xl p-8 text-center">
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-sm text-[#6b6f76]">
                  該当するお得情報は見つかりませんでした
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="block bg-white border border-[#ebe7df] rounded-xl p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <CategoryBadge category={deal.category_main} />
                      {deal.priority === 'A' && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          注目
                        </span>
                      )}
                      <AreaTypeBadge areaType={deal.area_type} />
                    </div>
                    
                    <h3 className="text-sm md:text-base font-bold text-[#0f1419] mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {deal.title}
                    </h3>
                    
                    <p className="text-xs text-[#6b6f76] mb-2 line-clamp-2">
                      {deal.summary}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {deal.discount_rate && (
                        <span className="font-bold text-brand-600">{deal.discount_rate}%還元</span>
                      )}
                      {deal.discount_amount && (
                        <span className="font-bold text-green-600">¥{deal.discount_amount.toLocaleString()}</span>
                      )}
                      {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
                        <span className="text-red-600 font-medium">
                          {calculateRemainingDays(deal.expiration)}
                        </span>
                      )}
                      {deal.service && (
                        <span className="text-[#6b6f76]">{deal.service}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* コラムの検索結果（キーワード検索時のみ表示） */}
          {search && (
            <section className="mb-8 md:mb-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-[#0f1419] mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-brand-600" />
                    コラム
                  </h2>
                  <p className="text-xs md:text-sm text-[#6b6f76]">
                    {filteredColumns.length}件のコラムが見つかりました
                  </p>
                </div>
              </div>
              
              {filteredColumns.length === 0 ? (
                <div className="bg-white border border-[#ebe7df] rounded-xl p-8 text-center">
                  <div className="text-3xl mb-3">📝</div>
                  <p className="text-sm text-[#6b6f76]">
                    該当するコラムは見つかりませんでした
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredColumns.map((column) => (
                    <Link
                      key={column.id}
                      href={`/columns/${column.slug}`}
                      className="bg-white border border-[#ebe7df] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {column.thumbnail_url && (
                        <div className="w-full h-40 relative overflow-hidden">
                          <img
                            src={column.thumbnail_url.includes('drive.google.com') 
                              ? `/api/image-proxy?url=${encodeURIComponent(column.thumbnail_url)}`
                              : column.thumbnail_url}
                            alt={column.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="text-xs text-brand-600 font-medium mb-2">
                          {column.category}
                        </div>
                        <h3 className="font-bold text-base text-[#0f1419] mb-2 line-clamp-2">
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
              )}
            </section>
          )}

          {/* 検索結果が0件の場合のメッセージ */}
          {!search && filteredDeals.length === 0 && (
            <div className="bg-white border border-[#ebe7df] rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-[#0f1419] mb-2">
                該当するお得が見つかりませんでした
              </h3>
              <p className="text-sm text-[#6b6f76] mb-6">
                検索条件を変更して再度お試しください
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-full font-semibold hover:bg-brand-600 transition-colors"
              >
                ホームに戻る
              </Link>
            </div>
          )}
        </>
      ) : (
        <>
          {/* 今日の新着お得（最上部へ移動） */}
          <section className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              <h2 className="text-lg md:text-2xl font-bold text-[#0f1419]">新着のお得</h2>
            </div>
            <p className="text-xs md:text-sm text-[#6b6f76] mb-4">
              過去24時間以内に追加されたお得情報です。
            </p>
            
            {todayNewDeals.length === 0 ? (
              <div className="bg-white border border-[#ebe7df] rounded-xl p-6 text-center text-[#6b6f76]">
                過去24時間以内に追加された新着情報はありません
              </div>
            ) : (
              <div className="space-y-3">
                {todayNewDeals.slice(0, 5).map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="block bg-white border border-[#ebe7df] rounded-xl p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <CategoryBadge category={deal.category_main} />
                      {deal.priority === 'A' && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          注目
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        NEW
                      </span>
                    </div>
                    
                    <h3 className="text-sm md:text-base font-bold text-[#0f1419] mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {deal.title}
                    </h3>
                    
                    <p className="text-xs text-[#6b6f76] mb-2 line-clamp-2">
                      {deal.summary}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {deal.discount_rate && (
                        <span className="font-bold text-brand-600">{deal.discount_rate}%還元</span>
                      )}
                      {deal.discount_amount && (
                        <span className="font-bold text-green-600">¥{deal.discount_amount.toLocaleString()}</span>
                      )}
                      {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
                        <span className="text-red-600 font-medium">
                          {calculateRemainingDays(deal.expiration)}
                        </span>
                      )}
                      {deal.service && (
                        <span className="text-[#6b6f76]">{deal.service}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 今日のマストチェック3件 */}
          <section className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-brand-600" />
          <h2 className="text-lg md:text-2xl font-bold text-[#0f1419]">今日のマストチェック3件</h2>
        </div>
        <p className="text-xs md:text-sm text-[#6b6f76] mb-4">
          今、特に見ておきたい"厳選3件"です。
        </p>
        
        {mustCheckDeals.length === 0 ? (
          <div className="bg-white border border-[#ebe7df] rounded-xl p-6 text-center text-[#6b6f76]">
            今日はマストチェック案件はありません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mustCheckDeals.map((deal) => (
          <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="bg-white border-2 border-brand-200 rounded-xl p-4 hover:shadow-lg transition-shadow group"
              >
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <CategoryBadge category={deal.category_main} />
                </div>
                
                <h3 className="text-base md:text-lg font-bold text-[#0f1419] mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                  {deal.title}
                </h3>
                
                <p className="text-xs md:text-sm text-[#6b6f76] mb-3 line-clamp-2">
                  {deal.summary}
                </p>
                
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm mb-2">
                  {deal.discount_rate && (
                    <span className="font-bold text-brand-600">{deal.discount_rate}%還元</span>
                  )}
                  {deal.discount_amount && (
                    <span className="font-bold text-green-600">¥{deal.discount_amount.toLocaleString()}</span>
                  )}
                  {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
                    <span className="text-red-600 font-medium">
                      {calculateRemainingDays(deal.expiration)}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  <AreaTypeBadge areaType={deal.area_type} />
                  <TargetUserTypeBadge targetUserType={deal.target_user_type} />
                </div>
          </Link>
            ))}
        </div>
        )}
      </section>

      {/* 締切が近いお得 */}
      <section className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
          <h2 className="text-lg md:text-2xl font-bold text-[#0f1419]">締切が近いお得</h2>
        </div>
        <p className="text-xs md:text-sm text-[#6b6f76] mb-4">
          今日〜2日後までに終了するお得情報です。
        </p>
        
        {endingSoonDeals.length === 0 ? (
          <div className="bg-white border border-[#ebe7df] rounded-xl p-6 text-center text-[#6b6f76]">
            3日以内に終了するお得はありません
          </div>
        ) : (
          <div className="space-y-3">
            {endingSoonDeals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="block bg-white border border-[#ebe7df] rounded-xl p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center min-w-[80px] max-w-[120px]">
                    <div className="text-xs text-red-600 font-medium">期限</div>
                    <div className="text-xs font-bold text-red-700 line-clamp-2">
                      {calculateRemainingDays(deal.expiration)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <CategoryBadge category={deal.category_main} />
                    </div>
                    
                    <h3 className="text-sm md:text-base font-bold text-[#0f1419] mb-1 line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {deal.title}
                    </h3>
                    
                    <p className="text-xs text-[#6b6f76] line-clamp-1 mb-2">
                      {deal.summary}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {deal.discount_rate && (
                        <span className="font-bold text-brand-600">{deal.discount_rate}%</span>
                      )}
                      {deal.discount_amount && (
                        <span className="font-bold text-green-600">¥{deal.discount_amount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
        </>
      )}

      {/* カテゴリ別ショートリンク */}
      <section className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-[#0f1419]" />
          <h2 className="text-lg md:text-2xl font-bold text-[#0f1419]">カテゴリから探す</h2>
            </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((category) => {
            const count = getCategoryCount(allDeals, category);
            return (
              <Link
                key={category}
                href={`/?category=${encodeURIComponent(category)}`}
                className="bg-white border border-[#ebe7df] rounded-xl p-4 hover:shadow-md hover:border-brand-300 transition-all group text-center"
              >
                <div className="text-sm md:text-base font-semibold text-[#0f1419] mb-1 group-hover:text-brand-600 transition-colors">
                  {category}
            </div>
                <div className="text-xs text-[#6b6f76]">{count}件</div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/ranking"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-full font-semibold hover:bg-brand-600 transition-colors"
          >
            すべてのお得を見る
          </Link>
              </div>
            </section>
    </div>
  );
}
