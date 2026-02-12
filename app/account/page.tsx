'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Heart, Bookmark, Search, TrendingUp, ArrowLeft, LogOut } from 'lucide-react';
import DealCard from '@/components/DealCard';
import { Deal } from '@/types/deal';
import { signOut } from 'next-auth/react';

function isEndUser(session: { user?: { role?: string } } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as { role?: string }).role;
  return role !== 'admin' && role !== 'editor';
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [favoriteDeals, setFavoriteDeals] = useState<Deal[]>([]);
  const [savedDeals, setSavedDeals] = useState<Deal[]>([]);
  const [savedSearches, setSavedSearches] = useState<{ id: string; name: string; query_json: Record<string, unknown> }[]>([]);
  const [summaries, setSummaries] = useState<{ deal_id: string | null; total_in: number; total_out: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !isEndUser(session)) return;

    const run = async () => {
      try {
        const [favRes, savedRes, searchRes, analyticsRes] = await Promise.all([
          fetch('/api/me/favorites'),
          fetch('/api/me/saved-deals'),
          fetch('/api/me/saved-searches'),
          fetch('/api/me/analytics/deals?from=2020-01-01&to=2030-12-31'),
        ]);
        const favData = favRes.ok ? await favRes.json() : { dealIds: [] };
        const savedData = savedRes.ok ? await savedRes.json() : { dealIds: [] };
        const searchData = searchRes.ok ? await searchRes.json() : { savedSearches: [] };
        const analyticsData = analyticsRes.ok ? await analyticsRes.json() : { summaries: [] };

        const favIds = favData.dealIds ?? [];
        const savedIds = savedData.dealIds ?? [];
        const allIds = [...new Set([...favIds, ...savedIds])];
        let dealsMap = new Map<string, Deal>();
        if (allIds.length > 0) {
          const listRes = await fetch('/api/deals');
          const listData = listRes.ok ? await listRes.json() : { deals: [] };
          (listData.deals ?? []).forEach((d: Deal) => dealsMap.set(d.id, d));
        }
        setFavoriteDeals(favIds.map((id: string) => dealsMap.get(id)).filter(Boolean) as Deal[]);
        setSavedDeals(savedIds.map((id: string) => dealsMap.get(id)).filter(Boolean) as Deal[]);
        setSavedSearches(searchData.savedSearches ?? []);
        setSummaries(analyticsData.summaries ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [session, status]);

  if (status === 'loading' || (status === 'authenticated' && !isEndUser(session))) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-[#6b6f76]">読み込み中...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-[#6b6f76] mb-4">ログインするとお気に入りや保存リストを同期できます。</p>
        <Link href="/signin" className="text-brand-600 hover:underline font-medium">
          ログイン（Google）
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#6b6f76] hover:text-[#0f1419] mb-4">
            <ArrowLeft size={16} /> ホームに戻る
          </Link>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#0f1419]">マイページ</h1>
          <p className="text-[#4c4f55] text-sm mt-1">お気に入り・保存・損益を管理できます</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="inline-flex items-center gap-2 text-sm text-[#6b6f76] hover:text-[#0f1419]"
          >
            <LogOut size={16} /> ログアウト
          </button>
          {!deleteConfirm && (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="text-sm text-red-600 hover:underline"
            >
              アカウントを削除
            </button>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm mb-2">
            アカウントを削除すると、お気に入り・保存・メモ・取引履歴はすべて削除され、復元できません。よろしいですか？
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  const r = await fetch('/api/me/account', { method: 'DELETE' });
                  if (r.ok) {
                    await signOut({ callbackUrl: '/' });
                    window.location.href = '/';
                  }
                } finally {
                  setDeleting(false);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? '削除中...' : '削除する'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#6b6f76]">読み込み中...</div>
      ) : (
        <div className="space-y-10">
          <section className="bg-white rounded-2xl border border-[#ebe7df] shadow-sm p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[#0f1419] mb-4">
              <Heart size={22} className="text-[#c0463e]" /> お気に入り
            </h2>
            {favoriteDeals.length === 0 ? (
              <p className="text-[#6b6f76] text-sm">お気に入りはまだありません</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {favoriteDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} viewMode="grid" />
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-[#ebe7df] shadow-sm p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[#0f1419] mb-4">
              <Bookmark size={22} /> 保存済みお得
            </h2>
            {savedDeals.length === 0 ? (
              <p className="text-[#6b6f76] text-sm">保存したお得はまだありません</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {savedDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} viewMode="grid" />
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-[#ebe7df] shadow-sm p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[#0f1419] mb-4">
              <Search size={22} /> 保存検索
            </h2>
            {savedSearches.length === 0 ? (
              <p className="text-[#6b6f76] text-sm">保存した検索条件はまだありません</p>
            ) : (
              <ul className="space-y-2">
                {savedSearches.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/?${new URLSearchParams(s.query_json as Record<string, string>).toString()}`}
                      className="text-brand-600 hover:underline font-medium"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-[#ebe7df] shadow-sm p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[#0f1419] mb-4">
              <TrendingUp size={22} /> 損益サマリ（確定済み）
            </h2>
            {summaries.length === 0 ? (
              <p className="text-[#6b6f76] text-sm">取引がまだありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-[#6b6f76]">
                      <th className="py-2">お得</th>
                      <th className="py-2">入金合計</th>
                      <th className="py-2">出金合計</th>
                      <th className="py-2">差分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((s) => (
                      <tr key={s.deal_id ?? 'none'} className="border-b border-gray-100">
                        <td className="py-2">
                          {s.deal_id ? (
                            <Link href={`/deals/${s.deal_id}`} className="text-brand-600 hover:underline">
                              {s.deal_id}
                            </Link>
                          ) : (
                            '（紐付けなし）'
                          )}
                        </td>
                        <td className="py-2">¥{s.total_in.toLocaleString()}</td>
                        <td className="py-2">¥{s.total_out.toLocaleString()}</td>
                        <td className="py-2 font-medium">
                          ¥{(s.total_in - s.total_out).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
