'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    // 画像ファイルチェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アップロードに失敗しました');
      }

      const data = await response.json();
      console.log('アップロードAPIレスポンス:', data);
      console.log('画像URL:', data.url);
      if (!data.url) {
        throw new Error('画像URLが返されませんでした');
      }
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative inline-block">
          {/* プロキシ経由で画像を表示（CORSエラー回避） */}
          {value.includes('drive.google.com') ? (
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(value)}`}
              alt="Uploaded"
              className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
              onError={(e) => {
                console.error('管理画面: 画像読み込みエラー（プロキシ経由）:', value);
                console.error('エラー詳細:', e);
              }}
            />
          ) : (
            <img
              src={value}
              alt="Uploaded"
              className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
              onError={(e) => {
                console.error('管理画面: 画像読み込みエラー:', value);
                console.error('エラー詳細:', e);
              }}
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">アップロード中...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  クリックして画像を選択
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF (最大 5MB)
                </p>
              </div>
            )}
            <input
              id="image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

