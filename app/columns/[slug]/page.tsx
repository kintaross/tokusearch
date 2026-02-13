import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Eye, Home, ChevronRight } from 'lucide-react';
import { getColumnBySlug, incrementViewCount, getRelatedColumns, getPopularColumns, getAllCategories } from '@/lib/columns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TableOfContents } from '@/components/columns/TableOfContents';
import { SideNav } from '@/components/columns/SideNav';
import { MarkdownContent } from '@/components/columns/MarkdownContent';
import { ColumnImage } from '@/components/columns/ColumnImage';
import { RequestCTA } from '@/components/columns/RequestButton';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string };
};

// マークダウンコンテンツを正規化する関数
// 見出しの後に改行が1つしかない場合、追加の改行を挿入する
function normalizeMarkdown(markdown: string): string {
  // 見出し（## で始まる行）の後に改行が1つしかない場合、追加の改行を挿入
  // パターン: ## 見出し\n本文 → ## 見出し\n\n本文
  return markdown.replace(/^(##\s+[^\n]+)\n([^\n#])/gm, (match, heading, nextLine) => {
    // 見出しの後に改行が1つで、その次の行が見出しでない場合
    // 見出しの後に追加の改行を挿入
    return heading + '\n\n' + nextLine;
  });
}

// タイトル二重表示を防ぐため、先頭のH1を削除する関数
function removeLeadingH1(markdown: string, title: string): string {
  const lines = markdown.split('\n');
  let firstNonEmptyIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      firstNonEmptyIndex = i;
      break;
    }
  }
  
  if (firstNonEmptyIndex === -1) return markdown;
  
  const firstNonEmptyLine = lines[firstNonEmptyIndex].trim();
  if (firstNonEmptyLine === `# ${title}`) {
    return lines
      .filter((_, index) => index !== firstNonEmptyIndex)
      .join('\n');
  }
  
  return markdown;
}

// リード文を抽出（description がなければ最初の段落を使用）
function extractLead(description: string, markdown: string): string {
  if (description && description.trim() !== '') {
    return description;
  }
  
  // markdownから最初の段落を抽出
  const lines = markdown.split('\n');
  let inParagraph = false;
  let paragraphLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 見出しや空行はスキップ
    if (trimmed.startsWith('#') || trimmed === '') {
      if (inParagraph) break; // 段落終了
      continue;
    }
    
    // 段落開始
    if (!inParagraph) {
      inParagraph = true;
    }
    
    paragraphLines.push(trimmed);
    
    // 120文字程度で切る
    const combined = paragraphLines.join(' ');
    if (combined.length >= 120) {
      return combined.substring(0, 120) + '...';
    }
  }
  
  return paragraphLines.join(' ');
}

// h2見出しを抽出してTOC用データを生成
function extractHeadings(markdown: string): Array<{ id: string; text: string }> {
  const lines = markdown.split('\n');
  const headings: Array<{ id: string; text: string }> = [];
  let h2Count = 0;
  
  lines.forEach((line) => {
    // 行の先頭から見出しを検索
    // 見出し行内に\nが含まれている可能性があるため、まず行内の最初の\nまでを取得
    const headingMatch = line.match(/^##\s+(.+?)(?:\n|$)/);
    if (headingMatch) {
      let text = headingMatch[1];
      
      // 見出し行内に改行文字（\n）が含まれている場合、最初の改行までを取得
      const firstNewlineIndex = text.indexOf('\n');
      if (firstNewlineIndex > 0) {
        text = text.substring(0, firstNewlineIndex);
      }
      
      // 見出しテキストから改行文字、タブ、キャリッジリターンを削除
      // 複数のスペースを1つに統一
      text = text
        .trim()
        .replace(/[\n\r\t]/g, ' ') // 改行、キャリッジリターン、タブをスペースに
        .replace(/\s+/g, ' ') // 複数のスペースを1つに統一
        .trim();
      
      // 見出しが空でない場合のみ追加
      if (text.length > 0) {
        const id = `section-${h2Count}`;
        headings.push({ id, text });
        h2Count++;
      }
    }
  });
  
  return headings;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const column = await getColumnBySlug(params.slug);

  if (!column || column.status !== 'published') {
    return {
      title: 'ページが見つかりません | TokuSearch',
    };
  }

  return {
    title: `${column.title} | TokuSearch コラム`,
    description: column.description,
    openGraph: {
      title: column.title,
      description: column.description,
      images: column.thumbnail_url ? [column.thumbnail_url] : [],
      url: `https://tokusearch.vercel.app/columns/${column.slug}`,
    },
    alternates: {
      canonical: `https://tokusearch.vercel.app/columns/${column.slug}`,
    },
  };
}

export default async function ColumnDetailPage({ params }: Props) {
  const column = await getColumnBySlug(params.slug);

  if (!column || column.status !== 'published') {
    notFound();
  }

  // 閲覧数をインクリメント（非同期・待機しない）
  void incrementViewCount(column.id);

  const tags = column.tags ? column.tags.split(',').map((t) => t.trim()) : [];

  // マークダウンを正規化（見出しの後に改行がない場合、改行を追加）
  const normalizedContent = normalizeMarkdown(column.content_markdown);

  // タイトル二重表示を防ぐため、先頭H1を削除
  const processedContent = removeLeadingH1(normalizedContent, column.title);

  // リード文を抽出
  const leadText = extractLead(column.description, processedContent);

  // 目次用の見出しを抽出
  const headings = extractHeadings(processedContent);

  // 関連記事・人気記事・カテゴリを並列取得
  const [relatedColumns, popularColumns, allCategories] = await Promise.all([
    getRelatedColumns(column.id, column.category, 3),
    getPopularColumns(5),
    getAllCategories(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* サイドナビ（PC: 左固定、SP: 記事下部に移動） */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <SideNav categories={allCategories} />
            </div>
          </aside>

          {/* メインコンテンツ */}
          <main className="lg:col-span-3">
            <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 md:p-10 max-w-3xl mx-auto">
                {/* パンくずリスト */}
                <nav className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                  <Link href="/" className="hover:text-brand-600 flex items-center gap-1 flex-shrink-0">
                    <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">ホーム</span>
                  </Link>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <Link href="/columns" className="hover:text-brand-600 flex-shrink-0">
                    コラム
                  </Link>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <Link href={`/columns?category=${encodeURIComponent(column.category)}`} className="hover:text-brand-600 flex-shrink-0">
                    {column.category}
                  </Link>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-gray-400 truncate max-w-[150px] sm:max-w-none">{column.title}</span>
                </nav>

                {/* カテゴリバッジ */}
                <div className="mb-4">
                  <Link
                    href={`/columns?category=${encodeURIComponent(column.category)}`}
                    className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-sm font-medium rounded-full hover:bg-brand-200 transition-colors"
                  >
                    {column.category}
                  </Link>
                </div>

                {/* タイトルと共有ボタン */}
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419] flex-1">
                    {column.title}
                  </h1>
                  <div className="ml-4 flex-shrink-0">
                    <ShareButton id={column.slug} title={column.title} type="column" />
                  </div>
                </div>

                {/* メタ情報 */}
                <div className="text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                  <time dateTime={column.published_at}>
                    {new Date(column.published_at).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span className="mx-2">・</span>
                  <span>{column.view_count + 1} views</span>
                  <span className="mx-2">・</span>
                  <span>執筆: {column.author}</span>
                </div>

                {/* アイキャッチ画像 */}
                {column.thumbnail_url && column.thumbnail_url.trim() !== '' ? (
                  <div className="mb-8 rounded-lg overflow-hidden aspect-video bg-gray-100">
                    <ColumnImage
                      src={column.thumbnail_url}
                      alt={column.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-8 rounded-lg overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 aspect-video flex items-center justify-center border border-brand-200">
                    <div className="text-center px-6">
                      <div className="text-6xl mb-3">📖</div>
                      <div className="text-lg font-bold text-brand-700">{column.category}</div>
                      <div className="text-sm text-brand-600 mt-2 line-clamp-2">{column.title}</div>
                    </div>
                  </div>
                )}

                {/* リード文 */}
                {leadText && (
                  <div className="text-lg text-gray-700 leading-relaxed mb-8 pb-8 border-b border-gray-200 prose prose-lg max-w-none [&>p]:mb-0 [&>p:last-child]:mb-0 [&_strong]:font-bold [&_strong]:text-gray-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {leadText}
                    </ReactMarkdown>
                  </div>
                )}

                {/* 目次 */}
                {headings.length > 0 && (
                  <TableOfContents headings={headings} />
                )}

                {/* 本文 */}
                <MarkdownContent content={processedContent} headings={headings} />

                {/* タグ */}
                {tags.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      {tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/columns?tag=${encodeURIComponent(tag)}`}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-brand-100 hover:text-brand-700 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* 関連記事 */}
            {relatedColumns.length > 0 && (
              <section className="mt-8">
                <h2 className="text-2xl font-bold text-[#0f1419] mb-4">関連記事</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedColumns.map((relatedCol) => (
                    <Link
                      key={relatedCol.id}
                      href={`/columns/${relatedCol.slug}`}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="text-xs text-brand-600 font-medium mb-2">
                        {relatedCol.category}
                      </div>
                      <h3 className="font-bold text-[#0f1419] mb-2 line-clamp-2">
                        {relatedCol.title}
                      </h3>
                      <div className="text-xs text-gray-500">
                        {new Date(relatedCol.published_at).toLocaleDateString('ja-JP')}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 人気コラム */}
            {popularColumns.length > 0 && (
              <section className="mt-8">
                <h2 className="text-2xl font-bold text-[#0f1419] mb-4">人気コラム</h2>
                <div className="bg-white border border-gray-200 rounded-lg divide-y">
                  {popularColumns.slice(0, 5).map((popCol, index) => (
                    <Link
                      key={popCol.id}
                      href={`/columns/${popCol.slug}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#0f1419] mb-1 line-clamp-2">
                            {popCol.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{popCol.category}</span>
                            <span>・</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {popCol.view_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* SP時のサイドナビ */}
            <div className="lg:hidden mt-8">
              <SideNav categories={allCategories} isMobile />
            </div>

            {/* コラムリクエストCTA */}
            <div className="mt-8">
              <RequestCTA />
            </div>

            {/* コラム一覧へボタン */}
            <div className="mt-12 text-center">
              <Link
                href="/columns"
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold text-lg"
              >
                コラム一覧へ
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
