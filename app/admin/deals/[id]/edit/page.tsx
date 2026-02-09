'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/admin/Header';
import { Save, ArrowLeft } from 'lucide-react';
import { Deal } from '@/types/deal';

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Partial<Deal>>({
    title: '',
    summary: '',
    detail: '',
    steps: '',
    service: '',
    expiration: '',
    conditions: '',
    notes: '',
    category_main: 'その他',
    is_public: true,
    priority: 'C',
    discount_rate: undefined,
    discount_amount: undefined,
    score: 0,
    area_type: undefined,
    target_user_type: undefined,
    is_welkatsu: false,
  });

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}`);
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }
      const data = await response.json();
      setFormData({
        title: data.title || '',
        summary: data.summary || '',
        detail: data.detail || '',
        steps: data.steps || '',
        service: data.service || '',
        expiration: data.expiration || '',
        conditions: data.conditions || '',
        notes: data.notes || '',
        category_main: data.category_main || 'その他',
        is_public: data.is_public,
        priority: data.priority || 'C',
        discount_rate: data.discount_rate,
        discount_amount: data.discount_amount,
        score: data.score || 0,
        area_type: data.area_type,
        target_user_type: data.target_user_type,
        is_welkatsu: data.is_welkatsu || false,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '更新に失敗しました');
      }

      setSuccess('お得情報を更新しました！');
      
      // 3秒後に一覧ページに戻る
      setTimeout(() => {
        router.push('/admin/deals');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <>
        <Header title="お得情報編集" />
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">読み込み中...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="お得情報編集" />

      <div className="p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* 基本情報 */}
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  要約 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  サービス名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有効期限
                </label>
                <input
                  type="text"
                  value={formData.expiration}
                  onChange={(e) => setFormData({ ...formData, expiration: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  placeholder="YYYY-MM-DD または テキスト"
                />
              </div>
            </div>
          </section>

          {/* 詳細情報 */}
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">詳細情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  詳細説明
                </label>
                <textarea
                  value={formData.detail}
                  onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  利用手順
                </label>
                <textarea
                  value={formData.steps}
                  onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  適用条件
                </label>
                <textarea
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  注意点・備考
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  rows={4}
                />
              </div>
            </div>
          </section>

          {/* 数値情報 */}
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">割引・評価情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  割引率 (%)
                </label>
                <input
                  type="number"
                  value={formData.discount_rate || ''}
                  onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  割引額 (円)
                </label>
                <input
                  type="number"
                  value={formData.discount_amount || ''}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スコア (0-100)
                </label>
                <input
                  type="number"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>
          </section>

          {/* カテゴリ・ステータス */}
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ・ステータス</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ
                </label>
                <select
                  value={formData.category_main}
                  onChange={(e) => setFormData({ ...formData, category_main: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                >
                  <option value="ドラッグストア・日用品">ドラッグストア・日用品</option>
                  <option value="スーパー・量販店・EC">スーパー・量販店・EC</option>
                  <option value="グルメ・外食">グルメ・外食</option>
                  <option value="旅行・交通">旅行・交通</option>
                  <option value="決済・ポイント">決済・ポイント</option>
                  <option value="タバコ・嗜好品">タバコ・嗜好品</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  優先度
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                >
                  <option value="A">A（最優先）</option>
                  <option value="B">B（中優先）</option>
                  <option value="C">C（通常）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  チャネル
                </label>
                <select
                  value={formData.area_type || ''}
                  onChange={(e) => setFormData({ ...formData, area_type: e.target.value as any || undefined })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                >
                  <option value="">未設定</option>
                  <option value="online">オンライン</option>
                  <option value="store">店舗</option>
                  <option value="online+store">オンライン・店舗</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  対象ユーザー
                </label>
                <select
                  value={formData.target_user_type || ''}
                  onChange={(e) => setFormData({ ...formData, target_user_type: e.target.value as any || undefined })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                >
                  <option value="">未設定</option>
                  <option value="all">誰でも</option>
                  <option value="new_or_inactive">新規・休眠</option>
                  <option value="limited">限定</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公開ステータス
                </label>
                <select
                  value={formData.is_public ? 'TRUE' : 'FALSE'}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.value === 'TRUE' })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                >
                  <option value="TRUE">公開</option>
                  <option value="FALSE">非公開</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ウエル活対象
                </label>
                <select
                  value={formData.is_welkatsu ? 'TRUE' : 'FALSE'}
                  onChange={(e) => setFormData({ ...formData, is_welkatsu: e.target.value === 'TRUE' })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900"
                >
                  <option value="FALSE">対象外</option>
                  <option value="TRUE">対象</option>
                </select>
              </div>
            </div>
          </section>

          {/* アクションボタン */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/admin/deals')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

