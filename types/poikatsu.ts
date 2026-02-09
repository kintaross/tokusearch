// ポイ活サイト横断検索の型定義

export interface PoikatsuSearchResult {
  site: string; // ポイ活サイト名（例: "モッピー", "ポイントインカム"）
  title: string; // 案件タイトル
  reward: string; // 還元率・還元額（テキスト形式）
  rewardRate?: number; // 還元率（数値、パース可能な場合）
  rewardAmount?: number; // 還元額（数値、パース可能な場合）
  originalUrl: string; // 元のアフィリエイトURL（「どこ得？」のリンク）
  affiliateUrl?: string; // 置き換え後の自分の紹介リンク
  description?: string; // 案件の説明
}

export interface PoikatsuSearchResponse {
  keyword: string;
  source: string; // データソース（例: "dokotoku"）
  results: PoikatsuSearchResult[];
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface FavoriteItem {
  id: string; // 一意のID
  result: PoikatsuSearchResult;
  keyword: string; // 検索キーワード
  addedAt: number; // 追加日時（タイムスタンプ）
}

