// お得情報のデータモデル
export interface Deal {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  detail: string;
  steps: string;
  service: string;
  expiration: string;
  conditions: string;
  notes: string;
  category_main: CategoryMain;
  category_sub?: string;
  is_public: boolean;
  priority: 'A' | 'B' | 'C';
  discount_rate?: number;
  discount_amount?: number;
  score: number; // 0-100
  created_at: string;
  updated_at: string;
  // 新規追加カラム（フェーズ2改修）
  difficulty?: Difficulty; // 案件の難易度
  area_type?: AreaType; // 利用チャネル
  target_user_type?: TargetUserType; // 対象ユーザー種別
  usage_type?: UsageType; // 主な用途
  is_welkatsu?: boolean; // ウエル活関連かどうか
  tags?: string; // カンマ区切りのタグ文字列
}

export type CategoryMain =
  | 'ドラッグストア・日用品'
  | 'スーパー・量販店・EC'
  | 'グルメ・外食'
  | '旅行・交通'
  | '決済・ポイント'
  | 'タバコ・嗜好品'
  | 'その他';

// 難易度（手間・複雑さ）
export type Difficulty = 'low' | 'medium' | 'high';

// 利用チャネル
export type AreaType = 'online' | 'store' | 'online+store';

// 対象ユーザー種別
export type TargetUserType = 'all' | 'new_or_inactive' | 'limited';

// 主な用途
export type UsageType =
  | 'daily_goods'      // ドラッグストア・日用品・日常消費
  | 'eating_out'       // グルメ・外食
  | 'travel'           // 旅行・交通・レジャー
  | 'financial'        // 銀行・証券・投資・クレカ・決済系
  | 'utility_bills'    // 公共料金・通信費・税金
  | 'hobby'            // ゲーム・サブスク・エンタメ
  | 'other';           // その他

export interface DealFilters {
  period?: 'today' | '3days' | '7days' | '30days';
  category?: CategoryMain;
  search?: string;
}

export type SortOption = 'default' | 'newest' | 'expiring' | 'discount_rate' | 'discount_amount' | 'score';

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

