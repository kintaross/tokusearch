import Link from 'next/link';
import { Metadata } from 'next';
import { Archive, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ウエル活アーカイブ | TokuSearch',
  description: '過去のウエル活キャンペーン情報をアーカイブ。月別にウエルシアのお得情報を振り返ることができます。',
  openGraph: {
    title: 'ウエル活アーカイブ | TokuSearch',
    description: '過去のウエル活キャンペーン情報',
    url: 'https://tokusearch.vercel.app/welkatsu/archive',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/welkatsu/archive',
  },
};

export default function WelkatsuArchivePage() {
  // TODO: 実際のアーカイブデータ取得ロジックを実装
  // 月別のアーカイブ一覧を表示する

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Archive className="w-8 h-8 text-gray-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">
            ウエル活アーカイブ
          </h1>
        </div>
        <p className="text-sm md:text-base text-[#4c4f55]">
          過去のウエル活キャンペーン情報を月別にご覧いただけます
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white border border-[#ebe7df] rounded-xl p-12 text-center">
        <div className="text-6xl mb-6">📚</div>
        <h2 className="text-2xl font-bold text-[#0f1419] mb-3">
          Coming Soon
        </h2>
        <p className="text-sm text-[#6b6f76] mb-6">
          過去のウエル活情報アーカイブは現在準備中です
        </p>
        <p className="text-xs text-[#6b6f76] mb-8">
          今後、月別のアーカイブ機能を追加予定です
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/welkatsu"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            今月のウエル活を見る
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      </div>

      {/* 実装予定の機能説明 */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-[#0f1419] mb-3">実装予定の機能</h3>
        <ul className="space-y-2 text-sm text-[#6b6f76]">
          <li className="flex items-start gap-2">
            <span className="text-brand-600">•</span>
            <span>月別アーカイブ一覧（2024年1月、2024年2月...）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-600">•</span>
            <span>各月のウエル活キャンペーン詳細</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-600">•</span>
            <span>過去の人気キャンペーンランキング</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-600">•</span>
            <span>ウエル活攻略Tips・活用事例</span>
          </li>
        </ul>
      </div>
    </div>
  );
}



