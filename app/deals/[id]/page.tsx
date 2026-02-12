import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { fetchDealById } from '@/lib/deals-data';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import ShareButton from '@/components/ShareButton';
import ViewCounter from '@/components/ViewCounter';
import { DealStructuredData, BreadcrumbStructuredData } from '@/components/StructuredData';
import { linkifyText } from '@/lib/linkify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DealDetailMeActions from '@/components/DealDetailMeActions';

export const dynamic = 'force-dynamic';

async function getDeal(id: string) {
  try {
    return await fetchDealById(id, { includePrivate: false });
  } catch (error) {
    console.error('データ取得エラー:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const deal = await getDeal(params.id);

  if (!deal) {
    return {
      title: 'お得情報が見つかりません | TokuSearch',
    };
  }

  const description = deal.summary || deal.title;
  const keywords = [
    deal.category_main,
    deal.category_sub,
    deal.service,
    'お得情報',
    'キャンペーン',
  ].filter(Boolean) as string[];

  return {
    title: `${deal.title} | TokuSearch`,
    description: description,
    keywords: keywords,
    openGraph: {
      title: deal.title,
      description: description,
      url: `https://tokusearch.vercel.app/deals/${deal.id}`,
      type: 'article',
      publishedTime: deal.created_at || deal.date,
      tags: [deal.category_main, deal.category_sub].filter(Boolean) as string[],
    },
    twitter: {
      card: 'summary_large_image',
      title: deal.title,
      description: description,
    },
    alternates: {
      canonical: `https://tokusearch.vercel.app/deals/${deal.id}`,
    },
  };
}

export default async function DealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const deal = await getDeal(params.id);

  if (!deal) {
    notFound();
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'A':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-50 text-red-700">
            注目
          </span>
        );
      case 'B':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-yellow-50 text-yellow-700">
            おすすめ
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded text-xs font-medium bg-gray-50 text-gray-700">
            通常
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DealStructuredData deal={deal} />
      <BreadcrumbStructuredData
        items={[
          { name: 'ホーム', url: 'https://tokusearch.vercel.app' },
          { name: deal.category_main, url: `https://tokusearch.vercel.app/?category=${deal.category_main}` },
          { name: deal.title, url: `https://tokusearch.vercel.app/deals/${deal.id}` },
        ]}
      />
      <ViewCounter dealId={deal.id} />
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        一覧に戻る
      </Link>

      <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* ヘッダー */}
        <div className="p-8 md:p-12 border-b border-gray-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700">
                {deal.category_main}
              </span>
              {deal.category_sub && (
                <span className="px-3 py-1.5 rounded text-sm font-medium bg-gray-50 text-gray-600">
                  {deal.category_sub}
                </span>
              )}
              {getPriorityBadge(deal.priority)}
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton dealId={deal.id} />
              <ShareButton id={deal.id} title={deal.title} type="deal" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {deal.title}
          </h1>
          
          <p className="text-lg text-gray-700 leading-relaxed">
            {deal.summary}
          </p>
        </div>

        {/* コンテンツ */}
        <div className="p-8 md:p-12 space-y-10">
          {/* メタデータ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {deal.service && (
              <div className="bg-gray-50 p-3 md:p-5 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1 md:mb-2">
                  <Tag size={14} className="md:w-4 md:h-4" />
                  サービス
                </div>
                <p className="text-gray-900 font-bold text-base md:text-lg">{deal.service}</p>
              </div>
            )}
            
            {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
              <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-600 text-xs font-medium mb-2">
                  <Clock size={16} />
                  期限
                </div>
                <p className="text-red-900 font-bold text-lg">{deal.expiration}</p>
              </div>
            )}

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <Calendar size={16} />
                掲載日
              </div>
              <p className="text-gray-900 font-bold text-lg">{deal.date}</p>
            </div>
            
            {deal.discount_rate && (
              <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                <div className="text-green-600 text-xs font-medium mb-2">割引率</div>
                <p className="text-green-900 font-bold text-2xl">{deal.discount_rate}%</p>
              </div>
            )}
            
            {deal.discount_amount && (
              <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                <div className="text-green-600 text-xs font-medium mb-2">還元額</div>
                <p className="text-green-900 font-bold text-2xl">¥{deal.discount_amount.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* 詳細セクション */}
          <div className="space-y-8">
            {deal.detail && deal.detail !== 'null' && deal.detail.trim() !== '' && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  詳細内容
                </h2>
                <div className="prose max-w-none text-gray-700 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {deal.detail}
                  </ReactMarkdown>
                </div>
              </section>
            )}

            {deal.conditions && deal.conditions !== 'null' && deal.conditions.trim() !== '' && (
              <section className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                <h2 className="text-xl font-bold text-yellow-900 mb-3">
                  適用条件・注意点
                </h2>
                <div className="prose prose-yellow max-w-none text-yellow-800 leading-relaxed text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {deal.conditions}
                  </ReactMarkdown>
                </div>
              </section>
            )}

            {deal.steps && deal.steps !== 'null' && deal.steps.trim() !== '' && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  利用手順
                </h2>
                <div className="prose max-w-none text-gray-700 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {deal.steps}
                  </ReactMarkdown>
                </div>
              </section>
            )}

            {deal.notes && deal.notes !== 'null' && deal.notes.trim() !== '' && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">備考</h2>
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {linkifyText(deal.notes)}
                  </div>
                </div>
              </section>
            )}

            <section className="pt-6 border-t border-gray-200">
              <DealDetailMeActions dealId={deal.id} />
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}
