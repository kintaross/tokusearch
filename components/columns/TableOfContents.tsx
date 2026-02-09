'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

type Heading = {
  id: string;
  text: string;
};

type Props = {
  headings: Heading[];
};

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%',
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // URLを更新
      window.history.pushState(null, '', `#${id}`);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-5 h-5 text-brand-600" />
        <h2 className="text-lg font-bold text-[#0f1419]">この記事の目次</h2>
      </div>
      <ol className="space-y-2">
        {headings.map(({ id, text }, index) => {
          // 改行文字、タブ、キャリッジリターンを削除
          // 複数のスペースを1つに統一
          // マークダウンの強調記号を削除
          const cleanText = text
            .replace(/[\n\r\t]/g, ' ') // 改行、キャリッジリターン、タブをスペースに
            .replace(/\*\*/g, '') // マークダウンの強調記号を削除
            .replace(/__/g, '') // マークダウンの強調記号を削除
            .replace(/\s+/g, ' ') // 複数のスペースを1つに統一
            .trim();
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                className={`block py-2 px-3 rounded text-sm transition-colors ${
                  activeId === id
                    ? 'bg-brand-100 text-brand-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {index + 1}. {cleanText}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

