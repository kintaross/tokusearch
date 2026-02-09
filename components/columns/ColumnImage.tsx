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
    // ファイルIDを抽出
    const fileId = extractFileId(url);
    if (!fileId) {
      // ファイルIDが抽出できない場合は元のURLを返す
      console.warn('ファイルIDが抽出できませんでした:', url);
      return url;
    }
    
    // ファイルIDが抽出できた場合、確実にuc?export=view&id=形式に変換
    const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    // CORSエラーを回避するため、プロキシ経由で読み込む
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(driveUrl)}`;
    console.log('URL最適化（プロキシ経由）:', url, '->', proxyUrl);
    return proxyUrl;
  };

  // 初回レンダリング時にURLを最適化
  useEffect(() => {
    console.log('ColumnImage初期化 - 元のURL:', src);
    const optimizedUrl = optimizeGoogleDriveUrl(src);
    if (optimizedUrl !== src) {
      console.log('URLを最適化:', src, '->', optimizedUrl);
      setImageSrc(optimizedUrl);
    } else {
      setImageSrc(src);
    }
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('画像読み込みエラー:', {
      使用中のURL: imageSrc,
      元のURL: src,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight,
      complete: target.complete,
      error: e,
    });
    
    if (!hasError) {
      setHasError(true);
      // 最初のエラー時、最適化されたURLを試す
      const optimizedUrl = optimizeGoogleDriveUrl(imageSrc);
      if (optimizedUrl !== imageSrc) {
        console.log('画像読み込み失敗、URL形式を変換してリトライ:', imageSrc, '->', optimizedUrl);
        setImageSrc(optimizedUrl);
        setHasError(false); // リトライするため、エラーフラグをリセット
      } else {
        setErrorMessage('画像を読み込めませんでした。URLを確認してください。');
        console.error('すべてのURL形式が失敗しました。最終URL:', imageSrc);
      }
    } else {
      setErrorMessage('画像を読み込めませんでした。URLを確認してください。');
    }
  };

  const handleLoad = () => {
    console.log('画像読み込み成功:', imageSrc);
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
      onLoad={handleLoad}
      loading="lazy"
    />
  );
}

