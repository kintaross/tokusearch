'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * OAuth 2.0認証のリダイレクトを受け取るページ
 * 
 * Googleからのリダイレクト後、認証コードを表示します
 */
function OAuth2CallbackContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (codeParam) {
      setCode(codeParam);
    } else {
      setError('認証コードが取得できませんでした');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">認証エラー</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-600">認証コードを取得中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">認証成功</h2>
          <p className="text-gray-600 mb-4">認証コードを取得しました</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500 mb-2">認証コード:</p>
            <div className="flex items-center justify-between bg-white rounded border border-gray-200 p-3">
              <code className="text-sm text-gray-800 break-all flex-1 mr-2">
                {code}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  alert('認証コードをコピーしました');
                }}
                className="flex-shrink-0 px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600 text-sm"
              >
                コピー
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              この認証コードをターミナルに入力してください
            </p>
            <button
              onClick={() => window.close()}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              このウィンドウを閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </div>
        </div>
      }
    >
      <OAuth2CallbackContent />
    </Suspense>
  );
}

