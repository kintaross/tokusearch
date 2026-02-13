import type { WelkatsuPitfall } from '@/types/welkatsu-playbook';
import { AlertTriangle } from 'lucide-react';

export function PitfallsSection({ pitfalls }: { pitfalls: WelkatsuPitfall[] }) {
  if (!pitfalls?.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-[#0f1419] mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        地雷回避
      </h2>
      <div className="space-y-3">
        {pitfalls.map((p, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 ${
              p.severity === 'error'
                ? 'bg-red-50 border-red-200'
                : p.severity === 'info'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="font-semibold text-[#0f1419]">{p.title}</div>
            <p className="text-sm text-[#4c4f55] mt-1">{p.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
