import { memo } from 'react';
import Link from 'next/link';
import { Clock, Calendar, Tag } from 'lucide-react';
import { Deal } from '@/types/deal';
import FavoriteButton from './FavoriteButton';

interface DealCardProps {
  deal: Deal;
  viewMode?: 'grid' | 'list';
  compact?: boolean;
}

export default memo(function DealCard({ deal, viewMode = 'grid', compact = false }: DealCardProps) {
  if (viewMode === 'list') {
    return (
      <Link href={`/deals/${deal.id}`} className="block group">
        <article className="py-4 md:py-6 border-b border-[#e5e2da]">
          <div className="flex items-start justify-between gap-3 md:gap-6">
            <div className="space-y-2 md:space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs text-[#6b6f76]">
                <span className="font-semibold text-[#0f1419] text-xs md:text-sm">{deal.category_main}</span>
                {deal.category_sub && <span className="text-xs">{deal.category_sub}</span>}
                <span className="px-1.5 md:px-2 py-0.5 rounded-full bg-[#f2efe6] text-[#5c605f] font-medium text-xs">
                  {deal.priority === 'A' ? '注目' : deal.priority === 'B' ? 'おすすめ' : '通常'}
                </span>
              </div>
              <h2 className="text-base md:text-xl font-semibold text-[#0f1419] group-hover:text-brand-500 transition-colors line-clamp-2 leading-snug">
                {deal.title}
              </h2>
              <p className="text-xs md:text-sm text-[#4c4f55] leading-relaxed line-clamp-2 hidden md:block">
                {deal.summary}
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-[#6b6f76]">
                {deal.service && (
                  <span className="inline-flex items-center gap-1">
                    <Tag size={10} className="md:w-3 md:h-3" />
                    <span className="text-xs">{deal.service}</span>
                  </span>
                )}
                {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 text-[#c0463e] font-medium">
                    <Clock size={10} className="md:w-3 md:h-3" />
                    <span className="text-xs">{deal.expiration}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar size={10} className="md:w-3 md:h-3" />
                  <span className="text-xs">{deal.date}</span>
                </span>
              </div>
            </div>
            <FavoriteButton dealId={deal.id} />
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/deals/${deal.id}`} className="block group h-full">
      <article className="bg-white rounded-xl md:rounded-2xl border border-[#ebe7df] p-3 md:p-6 hover:border-brand-200 transition-all h-full flex flex-col shadow-sm hover:shadow-md">
        <div className="space-y-2 md:space-y-4 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs text-[#6b6f76]">
              <span className="font-semibold text-[#0f1419] text-xs md:text-sm">{deal.category_main}</span>
              {deal.category_sub && <span className="text-xs">{deal.category_sub}</span>}
            </div>
            <FavoriteButton dealId={deal.id} compact={compact} />
          </div>
          
          <div className="space-y-1.5 md:space-y-3">
            <h2 className="text-sm md:text-lg font-semibold text-[#0f1419] group-hover:text-brand-500 transition-colors line-clamp-2 leading-snug">
              {deal.title}
            </h2>
            <p className="text-xs md:text-sm text-[#4c4f55] line-clamp-2 leading-relaxed">
              {deal.summary}
            </p>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 text-xs">
            <span className="px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-[#f2efe6] text-[#5c605f] font-medium text-[10px] md:text-xs">
              {deal.priority === 'A' ? '注目' : deal.priority === 'B' ? 'おすすめ' : '通常'}
            </span>
            {deal.discount_rate && (
              <span className="px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-[#eef7ee] text-[#2e7d32] font-semibold text-[10px] md:text-xs">
                {deal.discount_rate}%還元
              </span>
            )}
          </div>
        </div>

        <div className="pt-1.5 md:pt-4 border-t border-[#f2eee4] mt-1.5 md:mt-4 space-y-1 md:space-y-2">
          <div className="flex items-center gap-1.5 md:gap-3 text-xs text-[#6b6f76] flex-wrap">
            {deal.service && (
              <span className="inline-flex items-center gap-0.5 md:gap-1">
                <Tag size={10} className="md:w-3 md:h-3" />
                <span className="text-[10px] md:text-xs">{deal.service}</span>
              </span>
            )}
            {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
              <span className="inline-flex items-center gap-0.5 md:gap-1 text-[#c0463e] font-medium">
                <Clock size={10} className="md:w-3 md:h-3" />
                <span className="text-[10px] md:text-xs">{deal.expiration}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 md:gap-1 text-xs text-[#6b6f76]">
            <Calendar size={10} className="md:w-3 md:h-3" />
            <span className="text-[10px] md:text-xs">{deal.date}</span>
          </div>
        </div>
      </article>
    </Link>
  );
})
