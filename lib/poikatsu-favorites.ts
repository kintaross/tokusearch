// お気に入り機能の管理（ローカルストレージ）

import { FavoriteItem, PoikatsuSearchResult } from '@/types/poikatsu';

const STORAGE_KEY = 'poikatsu_favorites';

export function getFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const favorites: FavoriteItem[] = JSON.parse(stored);
    return favorites.sort((a, b) => b.addedAt - a.addedAt);
  } catch (error) {
    console.error('お気に入りの取得に失敗しました:', error);
    return [];
  }
}

export function addFavorite(result: PoikatsuSearchResult, keyword: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const favorites = getFavorites();
    const id = `${result.site}-${result.title}-${result.originalUrl}`;
    
    // 既に存在するかチェック
    if (favorites.some(fav => fav.id === id)) {
      return false; // 既に追加済み
    }
    
    const newFavorite: FavoriteItem = {
      id,
      result,
      keyword,
      addedAt: Date.now(),
    };
    
    const updated = [newFavorite, ...favorites];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('お気に入りの追加に失敗しました:', error);
    return false;
  }
}

export function removeFavorite(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(fav => fav.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('お気に入りの削除に失敗しました:', error);
  }
}

export function isFavorite(result: PoikatsuSearchResult): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const favorites = getFavorites();
    const id = `${result.site}-${result.title}-${result.originalUrl}`;
    return favorites.some(fav => fav.id === id);
  } catch (error) {
    console.error('お気に入りの確認に失敗しました:', error);
    return false;
  }
}

export function clearFavorites(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('お気に入りの削除に失敗しました:', error);
  }
}


