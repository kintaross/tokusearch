'use client';

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareButtonProps {
  id: string; // 記事IDまたはslug
  title: string;
  type?: 'deal' | 'column'; // パスタイプ（デフォルト: 'deal'）
  className?: string;
}

export default function ShareButton({ id, title, type = 'deal', className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return; // SSR時の安全策
    }
    
    // パスタイプに応じてURLを生成（元のIDをそのまま使用）
    const path = type === 'column' ? `/columns/${encodeURIComponent(id)}` : `/deals/${encodeURIComponent(id)}`;
    const url = `${window.location.origin}${path}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: type === 'column' ? `コラム: ${title}` : `お得情報: ${title}`,
          url: url,
        });
      } catch (error) {
        // ユーザーがキャンセルした場合などは無視
        if ((error as Error).name !== 'AbortError') {
          console.error('共有に失敗しました:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('コピーに失敗しました:', error);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded-lg transition-all duration-200 ${
        copied
          ? 'bg-green-50 text-green-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      } ${className}`}
      aria-label="共有"
    >
      {copied ? <Check size={18} /> : <Share2 size={18} />}
    </button>
  );
}
