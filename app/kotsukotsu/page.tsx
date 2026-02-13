import Link from 'next/link';
import type { Metadata } from 'next';
import {
  MousePointerClick,
  PiggyBank,
  Sparkles,
  Link2,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { fetchDealsForPublic } from '@/lib/deals-data';
import {
  getKotsukotsuDeals,
  getKotsukotsuNewDeals,
  getKotsukotsuConstantDeals,
} from '@/lib/home-utils';
import { Deal } from '@/types/deal';
import KotsukotsuDealItem from '@/components/KotsukotsuDealItem';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'コツコツポイ活 | TokuSearch',
  description:
    'お小遣いLINKのポチポチ系など、日々の積み上げ型ポイ活をまとめる運用ハブ。今日のポチポチ・常設コツコツ・時短導線。',
  openGraph: {
    title: 'コツコツポイ活 | TokuSearch',
    description: 'コツコツ系ポイ活の運用ハブ。今日のポチポチ・常設・時短導線',
    url: 'https://tokusearch.vercel.app/kotsukotsu',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/kotsukotsu',
  },
};

/** 時短導線：よく使う外部リンク（静的） */
const SHORTCUT_LINKS: { label: string; href: string; description?: string }[] = [
  { label: 'お小遣いLINK', href: 'https://osukedi.com/', description: 'ポチポチ・ログボ' },
  { label: 'どこ得？', href: 'https://dokotoku.com/', description: 'ポイ活比較' },
  { label: 'ポイントサイト比較', href: 'https://point-site.com/', description: '還元率比較' },
  { label: 'ポイ活検索（TokuSearch）', href: '/poikatsu-search', description: 'サイト横断検索' },
];

function filterBySearch(deals: Deal[], search: string): Deal[] {
  if (!search.trim()) return deals;
  const q = search.trim().toLowerCase();
  return deals.filter(
    (d) =>
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.summary && d.summary.toLowerCase().includes(q)) ||
      (d.detail && d.detail.toLowerCase().includes(q)) ||
      (d.steps && d.steps.toLowerCase().includes(q)) ||
      (d.service && d.service.toLowerCase().includes(q)) ||
      (d.tags && d.tags.toLowerCase().includes(q))
  );
}

function filterByService(deals: Deal[], service: string): Deal[] {
  if (!service.trim()) return deals;
  const s = service.trim().toLowerCase();
  return deals.filter((d) => d.service && d.service.toLowerCase().includes(s));
}

function filterByTag(deals: Deal[], tag: string): Deal[] {
  if (!tag.trim()) return deals;
  const t = tag.trim().toLowerCase();
  return deals.filter((d) => d.tags && d.tags.toLowerCase().includes(t));
}

export default async function KotsukotsuPage({
  searchParams,
}: {
  searchParams: { search?: string; service?: string; tag?: string };
}) {
  const allDeals = await fetchDealsForPublic();
  let kotsukotsu = getKotsukotsuDeals(allDeals);

  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  const service = typeof searchParams.service === 'string' ? searchParams.service : '';
  const tag = typeof searchParams.tag === 'string' ? searchParams.tag : '';

  kotsukotsu = filterBySearch(kotsukotsu, search);
  kotsukotsu = filterByService(kotsukotsu, service);
  kotsukotsu = filterByTag(kotsukotsu, tag);

  const newDeals = getKotsukotsuNewDeals(kotsukotsu, 7);
  const constantDeals = getKotsukotsuConstantDeals(kotsukotsu);

  const uniqueServices = Array.from(
    new Set(kotsukotsu.map((d) => d.service).filter(Boolean))
  ).sort() as string[];
  const uniqueTags = Array.from(
    new Set(
      kotsukotsu.flatMap((d) => (d.tags ? d.tags.split(',').map((t) => t.trim()) : []))
    )
  ).filter(Boolean).sort();

  const query = (overrides: { service?: string; tag?: string }) => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (overrides.service !== undefined) {
      if (overrides.service) p.set('service', overrides.service);
    } else if (service) p.set('service', service);
    if (overrides.tag !== undefined) {
      if (overrides.tag) p.set('tag', overrides.tag);
    } else if (tag) p.set('tag', tag);
    const s = p.toString();
    return s ? `/kotsukotsu?${s}` : '/kotsukotsu';
  };

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <PiggyBank className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">
              コツコツポイ活
            </h1>
          </div>
          <p className="text-sm md:text-base text-[#4c4f55] mb-2">
            お小遣いLINKのポチポチ系など、<strong>日々の積み上げ型</strong>
            ポイ活をまとめる運用ハブです。毎日数分で取りこぼしを防ぎます。
          </p>
          <p className="text-xs text-[#6b6f76]">
            ポイ活上級者向け。今日やること（目安：約5〜15分）を一覧で確認できます。
          </p>
        </div>

        {/* フィルタ */}
        <section className="mb-8">
          <form
            method="get"
            action="/kotsukotsu"
            className="flex flex-wrap items-center gap-3 mb-4"
          >
            <input type="hidden" name="service" value={service} />
            <input type="hidden" name="tag" value={tag} />
            <label className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search size={18} className="text-[#6b6f76] shrink-0" />
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="タイトル・要約・タグで検索"
                className="w-full px-3 py-2 border border-[#ebe7df] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              検索
            </button>
          </form>
          {(uniqueServices.length > 0 || uniqueTags.length > 0) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-[#6b6f76] py-1">サービス:</span>
              {uniqueServices.slice(0, 10).map((s) => (
                <Link
                  key={s}
                  href={query(service === s ? { service: '' } : { service: s })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    service === s
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#f2efe6] text-[#5c605f] hover:bg-emerald-100'
                  }`}
                >
                  {s}
                </Link>
              ))}
              {uniqueTags.length > 0 && (
                <>
                  <span className="text-xs text-[#6b6f76] py-1 ml-2">タグ:</span>
                  {uniqueTags.slice(0, 8).map((t) => (
                    <Link
                      key={t}
                      href={query(tag === t ? { tag: '' } : { tag: t })}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        tag === t
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#f2efe6] text-[#5c605f] hover:bg-emerald-100'
                      }`}
                    >
                      {t}
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </section>

        {/* 今日のポチポチ（新着） */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-[#0f1419] mb-4">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            今日のポチポチ（直近7日）
          </h2>
          {newDeals.length === 0 ? (
            <div className="bg-white border border-[#ebe7df] rounded-xl p-8 text-center">
              <p className="text-[#6b6f76] text-sm">
                直近7日に追加されたコツコツ系の情報はありません
              </p>
              <p className="text-xs text-[#6b6f76] mt-1">
                n8nワークフローでXから取り込まれた情報がここに表示されます
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newDeals.map((deal) => (
                <KotsukotsuDealItem key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </section>

        {/* 常設コツコツ */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-[#0f1419] mb-4">
            <MousePointerClick className="w-6 h-6 text-emerald-600" />
            常設コツコツ（常時・毎日）
          </h2>
          {constantDeals.length === 0 ? (
            <div className="bg-white border border-[#ebe7df] rounded-xl p-8 text-center">
              <p className="text-[#6b6f76] text-sm">
                常設のコツコツ案件はありません
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {constantDeals.map((deal) => (
                <KotsukotsuDealItem key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </section>

        {/* 時短導線 */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-[#0f1419] mb-4">
            <Link2 className="w-6 h-6 text-emerald-600" />
            時短導線
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SHORTCUT_LINKS.map((item) => {
              const isInternal = item.href.startsWith('/');
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target={isInternal ? undefined : '_blank'}
                  rel={isInternal ? undefined : 'noopener noreferrer'}
                  className="flex flex-col gap-1 p-4 bg-white border border-[#ebe7df] rounded-xl hover:border-emerald-300 hover:shadow-md transition-all group"
                >
                  <span className="font-semibold text-[#0f1419] group-hover:text-emerald-600 transition-colors">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-xs text-[#6b6f76]">{item.description}</span>
                  )}
                </a>
              );
            })}
          </div>
        </section>

        {/* フッターリンク */}
        <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-[#ebe7df]">
          <Link
            href="/poikatsu-search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm"
          >
            ポイント比較を見る
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#ebe7df] text-[#0f1419] rounded-lg font-semibold hover:bg-[#f2efe6] transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
