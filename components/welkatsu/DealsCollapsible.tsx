'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { AreaTypeBadge, TargetUserTypeBadge, CategoryBadge } from '@/components/DealBadges';
import type { Deal } from '@/types/deal';
import { calculateRemainingDays } from '@/lib/home-utils';

export function DealsCollapsible({
  deals,
  title = '今日の狙い目（キャンペーン）',
}: {
  deals: Deal[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!deals?.length) return null;

  return (
    <section className="mb-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-bold text-[#0f1419]">
          <Tag className="w-5 h-5 text-purple-600" />
          {title}（{deals.length}件）
        </span>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {open ? (
        <div className="mt-2 space-y-3">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="block bg-white border border-[#ebe7df] rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  ウエル活
                </span>
                <CategoryBadge category={deal.category_main} />
                {deal.priority === 'A' ? (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    注目
                  </span>
                ) : null}
              </div>
              <h3 className="font-bold text-[#0f1419] mb-1">{deal.title}</h3>
              <p className="text-sm text-[#6b6f76] line-clamp-2 mb-2">{deal.summary}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {deal.discount_rate ? (
                  <span className="font-bold text-brand-600">{deal.discount_rate}%還元</span>
                ) : null}
                {deal.discount_amount ? (
                  <span className="font-bold text-green-600">¥{deal.discount_amount.toLocaleString()}</span>
                ) : null}
                {deal.expiration ? (
                  <span className="text-red-600 font-medium">{calculateRemainingDays(deal.expiration)}</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <AreaTypeBadge areaType={deal.area_type} />
                <TargetUserTypeBadge targetUserType={deal.target_user_type} />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
