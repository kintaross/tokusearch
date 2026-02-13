import Link from 'next/link';
import { BookOpen } from 'lucide-react';

const LINKS = [
  { href: '/columns?tag=ウエル活', label: 'ウエル活コラム一覧' },
  { href: '/columns', label: 'お得の基礎知識コラム' },
];

export function ColumnLinks() {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-[#0f1419] mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-brand-600" />
        もっと知りたい方へ
      </h2>
      <div className="flex flex-wrap gap-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#ebe7df] rounded-lg font-medium text-[#0f1419] hover:border-brand-400 hover:text-brand-600 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
