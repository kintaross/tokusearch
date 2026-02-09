import Link from 'next/link';
import { Send } from 'lucide-react';

type RequestButtonProps = {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function RequestButton({ 
  variant = 'primary', 
  size = 'md',
  className = '' 
}: RequestButtonProps) {
  const baseStyles = 'inline-flex items-center gap-2 font-medium transition-colors';
  
  const variantStyles = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 rounded-lg',
    secondary: 'bg-white border border-brand-300 text-brand-700 hover:bg-brand-50 rounded-lg',
    text: 'text-brand-600 hover:text-brand-700 hover:underline',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <Link
      href="/columns/request"
      className={`${baseStyles} ${variantStyles[variant]} ${variant !== 'text' ? sizeStyles[size] : ''} ${className}`}
    >
      <Send className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      コラムリクエスト
    </Link>
  );
}

// 記事下部用のCTA
export function RequestCTA() {
  return (
    <div className="bg-gradient-to-r from-brand-50 to-orange-50 border border-brand-200 rounded-xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-full mb-4">
        <Send className="w-6 h-6 text-brand-600" />
      </div>
      <h3 className="text-lg font-bold text-[#0f1419] mb-2">
        読みたいコラムをリクエストしませんか？
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        知りたいテーマやお得情報があれば、お気軽にリクエストしてください。
      </p>
      <Link
        href="/columns/request"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
      >
        <Send className="w-4 h-4" />
        リクエストする
      </Link>
    </div>
  );
}

