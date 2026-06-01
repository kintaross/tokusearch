/**
 * Next.js Data Cache のタグ。
 * 取り込み/更新時に revalidateTag() でこのタグを無効化すると、
 * 全インスタンスのキャッシュが一斉に最新化される（リロードしないと古い情報が出る問題の対策）。
 */
export const DEALS_TAG = 'deals';
export const COLUMNS_TAG = 'columns';

/**
 * 公開データ（deals/columns）のキャッシュ有効期限の保険値（秒）。
 * 通常は revalidateTag による即時無効化で最新化されるが、
 * 取り込みが無い間に「24時間以内」から自然に外れる案件などに備えた時間ベースの保険。
 */
export const CACHE_TTL_PUBLIC_SEC = 300;
