// 検索履歴の管理（ローカルストレージ）

const STORAGE_KEY = 'poikatsu_search_history';
const MAX_HISTORY = 10;

export interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
  resultCount?: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: SearchHistoryItem[] = JSON.parse(stored);
    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY);
  } catch (error) {
    console.error('検索履歴の取得に失敗しました:', error);
    return [];
  }
}

export function addSearchHistory(keyword: string, resultCount?: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getSearchHistory();
    const trimmedKeyword = keyword.trim();
    
    if (!trimmedKeyword) return;
    
    // 既存の履歴から同じキーワードを削除
    const filtered = history.filter(item => item.keyword !== trimmedKeyword);
    
    // 新しい履歴を先頭に追加
    const newItem: SearchHistoryItem = {
      keyword: trimmedKeyword,
      timestamp: Date.now(),
      resultCount,
    };
    
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('検索履歴の保存に失敗しました:', error);
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('検索履歴の削除に失敗しました:', error);
  }
}

export function removeSearchHistoryItem(keyword: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getSearchHistory();
    const filtered = history.filter(item => item.keyword !== keyword);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('検索履歴の削除に失敗しました:', error);
  }
}


