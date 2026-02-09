'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ImageIcon } from 'lucide-react';

type Heading = {
  id: string;
  text: string;
};

type Props = {
  content: string;
  headings: Heading[];
};

export function MarkdownContent({ content, headings }: Props) {
  // h2のインデックスを追跡するためのクロージャー変数
  let h2Index = 0;
  
  return (
    <div className="prose prose-lg max-w-none
      [&>p]:leading-relaxed [&>p]:mb-4
      [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:pt-6 [&>h2]:border-t [&>h2]:border-gray-200 [&>h2]:border-b-4 [&>h2]:border-b-brand-500 [&>h2]:pb-3
      [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-xl [&>h3]:font-bold
      [&>ul]:my-4 [&>ul]:pl-6 [&>li]:mb-2
      [&>ol]:my-4 [&>ol]:pl-6
      [&_mark]:bg-yellow-100 [&_mark]:text-gray-900 [&_mark]:px-1 [&_mark]:rounded [&_mark]:underline [&_mark]:decoration-2 [&_mark]:decoration-yellow-500">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h2: ({ children, ...props }) => {
            const currentIndex = h2Index;
            h2Index++; // 次のh2用にインクリメント
            
            const heading = headings[currentIndex];
            const id = heading?.id || `section-${currentIndex}`;
            
            return <h2 id={id} {...props}>{children}</h2>;
          },
          p: ({ children, ...props }) => {
            // 段落内に[IMAGE: xxx]があるかチェック
            const textContent = String(children);
            const imageMatch = textContent.match(/\[IMAGE:\s*([^\]]+)\]/);
            
            if (imageMatch) {
              const description = imageMatch[1];
              return (
                <div className="my-6 p-4 border-2 border-dashed border-brand-300 bg-brand-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-6 h-6 text-brand-600 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-semibold text-brand-700">📷 画像挿入位置</div>
                      <div className="text-gray-600">{description}</div>
                    </div>
                  </div>
                </div>
              );
            }
            
            return <p {...props}>{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

