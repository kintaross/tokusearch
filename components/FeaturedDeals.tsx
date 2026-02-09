import DealCard from './DealCard';
import { Deal } from '@/types/deal';
import { TrendingUp } from 'lucide-react';

interface FeaturedDealsProps {
  deals: Deal[];
  title: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

export default function FeaturedDeals({ deals, title, icon, compact = false }: FeaturedDealsProps) {
  if (deals.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-8">
        {icon || <TrendingUp size={20} className="text-gray-600" />}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className={compact 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      }>
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} compact={compact} />
        ))}
      </div>
    </section>
  );
}
