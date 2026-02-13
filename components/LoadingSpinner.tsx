import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center h-64 w-full" aria-label="読み込み中">
      <div className="relative w-20 h-20">
        {/* 背景の薄いリング - 上品なベース */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-pink-100 rounded-full opacity-50"></div>
        
        {/* 回転するグラデーションリング - ワクワク感を演出するメインのアニメーション */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-pink-500 border-r-purple-500 rounded-full animate-spin"></div>
        
        {/* 中央のパルス - 心臓の鼓動のようなときめき */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(236,72,153,0.6)]"></div>
      </div>
      
      {/* テキスト - エレガントなフォントとグラデーション */}
      <p className="mt-4 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 animate-pulse tracking-widest uppercase">
        Loading...
      </p>
    </div>
  );
};
