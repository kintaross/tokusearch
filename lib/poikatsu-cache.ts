// 検索結果のキャッシュ管理（ローカルストレージ）

import { PoikatsuSearchResponse } from '@/types/poikatsu';

const CACHE_KEY_PREFIX = 'poikatsu_search_cache_';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分

interface CachedResult {
  data: PoikatsuSearchResponse;
  timestamp: number;
}

export function getCachedResult(keyword: string): PoikatsuSearchResponse | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${keyword.toLowerCase().trim()}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp }: CachedResult = JSON.parse(cached);
    
    // キャッシュの有効期限をチェック
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('キャッシュの取得に失敗しました:', error);
    return null;
  }
}

export function setCachedResult(keyword: string, data: PoikatsuSearchResponse): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${keyword.toLowerCase().trim()}`;
    const cached: CachedResult = {
      data,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    
    // 古いキャッシュを削除（最大10件まで保持）
    cleanupOldCache();
  } catch (error) {
    console.error('キャッシュの保存に失敗しました:', error);
  }
}

function cleanupOldCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
    const cacheItems: Array<{ key: string; timestamp: number }> = [];
    
    keys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp }: CachedResult = JSON.parse(cached);
          cacheItems.push({ key, timestamp });
        }
      } catch (e) {
        // 無効なキャッシュは削除
        localStorage.removeItem(key);
      }
    });
    
    // タイムスタンプでソート（古い順）
    cacheItems.sort((a, b) => a.timestamp - b.timestamp);
    
    // 10件を超える場合は古いものを削除
    if (cacheItems.length > 10) {
      const toRemove = cacheItems.slice(0, cacheItems.length - 10);
      toRemove.forEach(item => localStorage.removeItem(item.key));
    }
    
    // 期限切れのキャッシュを削除
    const now = Date.now();
    cacheItems.forEach(item => {
      if (now - item.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(item.key);
      }
    });
  } catch (error) {
    console.error('キャッシュのクリーンアップに失敗しました:', error);
  }
}

export function clearCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('キャッシュの削除に失敗しました:', error);
  }
}


