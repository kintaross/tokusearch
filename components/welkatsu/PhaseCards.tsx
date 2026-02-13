import type { WelkatsuPhaseItem } from '@/types/welkatsu-playbook';
import { ShoppingBag, Store, CheckCircle } from 'lucide-react';

const PHASE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BeforeStore: ShoppingBag,
  InStore: Store,
  AfterStore: CheckCircle,
};

export function PhaseCards({ phases }: { phases: WelkatsuPhaseItem[] }) {
  if (!phases?.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-[#0f1419] mb-4">最短ルート（3フェーズ）</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {phases.map((phase) => {
          const Icon = PHASE_ICONS[phase.key] ?? ShoppingBag;
          return (
            <div
              key={phase.key}
              className="bg-white border-2 border-purple-100 rounded-xl p-4 hover:border-purple-200 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-[#0f1419]">{phase.title}</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#4c4f55]">
                {phase.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-purple-500 font-medium flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
