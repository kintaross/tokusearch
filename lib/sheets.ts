import { Deal, CategoryMain } from '@/types/deal';

// フィルタリングとソート（deals は DB 取得後の配列用ユーティリティ）
export function filterAndSortDeals(
  deals: Deal[],
  filters: {
    period?: 'today' | '3days' | '7days' | '30days';
    category?: CategoryMain;
    search?: string;
  },
  sortOption: 'default' | 'newest' | 'expiring' | 'discount_rate' | 'discount_amount' | 'score' = 'default'
): Deal[] {
  let filtered = [...deals];

  // デフォルト表示：直近10日以内のデータのみ
  if (!filters.period && !filters.category && !filters.search && sortOption === 'default') {
    const now = new Date();
    filtered = filtered.filter(deal => {
      if (!deal.created_at) return false;
      const createdDate = new Date(deal.created_at);
      const diffTime = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 10 && diffTime >= 0;
    });
  }

  // 期間フィルタ（投稿日時 = created_at）
  if (filters.period) {
    const now = new Date();

    filtered = filtered.filter(deal => {
      if (!deal.created_at) return false;
      const createdDate = new Date(deal.created_at);
      const diffTime = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

      switch (filters.period) {
        case 'today':
          return diffHours <= 24 && diffTime >= 0;
        case '3days':
          return diffDays <= 3 && diffTime >= 0;
        case '7days':
          return diffDays <= 7 && diffTime >= 0;
        case '30days':
          return diffDays <= 30 && diffTime >= 0;
        default:
          return true;
      }
    });
  }

  // カテゴリフィルタ
  if (filters.category) {
    filtered = filtered.filter(deal => deal.category_main === filters.category);
  }

  // 検索フィルタ
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(deal => {
      return (
        deal.title.toLowerCase().includes(searchLower) ||
        deal.summary?.toLowerCase().includes(searchLower) ||
        deal.detail?.toLowerCase().includes(searchLower) ||
        deal.service?.toLowerCase().includes(searchLower) ||
        deal.notes?.toLowerCase().includes(searchLower)
      );
    });
  }

  // ソート
  switch (sortOption) {
    case 'newest':
      filtered.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      break;
    case 'expiring':
      filtered.sort((a, b) => {
        const expA = parseExpirationDate(a.expiration);
        const expB = parseExpirationDate(b.expiration);
        if (expA && expB) {
          return expA.getTime() - expB.getTime();
        }
        return 0;
      });
      break;
    case 'discount_rate':
      filtered.sort((a, b) => {
        const rateA = a.discount_rate || 0;
        const rateB = b.discount_rate || 0;
        return rateB - rateA;
      });
      break;
    case 'discount_amount':
      filtered.sort((a, b) => {
        const amountA = a.discount_amount || 0;
        const amountB = b.discount_amount || 0;
        return amountB - amountA;
      });
      break;
    case 'score':
      filtered.sort((a, b) => {
        return b.score - a.score;
      });
      break;
    case 'default':
    default:
      filtered.sort((a, b) => {
        const expA = parseExpirationDate(a.expiration);
        const expB = parseExpirationDate(b.expiration);
        if (expA && expB) {
          const expDiff = expA.getTime() - expB.getTime();
          if (expDiff !== 0) return expDiff;
        }

        const priorityOrder = { A: 1, B: 2, C: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      break;
  }

  return filtered;
}

function parseExpirationDate(expiration: string): Date | null {
  if (!expiration) return null;
  const dateMatch = expiration.match(/^\d{4}-\d{2}-\d{2}$/);
  if (dateMatch) {
    return new Date(expiration);
  }
  return null;
}

export function paginateDeals(
  deals: Deal[],
  cursor?: string,
  limit: number = 20
): { deals: Deal[]; nextCursor?: string } {
  const startIndex = cursor ? deals.findIndex(d => d.id === cursor) + 1 : 0;
  const endIndex = startIndex + limit;

  const paginatedDeals = deals.slice(startIndex, endIndex);
  const nextCursor = endIndex < deals.length ? paginatedDeals[paginatedDeals.length - 1]?.id : undefined;

  return {
    deals: paginatedDeals,
    nextCursor,
  };
}
