import Link from 'next/link'
import { Metadata } from 'next';
import DealCard from '@/components/DealCard'
import { fetchDealsForPublic } from '@/lib/deals-data'
import { Deal } from '@/types/deal'

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'ランキング | TokuSearch - いま注目のお得ランキング',
  description: 'スコア・割引額・終了間近の3つの視点でランキングを生成。迷ったら、このページからチェックしてみてください。今人気のお得情報をまとめてご紹介。',
  openGraph: {
    title: 'ランキング | TokuSearch',
    description: 'いま注目のお得ランキング - スコア・割引額・終了間近の3つの視点で生成',
    url: 'https://tokusearch.vercel.app/ranking',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/ranking',
  },
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const allDeals = await fetchDealsForPublic().catch(() => [] as Deal[]);
  
  // カテゴリフィルタ
  const deals = searchParams.category
    ? allDeals.filter((deal) => deal.category_main === searchParams.category)
    : allDeals;

  const scoreRanking = [...deals]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10)

  const discountRanking = [...deals]
    .sort((a, b) => (b.discount_amount || 0) - (a.discount_amount || 0))
    .slice(0, 10)

  const endingSoon = [...deals]
    .filter(deal => deal.expiration)
    .sort(
      (a, b) =>
        new Date(a.expiration || '').getTime() -
        new Date(b.expiration || '').getTime()
    )
    .slice(0, 6)

  const pageTitle = searchParams.category
    ? `${searchParams.category} のランキング`
    : 'いま注目のお得ランキング';

  const pageDescription = searchParams.category
    ? `${searchParams.category}カテゴリのお得情報をスコア・割引額・終了間近の3つの視点でランキング表示しています。`
    : 'スコア・割引額・終了間近の3つの視点でランキングを生成。迷ったら、このページからチェックしてみてください。';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <header className="space-y-3 border-b border-[#e5e2da] pb-10">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-[#6b6f76]">ランキング</p>
          {searchParams.category && (
            <>
              <span className="text-[#6b6f76]">/</span>
              <span className="px-3 py-1 bg-brand-100 text-brand-700 text-sm font-semibold rounded-full">
                {searchParams.category}
              </span>
            </>
          )}
        </div>
        <h1 className="text-4xl font-semibold text-[#0f1419]">
          {pageTitle}
        </h1>
        <p className="text-lg text-[#4c4f55] max-w-3xl">
          {pageDescription}
        </p>
        {searchParams.category && (
          <div className="pt-4">
            <Link
              href="/ranking"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              ← すべてのカテゴリに戻る
            </Link>
          </div>
        )}
      </header>

      <section className="grid lg:grid-cols-2 gap-8">
        <RankingCard title="スコアランキング" deals={scoreRanking} metric="score" />
        <RankingCard
          title="割引額ランキング"
          deals={discountRanking}
          metric="discount"
        />
      </section>

      <section className="bg-white border border-[#ebe7df] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6b6f76] uppercase tracking-wider">
              期限が迫っている
            </p>
            <h2 className="text-2xl font-semibold text-[#0f1419]">ラストチャンス</h2>
          </div>
          <Link href="/magazine" className="text-sm text-brand-600 hover:text-brand-500">
            マガジンを見る
          </Link>
        </div>
        {endingSoon.length === 0 ? (
          <p className="text-sm text-[#6b6f76]">表示できるお得がありません。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {endingSoon.map(deal => (
              <DealCard key={deal.id} deal={deal} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function RankingCard({
  title,
  deals,
  metric,
}: {
  title: string
  deals: Deal[]
  metric: 'score' | 'discount'
}) {
  return (
    <div className="bg-white border border-[#ebe7df] rounded-3xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[#0f1419] mb-4">{title}</h2>
      {deals.length === 0 ? (
        <p className="text-sm text-[#6b6f76]">データがまだありません。</p>
      ) : (
        <ol className="space-y-4">
          {deals.map((deal, index) => (
            <li key={deal.id} className="flex gap-3">
              <span className="text-[#c8c2b4] font-semibold w-6 text-right">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 space-y-1">
                <Link
                  href={`/deals/${deal.id}`}
                  className="font-semibold text-[#0f1419] hover:text-brand-500 transition-colors line-clamp-2"
                >
                  {deal.title}
                </Link>
                <div className="text-xs text-[#6b6f76] flex items-center gap-3">
                  <span>{deal.category_main}</span>
                  {metric === 'score' && (
                    <span className="font-semibold text-brand-600">
                      Score {deal.score ?? 0}
                    </span>
                  )}
                  {metric === 'discount' && (
                    <span className="font-semibold text-brand-600">
                      ¥{(deal.discount_amount || 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

