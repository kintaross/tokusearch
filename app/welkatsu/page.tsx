import Link from 'next/link';
import { Metadata } from 'next';
import { fetchDealsForPublic } from '@/lib/deals-data';
import { getWelkatsuStatus, getTodayString, isWelkatsuPeriod } from '@/lib/home-utils';
import { getDbPool } from '@/lib/db';
import { getCurrentMonth, getWelkatsuPlaybookForMonth } from '@/lib/db-welkatsu-playbooks';
import { ShoppingBag, Calendar, Archive } from 'lucide-react';
import { WelkatsuStatusBanner } from '@/components/welkatsu/WelkatsuStatusBanner';
import { PhaseCards } from '@/components/welkatsu/PhaseCards';
import { Checklist } from '@/components/welkatsu/Checklist';
import { TimelineSection } from '@/components/welkatsu/TimelineSection';
import { RegisterSteps } from '@/components/welkatsu/RegisterSteps';
import { PitfallsSection } from '@/components/welkatsu/PitfallsSection';
import { PointCalcSection } from '@/components/welkatsu/PointCalcSection';
import { DealsCollapsible } from '@/components/welkatsu/DealsCollapsible';
import { ColumnLinks } from '@/components/welkatsu/ColumnLinks';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ウエル活・当日攻略 | TokuSearch',
  description:
    '毎月20日のウエル活を迷わず回す当日攻略。最短ルート・レジ手順・地雷回避・ポイントの目安。ウエルシアポイント1.5倍デー特化。',
  openGraph: {
    title: 'ウエル活・当日攻略 | TokuSearch',
    description: '毎月20日ウエル活の当日攻略。最短ルート・レジ手順・地雷回避',
    url: 'https://tokusearch.vercel.app/welkatsu',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/welkatsu',
  },
};

export default async function WelkatsuPage() {
  const today = getTodayString();
  const status = getWelkatsuStatus();
  const isActive = isWelkatsuPeriod();
  const currentMonthStr = getCurrentMonth();
  const welkatsuDay = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月20日`;

  let playbook = null;
  try {
    const pool = getDbPool();
    playbook = await getWelkatsuPlaybookForMonth(pool, currentMonthStr);
  } catch (_) {
    // DB未設定時は playbook なしで表示
  }

  const allDeals = await fetchDealsForPublic();
  const welkatsuDeals = allDeals.filter((deal) => {
    if (!deal.is_public || !deal.is_welkatsu) return false;
    const dealDate = new Date(deal.date || deal.created_at);
    if (
      dealDate.getFullYear() === new Date().getFullYear() &&
      dealDate.getMonth() === new Date().getMonth()
    ) {
      return true;
    }
    if (deal.expiration) {
      const exp = new Date(deal.expiration);
      if (
        exp.getFullYear() === new Date().getFullYear() &&
        exp.getMonth() === new Date().getMonth() &&
        exp.getDate() >= 1 &&
        exp.getDate() <= 20
      ) {
        return true;
      }
    }
    return false;
  });
  const sortedDeals = [...welkatsuDeals].sort((a, b) => {
    const order = { A: 1, B: 2, C: 3 };
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return (b.score ?? 0) - (a.score ?? 0);
  });

  const content = playbook?.content_json ?? {};
  const hasPlaybookContent =
    (content.phases?.length ?? 0) > 0 ||
    (content.timeline?.length ?? 0) > 0 ||
    (content.register_steps?.length ?? 0) > 0 ||
    (content.pitfalls?.length ?? 0) > 0 ||
    content.point_calc;

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">ウエル活</h1>
          </div>
          <p className="text-sm md:text-base text-[#4c4f55] mb-4">
            毎月20日はウエルシアでポイント1.5倍。当日迷わず回すための攻略に特化しました。
          </p>
          <WelkatsuStatusBanner
            status={status}
            welkatsuDay={welkatsuDay}
            todayLabel={today}
          />
        </div>

        {/* 当日攻略コンテンツ（DB playbook またはフォールバック） */}
        {isActive && (
          <>
            {hasPlaybookContent ? (
              <>
                {playbook?.summary ? (
                  <p className="text-[#4c4f55] mb-6 pl-0">{playbook.summary}</p>
                ) : null}
                {content.phases?.length ? <PhaseCards phases={content.phases} /> : null}
                {content.checklist_labels?.length ? (
                  <Checklist month={currentMonthStr} labels={content.checklist_labels} />
                ) : null}
                {content.timeline?.length ? (
                  <TimelineSection slots={content.timeline} />
                ) : null}
                {content.register_steps?.length ? (
                  <RegisterSteps steps={content.register_steps} />
                ) : null}
                {content.pitfalls?.length ? (
                  <PitfallsSection pitfalls={content.pitfalls} />
                ) : null}
                {content.point_calc ? (
                  <PointCalcSection pointCalc={content.point_calc} />
                ) : null}
                {playbook?.updated_at ? (
                  <p className="text-xs text-gray-500 mb-6">
                    攻略の最終更新: {new Date(playbook.updated_at).toLocaleDateString('ja-JP')}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="bg-white border border-[#ebe7df] rounded-xl p-6 mb-8 text-center">
                <p className="text-[#6b6f76] mb-2">
                  今月の当日攻略は準備中です。下の「今日の狙い目」でキャンペーンを確認できます。
                </p>
              </div>
            )}

            <ColumnLinks />

            <DealsCollapsible deals={sortedDeals} title="今日の狙い目（キャンペーン）" />
          </>
        )}

        {!isActive && (
          <>
            <div className="bg-white border border-[#ebe7df] rounded-xl p-8 text-center mb-8">
              <div className="text-4xl mb-4">📅</div>
              <h2 className="text-xl font-bold text-[#0f1419] mb-2">
                今月のウエル活情報は終了しました
              </h2>
              <p className="text-sm text-[#6b6f76] mb-4">
                次回は来月1日〜20日に更新されます
              </p>
              <p className="text-xs text-[#6b6f76]">
                毎月20日がウエルシアのポイント1.5倍デーです
              </p>
            </div>
            <ColumnLinks />
          </>
        )}

        {/* 過去アーカイブ */}
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Archive className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-[#0f1419]">過去のウエル活情報</h3>
          </div>
          <p className="text-sm text-[#6b6f76] mb-4">
            過去のウエル活キャンペーン情報をご覧になれます
          </p>
          <Link
            href="/welkatsu/archive"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
          >
            <Archive className="w-4 h-4" />
            アーカイブを見る
          </Link>
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
