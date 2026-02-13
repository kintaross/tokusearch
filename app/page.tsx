import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { fetchDealsForPublic } from '@/lib/deals-data';
import { CategoryMain } from '@/types/deal';
import {
  calculateTodayStatus,
  getMustCheckDeals,
  getEndingSoonDeals,
  getTodayNewDeals,
  getCategoryCount,
  isActiveNow,
  calculateRemainingDays,
  isKotsukotsuDeal,
} from '@/lib/home-utils';
import { fetchColumnsFromSheet } from '@/lib/columns';
import { Column } from '@/types/column';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'TokuSearch | 賢い選択、豊かな暮らし',
  description: '今日チェックすべきお得情報を10秒で把握。マストチェック、締切間近、新着情報を一目で確認できる日次ダッシュボード。',
};

const CATEGORIES: { id: CategoryMain; icon: string; label: string }[] = [
  { id: 'ドラッグストア・日用品', icon: 'medication', label: '日用品' },
  { id: 'スーパー・量販店・EC', icon: 'local_mall', label: 'スーパー・EC' },
  { id: 'グルメ・外食', icon: 'restaurant_menu', label: 'グルメ' },
  { id: '子育て', icon: 'child_care', label: '子育て' }, // カテゴリ名要確認
  { id: '旅行・交通', icon: 'flight', label: '旅行' },
  { id: '決済・ポイント', icon: 'payments', label: 'ポイ活' },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const allDeals = await fetchDealsForPublic();
  const allColumns = await fetchColumnsFromSheet({ status: 'published' });
  
  // 検索パラメータの取得
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const area_type = typeof searchParams.area_type === 'string' ? searchParams.area_type : '';
  const filter = typeof searchParams.filter === 'string' ? searchParams.filter : '';
  
  // フィルタリングロジック
  let filteredDeals = allDeals;
  let filteredColumns: typeof allColumns = [];

  // ステータスフィルター
  if (filter) {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfterTomorrow = new Date(Date.now() + 172800000).toISOString().slice(0, 10);
    
    if (filter === 'new') {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filteredDeals = allDeals.filter((deal) => {
          if (!deal.is_public || !deal.created_at) return false;
          const createdAt = new Date(deal.created_at);
          return createdAt >= twentyFourHoursAgo && createdAt <= now;
        }).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else if (filter === 'active') {
      filteredDeals = allDeals.filter((deal) => deal.is_public && isActiveNow(deal.expiration));
    } else if (filter === 'ending') {
      filteredDeals = allDeals.filter((deal) => 
          deal.is_public &&
          (deal.expiration?.includes(today) ||
           deal.expiration?.includes(tomorrow) ||
           deal.expiration?.includes(dayAfterTomorrow))
        );
    }
  }
  // 検索・絞り込みフィルター
  else if (search || category || area_type) {
    filteredDeals = allDeals.filter((deal) => {
      if (!deal.is_public) return false;
      if (search) {
        const searchText = `${deal.title} ${deal.summary} ${deal.detail} ${deal.service || ''}`.toLowerCase();
        if (!searchText.includes(search.toLowerCase())) return false;
      }
      if (category && deal.category_main !== category) return false;
      if (area_type && deal.area_type !== area_type) return false;
      return true;
    });
    
    if (search) {
      filteredColumns = allColumns.filter((column) => {
        const searchText = `${column.title} ${column.description} ${column.content_markdown || ''}`.toLowerCase();
        return searchText.includes(search.toLowerCase());
      });
    }
  }

  const isFiltered = !!(search || category || area_type || filter);
  
  // 通常表示用データ
  const displayDeals = isFiltered ? filteredDeals : getMustCheckDeals(allDeals);
  // 新着はコツコツ系を除外（コツコツは /kotsukotsu で表示）
  const todayNewDeals = isFiltered ? [] : getTodayNewDeals(allDeals).filter((d) => !isKotsukotsuDeal(d));

  const sectionTitle = isFiltered 
    ? (search ? `「${search}」の検索結果` : filter ? '絞り込み結果' : '検索結果')
    : '本日のお得';
  const sectionSubtitle = isFiltered
    ? `${filteredDeals.length}件のお得が見つかりました`
    : '毎日更新。今日のお得を見つけましょう。';

  // コラムの選定ロジック
  let displayColumns: Column[] = [];
  if (isFiltered && filteredColumns.length > 0) {
    displayColumns = filteredColumns;
  } else if (!isFiltered && allColumns.length > 0) {
    // 1. 最新（または今日）のコラム
    const sortedColumns = [...allColumns].sort((a, b) => 
      new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    );
    
    const firstColumn = sortedColumns[0];
    displayColumns.push(firstColumn);

    // 2. 関連コラム（同じカテゴリ、自分自身は除く）
    const relatedColumns = sortedColumns
      .filter(col => col.id !== firstColumn.id && col.category === firstColumn.category)
      .slice(0, 2);
    
    displayColumns = [...displayColumns, ...relatedColumns];

    // 3. 足りなければ他のカテゴリから埋める
    if (displayColumns.length < 3) {
      const otherColumns = sortedColumns
        .filter(col => !displayColumns.find(c => c.id === col.id))
        .slice(0, 3 - displayColumns.length);
      displayColumns = [...displayColumns, ...otherColumns];
    }
  }

  return (
    <div className="pt-20">
      {/* ヒーローセクション */}
      <section className="min-h-[60vh] md:min-h-[70vh] flex flex-col items-center justify-center px-4 md:px-6 text-center bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-soft-greige via-background-light to-transparent">
        <div className="max-w-4xl w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-soft-greige rounded-full mb-6 md:mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider text-accent-brown/60 uppercase">Elegance & Economy</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 tracking-tight text-accent-brown leading-[1.3]">
            暮らしを彩る、<br className="md:hidden"/><span className="text-primary">賢い選択</span>を。
          </h1>
          
          {/* 検索フォーム */}
          <form action="/" method="GET" className="relative max-w-3xl mx-auto group mb-12 md:mb-16">
            <div className="absolute inset-y-0 left-4 md:left-8 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-accent-brown/30 group-focus-within:text-primary transition-colors text-2xl md:text-3xl">search</span>
            </div>
            <input 
              name="search"
              defaultValue={search}
              className="w-full h-16 md:h-24 pl-12 md:pl-20 pr-10 bg-white border-2 border-soft-greige rounded-[2rem] md:rounded-[2.5rem] text-base md:text-xl shadow-[0_20px_50px_-12px_rgba(92,82,72,0.08)] focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-accent-brown/30" 
              placeholder="お得情報を探す" 
              type="text"
            />
            <button type="submit" className="absolute right-2 md:right-4 top-2 md:top-4 bottom-2 md:bottom-4 px-6 md:px-10 bg-primary text-white text-sm md:text-base font-bold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95">
              検索
            </button>
          </form>

          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6 md:mb-8">
              <div className="h-px w-8 bg-soft-greige"></div>
              <span className="text-xs md:text-sm font-bold text-accent-brown/40 tracking-widest uppercase">カテゴリーから探す</span>
              <div className="h-px w-8 bg-soft-greige"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-10">
              {CATEGORIES.map((cat) => (
                <Link key={cat.id} href={`/?category=${encodeURIComponent(cat.id)}`} className="flex flex-col items-center gap-2 md:gap-4 group w-20 md:w-auto">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white border border-soft-greige flex items-center justify-center shadow-sm group-hover:border-primary/30 group-hover:bg-warm-cream transition-all duration-300">
                    <span className="material-symbols-outlined text-2xl md:text-3xl text-primary">{cat.icon}</span>
                  </div>
                  <span className="text-[10px] md:text-sm font-bold text-accent-brown/70 group-hover:text-primary whitespace-nowrap">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 新着のお得（24時間以内） */}
      {!isFiltered && todayNewDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 border-b border-soft-greige/50">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined text-lg md:text-2xl">fiber_new</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-accent-brown tracking-tight">新着のお得</h2>
              <p className="text-accent-brown/50 text-xs md:text-sm">過去24時間以内に追加された情報</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {todayNewDeals.slice(0, 6).map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`} className="bg-white border border-soft-greige rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full tracking-wider uppercase">NEW</span>
                  <span className="text-[10px] md:text-xs text-accent-brown/40 truncate max-w-[120px]">{deal.category_main}</span>
                </div>
                <h3 className="font-bold text-base md:text-lg text-accent-brown group-hover:text-primary transition-colors line-clamp-2 mb-2">{deal.title}</h3>
                <div className="flex items-end justify-between mt-2 md:mt-4">
                  <div className="text-xs md:text-sm text-accent-brown/60 line-clamp-1 flex-1 mr-2">{deal.service}</div>
                  <div className="text-lg md:text-xl font-bold text-primary whitespace-nowrap">
                    {deal.discount_rate ? `${deal.discount_rate}%` : (deal.discount_amount ? `¥${deal.discount_amount.toLocaleString()}` : '')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* お得情報リスト（メイン） */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-accent-brown mb-2 tracking-tight">{sectionTitle}</h2>
            <p className="text-sm md:text-base text-accent-brown/50">{sectionSubtitle}</p>
          </div>
          {!isFiltered && (
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="text-[10px] md:text-xs tracking-widest uppercase">Live Updates</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            </div>
          )}
        </div>

        {displayDeals.length === 0 ? (
           <div className="bg-white border border-soft-greige rounded-3xl p-12 text-center">
             <p className="text-accent-brown/60">条件に一致するお得情報は見つかりませんでした。</p>
             <Link href="/" className="inline-block mt-4 text-primary font-bold hover:underline">ホームに戻る</Link>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {displayDeals.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`} className="bg-white border border-soft-greige transition-all duration-300 hover:shadow-xl hover:shadow-accent-brown/5 hover:-translate-y-1 rounded-2xl md:rounded-3xl p-4 md:p-8 flex items-stretch gap-3 md:gap-8 group cursor-pointer">
                {/* アイコン */}
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-warm-cream flex items-center justify-center border border-soft-greige shrink-0 self-center">
                  <span className="material-symbols-outlined text-2xl md:text-4xl text-primary">
                    {deal.category_main?.includes('ドラッグ') ? 'medication' : 
                     deal.category_main?.includes('スーパー') ? 'local_mall' : 
                     deal.category_main?.includes('グルメ') ? 'restaurant_menu' : 'shopping_basket'}
                  </span>
                </div>
                
                {/* テキスト情報 */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1 md:mb-2">
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-tag-saving/10 text-tag-saving text-[10px] font-bold rounded-full tracking-wider uppercase whitespace-nowrap">
                      {deal.priority === 'A' ? '注目' : 'お得'}
                    </span>
                    <span className="text-[10px] md:text-xs text-accent-brown/40 font-medium truncate">{deal.category_main}</span>
                  </div>
                  <h3 className="font-bold text-base md:text-2xl text-accent-brown group-hover:text-primary transition-colors line-clamp-2 md:line-clamp-1 leading-tight">{deal.title}</h3>
                  <p className="text-xs md:text-sm text-accent-brown/60 mt-1 line-clamp-1 hidden sm:block">{deal.summary}</p>
                </div>

                {/* 還元率 */}
                <div className="flex flex-col justify-center items-end shrink-0 pl-1 md:pl-4 border-l border-soft-greige/30 md:border-none">
                  <div className="text-[8px] md:text-[10px] text-accent-brown/40 font-bold tracking-widest mb-0 md:mb-1">RETURN</div>
                  <div className="text-xl md:text-4xl font-bold text-primary whitespace-nowrap">
                    {deal.discount_rate ? deal.discount_rate : '??'}
                    <span className="text-xs md:text-xl ml-0.5 md:ml-1">%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {!isFiltered && (
          <div className="mt-8 md:mt-12 text-center">
            <Link href="/ranking" className="inline-flex items-center gap-2 text-accent-brown font-bold px-8 py-3 md:px-10 md:py-4 text-sm md:text-base rounded-full border border-soft-greige hover:bg-white hover:shadow-lg transition-all">
              すべてのお得を見る <span className="material-symbols-outlined">arrow_right_alt</span>
            </Link>
          </div>
        )}
      </section>

      {/* コラムセクション */}
      <section className="bg-warm-cream py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-8 md:mb-16">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-accent-brown tracking-tight">注目のコラム</h2>
              <p className="text-accent-brown/60 text-sm md:text-lg">ポイ活のプロが教える、丁寧な暮らしとおトク術</p>
            </div>
            <Link href="/columns" className="text-primary font-bold flex items-center gap-1 md:gap-2 hover:gap-3 transition-all pb-1 border-b-2 border-primary/20 hover:border-primary text-sm md:text-base whitespace-nowrap ml-4">
              すべて見る <span className="material-symbols-outlined text-base md:text-lg">arrow_forward</span>
            </Link>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-3 md:gap-10 md:overflow-visible snap-x md:snap-none -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {displayColumns.map((column) => (
              <Link key={column.id} href={`/columns/${column.slug}`} className="min-w-[280px] w-[85%] md:w-auto flex-shrink-0 snap-center group cursor-pointer">
                <div className="aspect-[4/3] rounded-2xl md:rounded-[2rem] mb-4 md:mb-6 overflow-hidden bg-white shadow-sm relative">
                  {column.thumbnail_url ? (
                    <Image
                      alt={column.title}
                      className="object-cover group-hover:scale-105 transition-transform duration-1000"
                      src={
                        column.thumbnail_url.includes('drive.google.com')
                          ? `/api/image-proxy?url=${encodeURIComponent(column.thumbnail_url)}`
                          : column.thumbnail_url
                      }
                      fill
                      sizes="(max-width: 768px) 85vw, 400px"
                    />
                  ) : (
                    <div className="w-full h-full bg-soft-greige flex items-center justify-center text-accent-brown/20">
                      <span className="material-symbols-outlined text-4xl md:text-6xl">article</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-white text-accent-brown/60 text-[10px] font-bold rounded-full border border-soft-greige uppercase tracking-wider">
                    {column.category || 'Column'}
                  </span>
                  <span className="text-[10px] md:text-xs text-accent-brown/40 font-medium">
                    {new Date(column.published_at || column.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors leading-relaxed mb-2 md:mb-3 line-clamp-2">
                  {column.title}
                </h3>
                <p className="text-xs md:text-sm text-accent-brown/60 line-clamp-2 leading-relaxed">
                  {column.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 統計セクション（静的） */}
      <section className="bg-accent-brown text-white py-12 md:py-24 px-4 md:px-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-2 gap-8 md:gap-12 text-center relative z-10">
          <div className="space-y-2 md:space-y-3">
            <div className="text-3xl md:text-5xl font-bold tracking-tight">0<span className="text-primary">円</span></div>
            <div className="text-[10px] md:text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Free to Use</div>
          </div>
          <div className="space-y-2 md:space-y-3">
            <div className="text-3xl md:text-5xl font-bold tracking-tight">2<span className="text-primary">回</span></div>
            <div className="text-[10px] md:text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Updates / Day</div>
          </div>
        </div>
      </section>
    </div>
  );
}
