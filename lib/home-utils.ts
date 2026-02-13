import { Deal } from '@/types/deal';

/**
 * ホーム画面用ユーティリティ関数
 */

/** YYYY-MM-DD 形式の正規表現（期限が日付として解釈されるか） */
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 今日の日付（YYYY-MM-DD形式）
 */
export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 明日の日付（YYYY-MM-DD形式）
 */
export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

/**
 * 明後日の日付（YYYY-MM-DD形式）
 */
export function getDayAfterTomorrowString(): string {
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  return dayAfterTomorrow.toISOString().slice(0, 10);
}

/**
 * 今月の1日〜20日の期間内かどうか
 */
export function isWelkatsuPeriod(): boolean {
  const today = new Date();
  const day = today.getDate();
  return day >= 1 && day <= 20;
}

/** ウエル活の今日の状態: 準備期間(1-19) / 当日(20) / 終了(21-) */
export type WelkatsuStatus = 'prep' | 'today' | 'ended';

export function getWelkatsuStatus(): WelkatsuStatus {
  const day = new Date().getDate();
  if (day >= 21) return 'ended';
  if (day === 20) return 'today';
  return 'prep';
}

/**
 * 期限が指定日付かどうか
 */
export function isExpiringOn(expiration: string, targetDate: string): boolean {
  if (!expiration) return false;
  // YYYY-MM-DD形式を想定
  return expiration.includes(targetDate);
}

/**
 * 期限が今日以降かどうか（未設定も含む）
 * 日付として解釈できない文字列（常時・毎日・期間限定など）は有効扱い
 */
export function isActiveNow(expiration: string): boolean {
  if (!expiration || typeof expiration !== 'string') return true;
  const t = expiration.trim();
  if (!t) return true;

  if (!DATE_ONLY_PATTERN.test(t)) {
    return true;
  }
  const expirationDate = new Date(t);
  if (isNaN(expirationDate.getTime())) return true;

  const today = getTodayString();
  const todayDate = new Date(today);
  return expirationDate >= todayDate;
}

/**
 * 残り日数を計算
 */
export function calculateRemainingDays(expiration: string): string {
  if (!expiration) return '';
  
  // YYYY-MM-DD形式かチェック
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(expiration)) {
    // 日付形式でない場合、キーワード抽出で短縮
    const text = expiration.toLowerCase();
    
    // よくあるパターンを短縮
    if (text.includes('ブラックフライデー') || text.includes('ブラフラ') || text.includes('bf')) {
      return 'BF期間';
    }
    if (text.includes('開始') && !text.includes('まで')) {
      return '開始予定';
    }
    if (text.includes('期間')) {
      return '期間限定';
    }
    if (text.includes('未定') || text.includes('不明')) {
      return '期間未定';
    }
    if (text.includes('常時') || text.includes('常設')) {
      return '常時';
    }
    
    // それ以外は最初の12文字まで（日本語約6文字）
    return expiration.length > 12 
      ? expiration.substring(0, 12) + '...' 
      : expiration;
  }
  
  const today = getTodayString();
  const expirationDate = new Date(expiration);
  const todayDate = new Date(today);
  
  // 無効な日付の場合は元の文字列を返す
  if (isNaN(expirationDate.getTime())) {
    return expiration;
  }
  
  const diffTime = expirationDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '終了';
  if (diffDays === 0) return '今日まで';
  if (diffDays === 1) return '明日まで';
  return `あと${diffDays}日`;
}

/**
 * 今日のステータスを計算
 */
export interface TodayStatus {
  newToday: number;       // 過去24時間の新着件数
  activeCount: number;    // 開催中の件数
  endingSoon: number;     // 今日〜2日後で終了する件数
}

export function calculateTodayStatus(deals: Deal[]): TodayStatus {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const today = getTodayString();
  const tomorrow = getTomorrowString();
  const dayAfterTomorrow = getDayAfterTomorrowString();
  
  const publicDeals = deals.filter(deal => deal.is_public);
  
  return {
    // created_atで過去24時間以内のものをカウント
    newToday: publicDeals.filter(deal => {
      if (!deal.created_at) return false;
      const createdAt = new Date(deal.created_at);
      return createdAt >= twentyFourHoursAgo && createdAt <= now;
    }).length,
    activeCount: publicDeals.filter(deal => isActiveNow(deal.expiration)).length,
    endingSoon: publicDeals.filter(deal => 
      isExpiringOn(deal.expiration, today) || 
      isExpiringOn(deal.expiration, tomorrow) ||
      isExpiringOn(deal.expiration, dayAfterTomorrow)
    ).length,
  };
}

/**
 * マストチェック3件を抽出
 */
export function getMustCheckDeals(deals: Deal[]): Deal[] {
  // 基本条件: score >= 80 OR discount_amount >= 3000
  const candidates = deals.filter(deal => 
    deal.is_public &&
    isActiveNow(deal.expiration) &&
    (deal.score >= 80 || (deal.discount_amount && deal.discount_amount >= 3000))
  );
  
  // ソート: score降順 → discount_amount降順 → discount_rate降順 → expiration昇順
  const sorted = candidates.sort((a, b) => {
    // score
    if (b.score !== a.score) return b.score - a.score;
    
    // discount_amount
    const amountA = a.discount_amount || 0;
    const amountB = b.discount_amount || 0;
    if (amountB !== amountA) return amountB - amountA;
    
    // discount_rate
    const rateA = a.discount_rate || 0;
    const rateB = b.discount_rate || 0;
    if (rateB !== rateA) return rateB - rateA;
    
    // expiration（期限が近い方を優先）
    if (!a.expiration && !b.expiration) return 0;
    if (!a.expiration) return 1;
    if (!b.expiration) return -1;
    return new Date(a.expiration).getTime() - new Date(b.expiration).getTime();
  });
  
  return sorted.slice(0, 3);
}

/**
 * 締切が近いお得を抽出（今日〜2日後）
 */
export function getEndingSoonDeals(deals: Deal[]): Deal[] {
  const today = getTodayString();
  const tomorrow = getTomorrowString();
  const dayAfterTomorrow = getDayAfterTomorrowString();
  
  const candidates = deals.filter(deal => 
    deal.is_public &&
    (isExpiringOn(deal.expiration, today) ||
     isExpiringOn(deal.expiration, tomorrow) ||
     isExpiringOn(deal.expiration, dayAfterTomorrow))
  );
  
  // ソート: expiration昇順 → score降順
  const sorted = candidates.sort((a, b) => {
    const dateA = new Date(a.expiration || '9999-12-31');
    const dateB = new Date(b.expiration || '9999-12-31');
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    return b.score - a.score;
  });
  
  return sorted.slice(0, 5);
}

/**
 * 過去24時間の新着お得を抽出（created_atベース）
 */
export function getTodayNewDeals(deals: Deal[], limit: number = 5): Deal[] {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const candidates = deals.filter(deal => {
    if (!deal.is_public || !deal.created_at) return false;
    const createdAt = new Date(deal.created_at);
    return createdAt >= twentyFourHoursAgo && createdAt <= now;
  });
  
  // ソート: created_at降順（新しい順）
  const sorted = candidates.sort((a, b) => {
    return (b.created_at || '').localeCompare(a.created_at || '');
  });
  
  return limit > 0 ? sorted.slice(0, limit) : sorted;
}

/**
 * カテゴリ別の件数を取得
 */
export function getCategoryCount(deals: Deal[], category: string): number {
  return deals.filter(deal => 
    deal.is_public &&
    deal.category_main === category &&
    isActiveNow(deal.expiration)
  ).length;
}

/**
 * ウエル活案件数を取得
 */
export function getWelkatsuCount(deals: Deal[]): number {
  return deals.filter(deal => 
    deal.is_public &&
    deal.is_welkatsu === true &&
    isActiveNow(deal.expiration)
  ).length;
}

/**
 * チャネルを日本語に変換
 */
export function getAreaTypeLabel(areaType?: string): string {
  switch (areaType) {
    case 'online':
      return 'オンライン';
    case 'store':
      return '店舗';
    case 'online+store':
      return 'オンライン・店舗';
    default:
      return '-';
  }
}

/**
 * 対象ユーザーを日本語に変換
 */
export function getTargetUserTypeLabel(targetUserType?: string): string {
  switch (targetUserType) {
    case 'all':
      return '誰でも';
    case 'new_or_inactive':
      return '新規・休眠';
    case 'limited':
      return '限定';
    default:
      return '-';
  }
}

/**
 * 期限が日付形式（YYYY-MM-DD）かどうか
 * 常時・毎日・期間限定などは false
 */
export function isExpirationDateLike(expiration: string): boolean {
  if (!expiration || typeof expiration !== 'string') return false;
  const t = expiration.trim();
  if (!t) return false;
  return DATE_ONLY_PATTERN.test(t) && !isNaN(new Date(t).getTime());
}

/**
 * コツコツ/ポチポチ系案件かどうか
 * category_sub または tags/本文に コツコツ|ポチポチ を含む
 */
export function isKotsukotsuDeal(deal: Deal): boolean {
  if (!deal.is_public) return false;
  const sub = (deal.category_sub || '').trim();
  if (sub === 'コツコツ') return true;
  const tags = (deal.tags || '').toLowerCase();
  if (/コツコツ|ポチポチ/.test(tags)) return true;
  const text = `${deal.title} ${deal.summary} ${deal.detail} ${deal.steps} ${deal.notes}`.toLowerCase();
  return /コツコツ|ポチポチ/.test(text);
}

/**
 * コツコツ案件のみに絞り込み
 */
export function getKotsukotsuDeals(deals: Deal[]): Deal[] {
  return deals.filter(isKotsukotsuDeal);
}

/**
 * 直近 N 日以内に追加されたコツコツ案件（新着）
 */
export function getKotsukotsuNewDeals(deals: Deal[], days: number = 7): Deal[] {
  const k = getKotsukotsuDeals(deals);
  const since = new Date();
  since.setDate(since.getDate() - days);
  return k.filter((d) => {
    const created = d.created_at ? new Date(d.created_at) : new Date(d.date);
    return created >= since;
  }).sort((a, b) => (b.created_at || b.date).localeCompare(a.created_at || a.date));
}

/**
 * 期限が日付でないコツコツ案件（常設：常時・毎日など）
 */
export function getKotsukotsuConstantDeals(deals: Deal[]): Deal[] {
  const k = getKotsukotsuDeals(deals);
  return k.filter((d) => !isExpirationDateLike(d.expiration || ''));
}

