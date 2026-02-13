import type { WelkatsuPointCalc } from '@/types/welkatsu-playbook';
import { Calculator } from 'lucide-react';

export function PointCalcSection({ pointCalc }: { pointCalc: WelkatsuPointCalc }) {
  if (!pointCalc?.description) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-[#0f1419] mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-purple-600" />
        ポイントの目安
      </h2>
      <div className="bg-white border border-[#ebe7df] rounded-xl p-4">
        <p className="text-[#4c4f55]">{pointCalc.description}</p>
        {pointCalc.formula ? (
          <p className="mt-2 text-sm font-mono text-purple-700 bg-purple-50 rounded p-2">
            {pointCalc.formula}
          </p>
        ) : null}
        {pointCalc.example ? (
          <p className="mt-2 text-sm text-gray-600">例: {pointCalc.example}</p>
        ) : null}
      </div>
    </section>
  );
}
