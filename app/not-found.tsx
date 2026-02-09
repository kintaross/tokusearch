import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="mb-12">
        <h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-2xl text-gray-600 font-medium mb-8">
          お探しのページが見つかりませんでした
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-3 px-8 py-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Home size={20} />
        トップページに戻る
      </Link>
    </div>
  );
}
