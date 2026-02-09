// テキスト内のURLを自動的にリンクに変換するヘルパー関数
import React from 'react';

export function linkifyText(text: string): React.ReactNode[] {
  // URLパターン（http, https）
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    // URL前のテキストを追加
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // URLをリンクとして追加
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-500 hover:text-brand-600 underline break-all"
      >
        {url}
      </a>
    );
    
    lastIndex = match.index + url.length;
  }
  
  // 残りのテキストを追加
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

