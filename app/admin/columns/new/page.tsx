'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/admin/Header';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import { Save, Eye } from 'lucide-react';
import { ColumnCategory } from '@/types/column';

const categories: ColumnCategory[] = [
  'ポイント活用術',
  '決済サービス',
  'お得活用事例',
  '基礎知識',
  'その他',
];

export default function NewColumnPage() {
  const router = useRouter();
  const [editorMode, setEditorMode] = useState<'markdown' | 'rich'>('markdown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content_markdown: '',
    category: 'その他' as ColumnCategory,
    tags: '',
    thumbnail_url: '',
    status: 'draft' as 'draft' | 'published',
    is_featured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('作成に失敗しました');
      }

      const data = await response.json();
      router.push(`/admin/columns/${data.id}/edit`);
    } catch (err: any) {
      setError(err.message || '作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="新規コラム作成" />

      <div className="p-8 max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-gray-900"
              placeholder="マイル変換ルート完全ガイド"
              required
            />
          </div>

          {/* スラッグ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URLスラッグ
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-gray-900"
              placeholder="mile-conversion-guide（空欄の場合は自動生成）"
            />
            <p className="text-xs text-gray-500 mt-1">
              /columns/{formData.slug || 'auto-generated'}
            </p>
          </div>

          {/* 概要 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              概要（SEO用）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-gray-900"
              rows={3}
              placeholder="この記事では、ANAマイルへの最適な交換ルートを..."
            />
          </div>

          {/* カテゴリとタグ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as ColumnCategory,
                  })
                }
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-gray-900"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タグ（カンマ区切り）
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-gray-900"
                placeholder="マイル, ANA, ポイント交換"
              />
            </div>
          </div>

          {/* サムネイル画像 */}
          <ImageUploader
            label="サムネイル画像"
            value={formData.thumbnail_url}
            onChange={(url) =>
              setFormData({ ...formData, thumbnail_url: url })
            }
          />

          {/* エディタ切り替え */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                本文 *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditorMode('markdown')}
                  className={`px-3 py-1 text-sm rounded ${
                    editorMode === 'markdown'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  マークダウン
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('rich')}
                  className={`px-3 py-1 text-sm rounded ${
                    editorMode === 'rich'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  リッチエディタ
                </button>
              </div>
            </div>

            {editorMode === 'markdown' ? (
              <MarkdownEditor
                value={formData.content_markdown}
                onChange={(value) =>
                  setFormData({ ...formData, content_markdown: value })
                }
              />
            ) : (
              <RichTextEditor
                value={formData.content_markdown}
                onChange={(value) =>
                  setFormData({ ...formData, content_markdown: value })
                }
              />
            )}
          </div>

          {/* オプション */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) =>
                  setFormData({ ...formData, is_featured: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm text-gray-700">注目記事にする</span>
            </label>
          </div>

          {/* アクション */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <button
              type="submit"
              onClick={() =>
                setFormData({ ...formData, status: 'draft' })
              }
              disabled={loading}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {loading ? '保存中...' : '下書き保存'}
            </button>

            <button
              type="submit"
              onClick={() =>
                setFormData({ ...formData, status: 'published' })
              }
              disabled={loading}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? '公開中...' : '公開する'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/columns')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

