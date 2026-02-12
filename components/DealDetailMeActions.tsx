'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark, MessageSquare, PlusCircle } from 'lucide-react';

function isEndUser(session: { user?: { role?: string } } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as { role?: string }).role;
  return role !== 'admin' && role !== 'editor';
}

export default function DealDetailMeActions({ dealId }: { dealId: string }) {
  const { data: session, status } = useSession();
  const [note, setNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [txSaving, setTxSaving] = useState(false);
  const [txForm, setTxForm] = useState({
    occurred_on: new Date().toISOString().slice(0, 10),
    direction: 'out' as 'in' | 'out',
    value_type: 'points' as 'cash' | 'points' | 'other',
    amount: 0,
    status: 'confirmed' as 'pending' | 'confirmed',
    memo: '',
  });

  const useApi = status === 'authenticated' && isEndUser(session);

  useEffect(() => {
    if (!useApi) return;
    fetch(`/api/me/deals/${dealId}/note`)
      .then((r) => (r.ok ? r.json() : { note: '' }))
      .then((data) => setNote(data.note ?? ''));
    fetch('/api/me/saved-deals')
      .then((r) => (r.ok ? r.json() : { dealIds: [] }))
      .then((data) => setSaved((data.dealIds ?? []).includes(dealId)));
  }, [dealId, useApi]);

  if (!useApi) {
    return (
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-[#4c4f55]">
        ログインすると、このお得にメモや入出金を記録し、端末間で同期できます。
      </div>
    );
  }

  const saveNote = () => {
    setNoteSaving(true);
    fetch(`/api/me/deals/${dealId}/note`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
      .then((r) => r.ok && setNote(note))
      .finally(() => setNoteSaving(false));
  };

  const toggleSaved = () => {
    setSavedLoading(true);
    if (saved) {
      fetch(`/api/me/saved-deals?dealId=${encodeURIComponent(dealId)}`, { method: 'DELETE' })
        .then((r) => r.ok && setSaved(false))
        .finally(() => setSavedLoading(false));
    } else {
      fetch('/api/me/saved-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      })
        .then((r) => r.ok && setSaved(true))
        .finally(() => setSavedLoading(false));
    }
  };

  const submitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setTxSaving(true);
    fetch('/api/me/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deal_id: dealId,
        ...txForm,
      }),
    })
      .then((r) => {
        if (r.ok) {
          setShowTransaction(false);
          setTxForm({ ...txForm, amount: 0, memo: '' });
        }
      })
      .finally(() => setTxSaving(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleSaved}
          disabled={savedLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            saved
              ? 'bg-brand-100 border-brand-300 text-brand-800'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          {saved ? '保存済み' : '保存する'}
        </button>
        {!showTransaction && (
          <button
            type="button"
            onClick={() => setShowTransaction(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            <PlusCircle size={16} /> 入出金を追加
          </button>
        )}
      </div>

      <section className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
          <MessageSquare size={16} /> メモ
        </h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          placeholder="いつ使う、注意点など"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[80px]"
        />
        {noteSaving && <span className="text-xs text-gray-500">保存中...</span>}
      </section>

      {showTransaction && (
        <form onSubmit={submitTransaction} className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">入出金を記録</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 sm:col-span-1">
              <span className="block text-xs text-gray-600 mb-1">日付</span>
              <input
                type="date"
                value={txForm.occurred_on}
                onChange={(e) => setTxForm((f) => ({ ...f, occurred_on: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </label>
            <label>
              <span className="block text-xs text-gray-600 mb-1">入/出</span>
              <select
                value={txForm.direction}
                onChange={(e) => setTxForm((f) => ({ ...f, direction: e.target.value as 'in' | 'out' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="out">出金</option>
                <option value="in">入金</option>
              </select>
            </label>
            <label>
              <span className="block text-xs text-gray-600 mb-1">種別</span>
              <select
                value={txForm.value_type}
                onChange={(e) =>
                  setTxForm((f) => ({ ...f, value_type: e.target.value as 'cash' | 'points' | 'other' }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="cash">現金</option>
                <option value="points">ポイント</option>
                <option value="other">その他</option>
              </select>
            </label>
            <label>
              <span className="block text-xs text-gray-600 mb-1">金額</span>
              <input
                type="number"
                min={0}
                step={1}
                value={txForm.amount || ''}
                onChange={(e) => setTxForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </label>
            <label>
              <span className="block text-xs text-gray-600 mb-1">状態</span>
              <select
                value={txForm.status}
                onChange={(e) =>
                  setTxForm((f) => ({ ...f, status: e.target.value as 'pending' | 'confirmed' }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="pending">未確定</option>
                <option value="confirmed">確定</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-gray-600 mb-1">メモ</span>
            <input
              type="text"
              value={txForm.memo}
              onChange={(e) => setTxForm((f) => ({ ...f, memo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="任意"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={txSaving}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {txSaving ? '送信中...' : '登録'}
            </button>
            <button
              type="button"
              onClick={() => setShowTransaction(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
