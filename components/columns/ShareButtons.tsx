'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Link as LinkIcon, MessageCircle, Check } from 'lucide-react';

type Props = {
  title: string;
  url: string;
};

export function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
    window.open(lineUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="border-t border-gray-200 pt-6 mt-10">
      <div className="flex items-center gap-3 mb-4">
        <Share2 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-bold text-[#0f1419]">この記事をシェア</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Twitter */}
        <button
          onClick={handleTwitterShare}
          className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors"
          aria-label="Twitterでシェア"
        >
          <Twitter className="w-4 h-4" />
          <span className="text-sm font-medium">Twitter</span>
        </button>

        {/* Facebook */}
        <button
          onClick={handleFacebookShare}
          className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#145dbf] transition-colors"
          aria-label="Facebookでシェア"
        >
          <Facebook className="w-4 h-4" />
          <span className="text-sm font-medium">Facebook</span>
        </button>

        {/* LINE */}
        <button
          onClick={handleLineShare}
          className="flex items-center gap-2 px-4 py-2 bg-[#06C755] text-white rounded-lg hover:bg-[#05b04b] transition-colors"
          aria-label="LINEでシェア"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">LINE</span>
        </button>

        {/* URLコピー */}
        <button
          onClick={handleCopyUrl}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            copied
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label="URLをコピー"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">コピー完了</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              <span className="text-sm font-medium">URLコピー</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}



