'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/admin/Header';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import { Save, Trash2 } from 'lucide-react';
import { ColumnCategory } from '@/types/column';

const categories: ColumnCategory[] = [
  'ポイント活用術',
  '決済サービス',
  'お得活用事例',
  '基礎知識',
  'その他',
];

export default function EditColumnPage() {
  const router = useRouter();
  const params = useParams();
  const columnId = params?.id as string;

  const [editorMode, setEditorMode] = useState<'markdown' | 'rich'>('markdown');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content_markdown: '',
    category: 'その他' as ColumnCategory,
    tags: '',
    thumbnail_url: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    is_featured: false,
  });

  useEffect(() => {
    fetchColumn();
  }, [columnId]);

  const fetchColumn = async () => {
    try {
      const response = await fetch(`/api/admin/columns/${columnId}`);
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }
      const data = await response.json();
      setFormData({
        title: data.title,
        slug: data.slug,
        description: data.description,
        content_markdown: data.content_markdown,
        category: data.category,
        tags: data.tags,
        thumbnail_url: data.thumbnail_url,
        status: data.status,
        is_featured: data.is_featured,
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

    try {
      const response = await fetch(`/api/admin/columns/${columnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('更新に失敗しました');
      }

      router.push('/admin/columns');
    } catch (err: any) {
      setError(err.message || '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当に削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/columns/${columnId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      router.push('/admin/columns');
    } catch (err: any) {
      setError(err.message || '削除に失敗しました');
    }
  };

  if (fetching) {
    return (
      <>
        <Header title="コラム編集" />
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">読み込み中...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="コラム編集" />

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
            />
            <p className="text-xs text-gray-500 mt-1">
              /columns/{formData.slug}
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

          {/* ステータスと特集フラグ */}
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-gray-900"
              >
                <option value="draft">下書き</option>
                <option value="published">公開</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>

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
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              削除
            </button>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin/columns')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                キャンセル
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 font-medium"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {loading ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

