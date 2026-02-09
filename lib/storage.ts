// ローカルストレージを使ったお気に入り管理
export const FAVORITES_KEY = 'tokuSearch_favorites';

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addFavorite(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavorites();
    if (!favorites.includes(id)) {
      favorites.push(id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('お気に入りの追加に失敗しました:', error);
  }
}

export function removeFavorite(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavorites();
    const updated = favorites.filter((favId: string) => favId !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('お気に入りの削除に失敗しました:', error);
  }
}

export function isFavorite(id: string): boolean {
  if (typeof window === 'undefined') return false;
  return getFavorites().includes(id);
}

// 検索履歴管理
export const SEARCH_HISTORY_KEY = 'tokuSearch_history';

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const history = getSearchHistory();
    const updated = [query, ...history.filter(h => h !== query)].slice(0, 10);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('検索履歴の追加に失敗しました:', error);
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('検索履歴の削除に失敗しました:', error);
  }
}

// 閲覧数管理
export const VIEW_COUNT_KEY = 'tokuSearch_viewCounts';

export interface ViewCount {
  id: string;
  count: number;
  lastViewed: string;
}

export function getViewCounts(): Record<string, ViewCount> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(VIEW_COUNT_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function incrementViewCount(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const counts = getViewCounts();
    const now = new Date().toISOString();
    
    if (counts[id]) {
      counts[id] = {
        id,
        count: counts[id].count + 1,
        lastViewed: now,
      };
    } else {
      counts[id] = {
        id,
        count: 1,
        lastViewed: now,
      };
    }
    
    localStorage.setItem(VIEW_COUNT_KEY, JSON.stringify(counts));
  } catch (error) {
    console.error('閲覧数の更新に失敗しました:', error);
  }
}

export function getViewCount(id: string): number {
  if (typeof window === 'undefined') return 0;
  const counts = getViewCounts();
  return counts[id]?.count || 0;
}

export function getTopViewedDeals(dealIds: string[], limit: number = 5): string[] {
  if (typeof window === 'undefined') return [];
  const counts = getViewCounts();
  
  return dealIds
    .map(id => ({
      id,
      count: counts[id]?.count || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(item => item.id);
}
