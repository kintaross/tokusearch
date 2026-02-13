import Link from 'next/link';
import type { Metadata } from 'next';
import { MousePointerClick, PiggyBank, Timer, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'コツコツポイ活 | TokuSearch',
  description: 'お小遣いLINKのポチポチ系など、コツコツ積み上げるタイプのポイ活をまとめて管理するページ（準備中）。',
  openGraph: {
    title: 'コツコツポイ活 | TokuSearch',
    description: 'コツコツ系のポイ活をまとめて管理（準備中）',
    url: 'https://tokusearch.vercel.app/kotsukotsu',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/kotsukotsu',
  },
};

export default function KotsukotsuPoikatsuPage() {
  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <PiggyBank className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">コツコツポイ活</h1>
          </div>
          <p className="text-sm md:text-base text-[#4c4f55]">
            「お小遣いLINKのポチポチ系」など、日々の積み上げ型ポイ活をまとめるページです（準備中）。
          </p>
        </div>

        {/* Coming soon */}
        <div className="bg-white border border-[#ebe7df] rounded-xl p-10 md:p-12 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold mb-3">
            <Wrench className="w-5 h-5" />
            準備中
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0f1419] mb-3">
            コツコツ系ポイ活の“管理画面”を作っています
          </h2>
          <p className="text-sm text-[#6b6f76] mb-8">
            まずはページと導線だけ用意しました。次のステップで、実際に使える機能を足していきます。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="border border-[#ebe7df] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick className="w-5 h-5 text-emerald-600" />
                <div className="font-bold text-[#0f1419]">今日のポチポチ</div>
              </div>
              <p className="text-sm text-[#6b6f76]">
                よく使うリンクを並べて、1日のタスクとして消化できる形にする想定です。
              </p>
            </div>
            <div className="border border-[#ebe7df] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-emerald-600" />
                <div className="font-bold text-[#0f1419]">回収タイミング</div>
              </div>
              <p className="text-sm text-[#6b6f76]">
                日次・週次・月次など、忘れがちなタイミングのリマインドを置く想定です。
              </p>
            </div>
            <div className="border border-[#ebe7df] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
                <div className="font-bold text-[#0f1419]">積み上げ可視化</div>
              </div>
              <p className="text-sm text-[#6b6f76]">
                どれくらい積み上がったかを“気持ちよく”見える化する想定です。
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/poikatsu-search"
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              ついでにポイント比較を見る
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

