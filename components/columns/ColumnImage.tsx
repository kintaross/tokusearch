'use client';

import { useEffect, useMemo, useState } from 'react';

type ColumnImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ColumnImage({ src, alt, className = '' }: ColumnImageProps) {
  const candidates = useMemo(() => {
    const raw = String(src ?? '').trim();
    if (!raw) return [];

    // 既にプロキシURLの場合、元URLを取り出して候補を組み直す
    const unwrapProxy = (u: string): string => {
      if (!u.startsWith('/api/image-proxy')) return u;
      const idx = u.indexOf('?');
      if (idx === -1) return u;
      try {
        const params = new URLSearchParams(u.slice(idx + 1));
        const inner = params.get('url');
        return inner ? inner : u;
      } catch {
        return u;
      }
    };

    const original = unwrapProxy(raw);
    const uniq = new Set<string>();

    const isDrive = original.includes('drive.google.com');
    const isLh3 = original.includes('lh3.googleusercontent.com');

    // Drive はHTMLが返る等があるのでプロキシ優先
    if (isDrive) {
      uniq.add(`/api/image-proxy?url=${encodeURIComponent(original)}`);
      uniq.add(original);
      return [...uniq];
    }

    // lh3 は直読み優先、だめならプロキシを試す
    uniq.add(original);
    if (isLh3) {
      uniq.add(`/api/image-proxy?url=${encodeURIComponent(original)}`);
    }
    return [...uniq];
  }, [src]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(false);
  }, [src]);

  const imageSrc = candidates[candidateIndex] ?? '';

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex(candidateIndex + 1);
      return;
    }
    setFailed(true);
  };

  if (failed || !imageSrc) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📷</div>
          <div className="text-sm">画像を読み込めませんでした</div>
        </div>
      </div>
    );
  }

  // 通常のimgタグを使用（crossOrigin属性を削除してCORSエラーを回避）
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}

