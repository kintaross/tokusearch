export type MarkerKind = 'ui' | 'table' | 'flow' | 'chart' | 'illustration';

export type ExtractedMarker = {
  description: string;
  kind: MarkerKind;
  /** 0-based index in markdown string */
  index: number;
  /** nearest preceding h2 heading text, if any */
  h2: string;
  /** short surrounding snippet for context */
  contextSnippet: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeDescription(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[　]/g, ' ');
}

export function classifyMarker(description: string): MarkerKind {
  const d = normalizeDescription(description);
  if (!d) return 'illustration';

  // UI-ish keywords
  if (
    /画面|スクリーン|UI|アプリ|操作|手順|設定|ホーム|一覧|履歴|申込|申し込み|登録|ログイン|ボタン/i.test(d)
  ) {
    return 'ui';
  }

  // Table-ish keywords
  if (/比較|一覧表|表|料金表|早見表|チェックリスト/i.test(d)) {
    return 'table';
  }

  // Flow-ish keywords
  if (/フロー|流れ|手順図|フローチャート|ステップ|ルート|手続き/i.test(d)) {
    return 'flow';
  }

  // Chart-ish keywords
  if (/グラフ|推移|内訳|割合|棒グラフ|折れ線|円グラフ/i.test(d)) {
    return 'chart';
  }

  return 'illustration';
}

function extractNearestH2Before(markdown: string, pos: number): string {
  const before = markdown.slice(0, clamp(pos, 0, markdown.length));
  const matches = [...before.matchAll(/^##\s+(.+)$/gm)];
  return matches.length ? String(matches[matches.length - 1][1]).trim() : '';
}

function extractSnippetAround(markdown: string, pos: number, spanChars: number): string {
  const start = clamp(pos - spanChars, 0, markdown.length);
  const end = clamp(pos + spanChars, 0, markdown.length);
  return markdown
    .slice(start, end)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts `[IMAGE: ...]` markers from markdown.
 * - Keeps marker description as-is (trimmed), but also classifies kind.
 * - Adds nearest preceding h2 and a short context snippet.
 */
export function extractImageMarkers(
  markdown: string,
  options?: { maxMarkers?: number; contextSpanChars?: number }
): ExtractedMarker[] {
  const md = String(markdown ?? '');
  const maxMarkers = options?.maxMarkers ?? 20;
  const contextSpanChars = options?.contextSpanChars ?? 260;

  const out: ExtractedMarker[] = [];
  const re = /\[IMAGE:\s*([^\]]+?)\s*\]/g;
  for (const m of md.matchAll(re)) {
    const desc = normalizeDescription(m[1]);
    const index = typeof m.index === 'number' ? m.index : md.indexOf(m[0]);
    const h2 = extractNearestH2Before(md, index);
    const contextSnippet = extractSnippetAround(md, index, contextSpanChars);
    out.push({
      description: desc,
      kind: classifyMarker(desc),
      index,
      h2,
      contextSnippet,
    });
    if (out.length >= maxMarkers) break;
  }
  return out;
}

export function needsThumbnail(thumbnailUrl: string | null | undefined): boolean {
  const u = String(thumbnailUrl ?? '').trim();
  if (!u) return true;
  // legacy placeholder
  if (u.includes('placehold.co')) return true;
  return false;
}

function safeOneLine(s: string, maxLen: number): string {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen);
}

export function buildThumbnailPrompt(input: { title: string; category?: string }): string {
  const title = safeOneLine(input.title, 40);
  const category = safeOneLine(input.category ?? '', 24);

  return [
    'TokuSearchのコラム用サムネイル画像を作成してください。16:9。',
    '',
    '画像内に入れる文字は次の1行のみ、完全一致で出力してください：',
    `「${title}」`,
    '',
    'ルール：',
    '- 上記以外の文字（英数字、記号、ダミーテキスト、透かし風の文字）は一切入れない',
    '- 日本語は誤字脱字なく、自然で正しい表記にする',
    '- 読みやすいゴシック体（Noto Sans JP風）、太め、中央配置、強いコントラスト（白文字＋暗い帯など）',
    '- 背景は明るく親しみやすいフラットイラストで、「ポイ活・節約」を連想させる要素（スマホ、ポイント、コイン、矢印など）を入れる',
    category ? `- テーマは「${category}」に合う雰囲気にする` : '- テーマは記事内容に合う雰囲気にする',
    '- 企業ロゴや実在サービスの固有UIを模写しない（架空デザインにする）',
  ].join('\n');
}

function kindStyleLines(kind: MarkerKind): string[] {
  switch (kind) {
    case 'ui':
      return [
        '- 架空のスマホアプリUIのモック（スクリーンショット風）',
        '- 日本語ラベルは短く、誤字脱字なく、読みやすく',
        '- 実在サービス名・ロゴは使わない（架空の名称/アイコンにする）',
      ];
    case 'table':
      return [
        '- 比較表/早見表（表形式で見やすく）',
        '- 日本語は短く正確に。数字や単位は読みやすく配置',
        '- 余白を確保し、スマホでも判読できる文字サイズ',
      ];
    case 'flow':
      return [
        '- 手順フローチャート（矢印とボックスで流れが一目で分かる）',
        '- 日本語ラベルは短く正確に。ステップ番号を入れてもよい',
        '- 余白を確保し、読みやすいレイアウト',
      ];
    case 'chart':
      return [
        '- グラフ/図解（棒/折れ線/円など、内容に合う形式）',
        '- 凡例や軸ラベルは短い日本語で正確に',
        '- 誤解を招く誇張表現は避け、シンプルに',
      ];
    default:
      return [
        '- 記事を補助する図解イラスト（アイコン、図、シンプルな構図）',
        '- 日本語を入れる場合は最小限で、誤字脱字なく',
      ];
  }
}

export function buildInlinePrompt(input: {
  columnTitle: string;
  category?: string;
  marker: ExtractedMarker;
}): string {
  const title = safeOneLine(input.columnTitle, 44);
  const category = safeOneLine(input.category ?? '', 24);
  const marker = input.marker;

  const styleLines = [
    'スタイル：',
    '- Web記事向けのクリーンな図解/イラスト/モック',
    ...kindStyleLines(marker.kind),
    '- 不要なテキストは入れない（透かし文字・ダミーテキスト禁止）',
    '- 背景はシンプル、配色は明るく、可読性重視',
  ];

  return [
    'TokuSearchのコラム記事に挿入する画像を1枚作成してください。16:9。',
    '',
    '画像の目的（必ず満たす）：',
    `- 記事タイトル「${title}」の文脈に合う`,
    marker.h2 ? `- セクション「${safeOneLine(marker.h2, 44)}」の理解を助ける` : '- 本文の理解を助ける',
    `- 「${safeOneLine(marker.description, 80)}」を視覚的に分かりやすくする`,
    '',
    ...styleLines,
    '',
    category ? `カテゴリのヒント：${category}` : '',
    '補足（本文の周辺文脈）：',
    marker.contextSnippet ? marker.contextSnippet : '(文脈なし)',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

// ---------------------------------------------------------------------------
// Auto-insert [IMAGE: ...] markers for articles that don't have any
// ---------------------------------------------------------------------------

function stripInlineFormatting(s: string): string {
  return String(s ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Analyse h2 headings and auto-insert `[IMAGE: ...]` markers into markdown
 * that does not already contain any.
 *
 * Designed to be called from the `next` API so the existing apply flow
 * (marker → `![desc](url)` replacement) works unchanged.
 */
export function autoInsertImageMarkers(
  markdown: string,
  options?: { maxMarkers?: number },
): { content_markdown: string; inserted: number } {
  const md = String(markdown ?? '');
  const maxMarkers = options?.maxMarkers ?? 4;

  // Already has [IMAGE:] markers — nothing to do.
  if (/\[IMAGE:\s*[^\]]+?\s*\]/.test(md)) {
    return { content_markdown: md, inserted: 0 };
  }

  // Already has 2+ inline images — article was already processed.
  const existingInlineImages = (md.match(/!\[.*?\]\(https?:\/\/[^\)]+\)/g) || []).length;
  if (existingInlineImages >= 2) {
    return { content_markdown: md, inserted: 0 };
  }

  // Collect h2 headings
  const h2Re = /^##\s+(.+)$/gm;
  const headings: { text: string; endIndex: number }[] = [];
  for (const m of md.matchAll(h2Re)) {
    if (typeof m.index === 'number') {
      headings.push({
        text: stripInlineFormatting(m[1]),
        endIndex: m.index + m[0].length,
      });
    }
  }

  if (headings.length === 0) {
    return { content_markdown: md, inserted: 0 };
  }

  // Filter out conclusion / intro headings — we want the "meaty" sections
  const skipRe = /^(まとめ|おわりに|最後に|結論|はじめに|導入$)/;
  let candidates = headings.filter((h) => !skipRe.test(h.text));
  if (candidates.length === 0) {
    // Fallback: everything except the last heading (assumed to be conclusion)
    candidates = headings.length > 1 ? headings.slice(0, -1) : headings;
  }

  const selected = candidates.slice(0, maxMarkers);

  let result = md;
  let offset = 0;
  let inserted = 0;

  for (const heading of selected) {
    const desc = `${heading.text}を解説するイメージ図`;
    const marker = `\n\n[IMAGE: ${desc}]`;
    const pos = heading.endIndex + offset;
    result = result.slice(0, pos) + marker + result.slice(pos);
    offset += marker.length;
    inserted++;
  }

  return { content_markdown: result, inserted };
}

// ---------------------------------------------------------------------------

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace `[IMAGE: desc]` markers to markdown image `![desc](url)`.
 * - Matches extra spaces around `IMAGE:` and inside brackets.
 * - Replaces all occurrences for each description.
 */
export function applyInlineImagesToMarkdown(
  markdown: string,
  inlineImages: Array<{ description: string; url: string }>
): { content_markdown: string; replacedCount: number } {
  let md = String(markdown ?? '');
  let replacedCount = 0;

  for (const item of inlineImages) {
    const desc = normalizeDescription(item.description);
    const url = String(item.url ?? '').trim();
    if (!desc || !url) continue;

    const re = new RegExp(`\\[IMAGE:\\s*${escapeRegExp(desc)}\\s*\\]`, 'g');
    const before = md;
    const matches = before.match(re) || [];
    if (matches.length === 0) continue;
    md = before.replace(re, `![${desc}](${url})`);
    replacedCount += matches.length;
  }

  return { content_markdown: md, replacedCount };
}

