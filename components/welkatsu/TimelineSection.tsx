import type { WelkatsuTimelineSlot } from '@/types/welkatsu-playbook';
import { Clock } from 'lucide-react';

export function TimelineSection({ slots }: { slots: WelkatsuTimelineSlot[] }) {
  if (!slots?.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-[#0f1419] mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-600" />
        タイムライン
      </h2>
      <div className="space-y-4">
        {slots.map((slot, i) => (
          <div
            key={i}
            className="bg-white border border-[#ebe7df] rounded-xl p-4 pl-6 border-l-4 border-l-purple-400"
          >
            <div className="font-semibold text-[#0f1419] mb-1">{slot.label}</div>
            <p className="text-sm text-[#4c4f55]">{slot.description}</p>
            {slot.tips?.length ? (
              <ul className="mt-2 text-xs text-purple-700 space-y-1">
                {slot.tips.map((tip, j) => (
                  <li key={j}>・{tip}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
