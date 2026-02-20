'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Send, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

export default function ColumnRequestPage() {
  const [requestText, setRequestText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const maxLength = 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestText.trim()) {
      setErrorMessage('リクエスト内容を入力してください');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/column-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          requestText: requestText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'リクエストの送信に失敗しました');
      }

      setSubmitStatus('success');
      setRequestText('');
    } catch (error) {
      console.error('Submit error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'エラーが発生しました');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exampleRequests = [
    'マイルを効率的に貯める方法について知りたい',
    'クレジットカードのポイント多重取りのコツ',
    'ふるさと納税で得する方法',
    'コンビニでお得に買い物する方法',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-1 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-brand-600 flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">ホーム</span>
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/columns" className="hover:text-brand-600">
            コラム
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-400">リクエスト</span>
        </nav>

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
            <Send className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-[#0f1419] mb-3">
            コラムリクエスト
          </h1>
          <p className="text-gray-600">
            読みたいコラムのテーマを教えてください。<br />
            リクエストを元に記事を作成します。
          </p>
        </div>

        {/* 成功メッセージ */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">リクエストを受け付けました！</p>
              <p className="text-sm text-green-700 mt-1">
                編集部で内容を確認し、コラムを作成します。<br />
                新しいコラムは「お得コラム」ページに掲載されます。
              </p>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {submitStatus === 'error' && errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">エラーが発生しました</p>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <label htmlFor="requestText" className="block text-sm font-medium text-gray-700 mb-2">
              読みたいコラムのテーマや内容 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="requestText"
                value={requestText}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= maxLength) {
                    setRequestText(value);
                  }
                }}
                placeholder="例: ポイントを効率的に貯める方法について知りたい"
                rows={6}
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 resize-none text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                maxLength={maxLength}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
                {requestText.length}/{maxLength}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              ざっくりとした内容でも大丈夫です。複数のテーマを含めても構いません。
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !requestText.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 focus:ring-4 focus:ring-brand-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                リクエストを送信
              </>
            )}
          </button>
        </form>

        {/* リクエスト例 */}
        <div className="mt-8 bg-brand-50 border border-brand-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-[#0f1419]">リクエスト例</h2>
          </div>
          <ul className="space-y-2">
            {exampleRequests.map((example, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-brand-500 mt-1">•</span>
                <button
                  type="button"
                  onClick={() => setRequestText(example)}
                  className="text-left text-gray-700 hover:text-brand-600 transition-colors"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* コラム一覧へのリンク */}
        <div className="mt-8 text-center">
          <Link
            href="/columns"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
          >
            ← コラム一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

