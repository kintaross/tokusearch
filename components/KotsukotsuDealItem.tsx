import Link from 'next/link';
import { Clock, Tag, ExternalLink } from 'lucide-react';
import { Deal } from '@/types/deal';
import { calculateRemainingDays } from '@/lib/home-utils';
import FavoriteButton from './FavoriteButton';

interface KotsukotsuDealItemProps {
  deal: Deal;
}

export default function KotsukotsuDealItem({ deal }: KotsukotsuDealItemProps) {
  const expirationLabel = deal.expiration && deal.expiration.trim() !== ''
    ? calculateRemainingDays(deal.expiration) || deal.expiration
    : null;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block group bg-white border border-[#ebe7df] rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {deal.service && (
              <span className="inline-flex items-center gap-1 text-xs text-[#6b6f76]">
                <Tag size={12} />
                <span>{deal.service}</span>
              </span>
            )}
            {expirationLabel && (
              <span className="inline-flex items-center gap-1 text-xs text-[#c0463e] font-medium">
                <Clock size={12} />
                <span>{expirationLabel}</span>
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-[#0f1419] group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
            {deal.title}
          </h3>
          {deal.summary && (
            <p className="text-sm text-[#4c4f55] line-clamp-2">{deal.summary}</p>
          )}
          {(deal.discount_rate != null || deal.discount_amount != null) && (
            <div className="flex gap-2 mt-2 text-xs font-medium text-emerald-700">
              {deal.discount_rate != null && <span>{deal.discount_rate}%還元</span>}
              {deal.discount_amount != null && (
                <span>¥{deal.discount_amount.toLocaleString()}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FavoriteButton dealId={deal.id} compact />
          <span className="text-[#6b6f76]" aria-hidden>
            <ExternalLink size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
