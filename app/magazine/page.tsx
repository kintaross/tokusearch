import Link from 'next/link'
import { Metadata } from 'next';
import DealCard from '@/components/DealCard'
import { fetchDealsForPublic } from '@/lib/deals-data'
import { CategoryMain } from '@/types/deal'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'ピックアップ | TokuSearch - 編集部おすすめのお得を、読む',
  description: 'キャンペーンの背景や使いこなしのヒントをまとめました。ジャンル別の記事から、お得活用のヒントをキャッチアップしましょう。決済・ポイント、グルメ・外食、旅行・交通などのカテゴリ特集。',
  openGraph: {
    title: 'ピックアップ | TokuSearch',
    description: '編集部おすすめのお得を、読む。カテゴリ別の特集記事をお届け。',
    url: 'https://tokusearch.vercel.app/magazine',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/magazine',
  },
};

const FEATURED_CATEGORIES: CategoryMain[] = [
  '決済・ポイント',
  'グルメ・外食',
  '旅行・交通',
]

export default async function MagazinePage() {
  const deals = await fetchDealsForPublic()
  const freshPicks = [...deals]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  const sections = FEATURED_CATEGORIES.map(category => ({
    category,
    items: deals
      .filter(deal => deal.category_main === category)
      .slice(0, 3),
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <header className="space-y-3 border-b border-[#e5e2da] pb-10">
        <p className="text-sm font-semibold text-[#6b6f76]">ピックアップ</p>
        <h1 className="text-4xl font-semibold text-[#0f1419]">
          編集部おすすめのお得を、読む。
        </h1>
        <p className="text-lg text-[#4c4f55] max-w-3xl">
          キャンペーンの背景や使いこなしのヒントをまとめました。ジャンル別の記事から、お得活用のヒントをキャッチアップしましょう。
        </p>
      </header>

      <section className="bg-white border border-[#ebe7df] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6b6f76] uppercase tracking-wider">
              最新ピックアップ
            </p>
            <h2 className="text-2xl font-semibold text-[#0f1419]">Fresh Picks</h2>
          </div>
          <Link href="/" className="text-sm text-brand-600 hover:text-brand-500">
            ホームへ戻る
          </Link>
        </div>
        {freshPicks.length === 0 ? (
          <p className="text-sm text-[#6b6f76]">表示できるデータがありません。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freshPicks.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </section>

      {sections.map(section => (
        <section
          key={section.category}
          className="bg-white border border-[#ebe7df] rounded-3xl p-6 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6b6f76] uppercase tracking-wider">
                カテゴリ特集
              </p>
              <h3 className="text-xl font-semibold text-[#0f1419]">
                {section.category}
              </h3>
            </div>
          </div>
          {section.items.length === 0 ? (
            <p className="text-sm text-[#6b6f76]">準備中です。</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section.items.map(deal => (
                <DealCard key={deal.id} deal={deal} compact />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

