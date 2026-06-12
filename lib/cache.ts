import { revalidatePath, revalidateTag } from 'next/cache';

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

/**
 * 公開Dealsのキャッシュを即時最新化する（取り込み/更新時に呼ぶ）。
 *
 * 「何度かリロードしないと最新が出ない」原因は2層のキャッシュ：
 *  1. Data Cache … unstable_cache(tags:[DEALS_TAG]) のDB結果。
 *  2. Full Route Cache … `export const revalidate = 60` を持つISRページ(/, /shinchaku, /ranking 等)のHTML。
 *
 * Next.js 16 の revalidateTag(tag, 'max') は (1) を SWR 扱いにするだけで (2) を無効化しない
 * （ソース上 pathWasRevalidated がセットされるのは profile 無し or expire===0 のときだけ）。
 * そのためISRページが最大60秒+stale-while-revalidateで古いHTMLを返し続ける。
 *
 * ここでは
 *  - revalidateTag(tag, { expire: 0 }) … Data Cache を即時ハード無効化（全インスタンス共有）
 *  - revalidatePath(...)              … 各ISRページの Full Route Cache を即時無効化
 * の両方を行い、次のリクエストで確実に最新化する。
 */
export function revalidateDeals(): void {
  revalidateTag(DEALS_TAG, { expire: 0 });
  revalidatePath('/');
  revalidatePath('/shinchaku');
  revalidatePath('/ranking');
  revalidatePath('/deals/[id]', 'page');
}

/**
 * 公開コラムのキャッシュを即時最新化する（作成/更新/削除時に呼ぶ）。
 * TOP(/) もコラムを表示するため併せて無効化する。詳細は {@link revalidateDeals} を参照。
 */
export function revalidateColumns(): void {
  revalidateTag(COLUMNS_TAG, { expire: 0 });
  revalidatePath('/');
  revalidatePath('/columns');
  revalidatePath('/columns/[slug]', 'page');
}
