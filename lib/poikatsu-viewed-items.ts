// 表示した案件の保存管理（ローカルストレージ）
// 将来的に過去最高の還元率/還元額を表示するために使用

import { PoikatsuSearchResult } from '@/types/poikatsu';

export interface ViewedItem {
  id: string; // 一意のID（site-title-urlのハッシュ）
  site: string;
  title: string;
  originalUrl: string;
  rewardRate?: number;
  rewardAmount?: number;
  reward: string;
  firstViewedAt: number; // 初回表示日時
  lastViewedAt: number; // 最終表示日時
  viewCount: number; // 表示回数
  maxRewardRate?: number; // 過去最高還元率
  maxRewardAmount?: number; // 過去最高還元額
  history: Array<{ // 履歴（過去の還元率/還元額の変遷）
    rewardRate?: number;
    rewardAmount?: number;
    viewedAt: number;
  }>;
}

const STORAGE_KEY = 'poikatsu_viewed_items';
const MAX_HISTORY_PER_ITEM = 50; // 1案件あたりの履歴最大件数

// 案件の一意IDを生成
function generateItemId(result: PoikatsuSearchResult): string {
  // site + title + originalUrl の組み合わせで一意性を保証
  const combined = `${result.site}-${result.title}-${result.originalUrl}`;
  // 簡易的なハッシュ（実際のプロダクションではより堅牢な方法を使用）
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `item_${Math.abs(hash).toString(36)}`;
}

// 表示した案件を保存
export function saveViewedItem(result: PoikatsuSearchResult): ViewedItem {
  if (typeof window === 'undefined') {
    throw new Error('この関数はブラウザ環境でのみ使用できます');
  }

  try {
    const items = getViewedItems();
    const itemId = generateItemId(result);
    const now = Date.now();

    // 既存の案件を探す
    const existingIndex = items.findIndex(item => item.id === itemId);

    if (existingIndex >= 0) {
      // 既存の案件を更新
      const existing = items[existingIndex];
      const updated: ViewedItem = {
        ...existing,
        lastViewedAt: now,
        viewCount: existing.viewCount + 1,
        // 過去最高を更新
        maxRewardRate: result.rewardRate !== undefined
          ? Math.max(existing.maxRewardRate || 0, result.rewardRate)
          : existing.maxRewardRate,
        maxRewardAmount: result.rewardAmount !== undefined
          ? Math.max(existing.maxRewardAmount || 0, result.rewardAmount)
          : existing.maxRewardAmount,
        // 履歴に追加
        history: [
          ...existing.history,
          {
            rewardRate: result.rewardRate,
            rewardAmount: result.rewardAmount,
            viewedAt: now,
          }
        ].slice(-MAX_HISTORY_PER_ITEM), // 最新のN件のみ保持
      };

      items[existingIndex] = updated;
    } else {
      // 新しい案件を追加
      const newItem: ViewedItem = {
        id: itemId,
        site: result.site,
        title: result.title,
        originalUrl: result.originalUrl,
        rewardRate: result.rewardRate,
        rewardAmount: result.rewardAmount,
        reward: result.reward,
        firstViewedAt: now,
        lastViewedAt: now,
        viewCount: 1,
        maxRewardRate: result.rewardRate,
        maxRewardAmount: result.rewardAmount,
        history: [{
          rewardRate: result.rewardRate,
          rewardAmount: result.rewardAmount,
          viewedAt: now,
        }],
      };

      items.push(newItem);
    }

    // 保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    // 既存の案件を返す
    const savedItem = items.find(item => item.id === itemId);
    if (!savedItem) {
      throw new Error('案件の保存に失敗しました');
    }

    return savedItem;
  } catch (error) {
    console.error('表示案件の保存に失敗しました:', error);
    throw error;
  }
}

// 複数の案件を一括保存
export function saveViewedItems(results: PoikatsuSearchResult[]): ViewedItem[] {
  return results.map(result => {
    try {
      return saveViewedItem(result);
    } catch (error) {
      console.error(`案件の保存に失敗しました (${result.title}):`, error);
      // エラーが発生しても処理を続行
      return null as any;
    }
  }).filter(item => item !== null);
}

// 保存されている案件を取得
export function getViewedItems(): ViewedItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const items: ViewedItem[] = JSON.parse(stored);
    return items.sort((a, b) => b.lastViewedAt - a.lastViewedAt); // 最新順
  } catch (error) {
    console.error('表示案件の取得に失敗しました:', error);
    return [];
  }
}

// 特定の案件を取得
export function getViewedItem(result: PoikatsuSearchResult): ViewedItem | null {
  const items = getViewedItems();
  const itemId = generateItemId(result);
  return items.find(item => item.id === itemId) || null;
}

// 案件の過去最高情報を取得
export function getItemMaxReward(result: PoikatsuSearchResult): {
  maxRewardRate?: number;
  maxRewardAmount?: number;
  isNewMax: boolean; // 今回が過去最高かどうか
} {
  const item = getViewedItem(result);
  if (!item) {
    return {
      maxRewardRate: result.rewardRate,
      maxRewardAmount: result.rewardAmount,
      isNewMax: true,
    };
  }

  const isNewMaxRate = result.rewardRate !== undefined && 
    (item.maxRewardRate === undefined || result.rewardRate > item.maxRewardRate);
  const isNewMaxAmount = result.rewardAmount !== undefined && 
    (item.maxRewardAmount === undefined || result.rewardAmount > item.maxRewardAmount);

  return {
    maxRewardRate: item.maxRewardRate,
    maxRewardAmount: item.maxRewardAmount,
    isNewMax: isNewMaxRate || isNewMaxAmount,
  };
}

// 統計情報を取得
export function getViewedItemsStats(): {
  totalItems: number;
  totalViews: number;
  itemsWithMaxReward: number;
} {
  const items = getViewedItems();
  const totalViews = items.reduce((sum, item) => sum + item.viewCount, 0);
  const itemsWithMaxReward = items.filter(item => 
    item.maxRewardRate !== undefined || item.maxRewardAmount !== undefined
  ).length;

  return {
    totalItems: items.length,
    totalViews,
    itemsWithMaxReward,
  };
}

// すべての表示案件を削除
export function clearViewedItems(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('表示案件の削除に失敗しました:', error);
  }
}

// 古い履歴をクリーンアップ（オプション）
export function cleanupOldHistory(daysToKeep: number = 90): void {
  if (typeof window === 'undefined') return;

  try {
    const items = getViewedItems();
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const cleaned = items
      .filter(item => item.lastViewedAt >= cutoffDate) // 最近表示したもののみ保持
      .map(item => ({
        ...item,
        history: item.history.filter(h => h.viewedAt >= cutoffDate), // 履歴もクリーンアップ
      }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch (error) {
    console.error('履歴のクリーンアップに失敗しました:', error);
  }
}


