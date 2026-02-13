'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';

const STORAGE_PREFIX = 'welkatsu-checklist-';

function loadChecked(month: string): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + month);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as number[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveChecked(month: string, set: Set<number>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + month, JSON.stringify([...set]));
  } catch (_) {}
}

export function Checklist({
  month,
  labels,
}: {
  month: string;
  labels: string[];
}) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setChecked(loadChecked(month));
  }, [month]);

  const toggle = useCallback(
    (index: number) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        saveChecked(month, next);
        return next;
      });
    },
    [month]
  );

  if (!labels?.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-[#0f1419] mb-4">チェックリスト</h2>
      <div className="bg-white border border-[#ebe7df] rounded-xl divide-y overflow-hidden">
        {labels.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                checked.has(i)
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {checked.has(i) ? <Check className="w-3.5 h-3.5" /> : null}
            </span>
            <span className={checked.has(i) ? 'text-gray-500 line-through' : 'text-[#0f1419]'}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
