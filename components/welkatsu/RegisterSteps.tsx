import type { WelkatsuRegisterStep } from '@/types/welkatsu-playbook';
import { CreditCard } from 'lucide-react';

export function RegisterSteps({ steps }: { steps: WelkatsuRegisterStep[] }) {
  if (!steps?.length) return null;

  const sorted = [...steps].sort((a, b) => a.order - b.order);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-[#0f1419] mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-purple-600" />
        レジでの手順
      </h2>
      <div className="bg-white border-2 border-purple-100 rounded-xl p-4 space-y-3">
        {sorted.map((step) => (
          <div key={step.order} className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">
              {step.order}
            </span>
            <div>
              <div className="font-medium text-[#0f1419]">{step.label}</div>
              <p className="text-sm text-[#4c4f55] mt-0.5">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
