'use client';

import { useState, useEffect } from 'react';

type ColumnImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ColumnImage({ src, alt, className = '' }: ColumnImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // GoogleドライブのファイルIDを抽出
  const extractFileId = (url: string): string | null => {
    // https://drive.google.com/uc?id=...&export=download 形式
    const ucIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (ucIdMatch) {
      return ucIdMatch[1];
    }
    
    // https://drive.google.com/file/d/.../view 形式
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return fileIdMatch[1];
    }
    
    return null;
  };

  // GoogleドライブのURL形式を最適化（プロキシ経由で読み込む）
  const optimizeGoogleDriveUrl = (url: string): string => {
    const fileId = extractFileId(url);
    if (!fileId) return url;
    const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    return `/api/image-proxy?url=${encodeURIComponent(driveUrl)}`;
  };

  // 初回レンダリング時にURLを最適化
  useEffect(() => {
    const optimizedUrl = optimizeGoogleDriveUrl(src);
    setImageSrc(optimizedUrl !== src ? optimizedUrl : src);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      const optimizedUrl = optimizeGoogleDriveUrl(imageSrc);
      if (optimizedUrl !== imageSrc) {
        setImageSrc(optimizedUrl);
        setHasError(false);
      } else {
        setErrorMessage('画像を読み込めませんでした。URLを確認してください。');
      }
    } else {
      setErrorMessage('画像を読み込めませんでした。URLを確認してください。');
    }
  };

  if (hasError && imageSrc === src) {
    // エラーが発生し、代替URLも失敗した場合
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📷</div>
          <div className="text-sm">{errorMessage || '画像を読み込めませんでした'}</div>
          <div className="text-xs mt-2 text-gray-500 break-all px-4 max-w-md">
            URL: {imageSrc}
          </div>
          <div className="text-xs mt-1 text-gray-400">
            ブラウザのコンソールで詳細を確認してください
          </div>
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

