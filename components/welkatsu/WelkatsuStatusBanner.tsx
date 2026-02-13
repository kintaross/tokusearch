import { Calendar } from 'lucide-react';
import type { WelkatsuStatus } from '@/lib/home-utils';

const LABELS: Record<WelkatsuStatus, string> = {
  prep: '準備期間（1〜19日）',
  today: '今日がウエル活デー',
  ended: '今月のウエル活は終了',
};

const DESCRIPTIONS: Record<WelkatsuStatus, string> = {
  prep: '20日に備えてポイント・クーポンを確認しましょう',
  today: 'ポイント1.5倍で効率よく使い切り',
  ended: '次回は来月1日〜20日に更新されます',
};

export function WelkatsuStatusBanner({
  status,
  welkatsuDay,
  todayLabel,
}: {
  status: WelkatsuStatus;
  welkatsuDay: string;
  todayLabel: string;
}) {
  const isToday = status === 'today';
  const isEnded = status === 'ended';

  return (
    <div
      className={`rounded-xl border p-4 ${
        isToday
          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
          : isEnded
            ? 'bg-gray-50 border-gray-200'
            : 'bg-amber-50/80 border-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar
          className={`w-5 h-5 ${isToday ? 'text-purple-600' : isEnded ? 'text-gray-500' : 'text-amber-700'}`}
        />
        <span
          className={`text-sm font-semibold ${
            isToday ? 'text-purple-900' : isEnded ? 'text-gray-700' : 'text-amber-900'
          }`}
        >
          {LABELS[status]}
        </span>
      </div>
      <div
        className={`text-xl font-bold ${isToday ? 'text-purple-700' : isEnded ? 'text-gray-600' : 'text-amber-800'}`}
      >
        {welkatsuDay}
      </div>
      <div
        className={`text-xs mt-1 ${isToday ? 'text-purple-600' : isEnded ? 'text-gray-500' : 'text-amber-700'}`}
      >
        本日：{todayLabel}
      </div>
      <p
        className={`mt-2 text-sm ${isToday ? 'text-purple-800' : isEnded ? 'text-gray-600' : 'text-amber-800'}`}
      >
        {DESCRIPTIONS[status]}
      </p>
    </div>
  );
}
