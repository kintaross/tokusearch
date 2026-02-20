import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTNAMES = new Set(['drive.google.com', 'lh3.googleusercontent.com']);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/** Google Drive の共有リンクを画像取得用URLに正規化（/file/d/ID/view 等 → /uc?export=view&id=） */
function normalizeDriveImageUrl(parsed: URL): string {
  if (parsed.hostname !== 'drive.google.com') return parsed.toString();
  const path = parsed.pathname;
  const idFromPath = path.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  const idFromQuery = parsed.searchParams.get('id');
  const fileId = idFromPath || idFromQuery;
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return parsed.toString();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // SSRF対策: https + 明示的なホスト名 allowlist のみ許可
  if (url.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only https URLs are allowed' }, { status: 400 });
  }
  if (url.username || url.password) {
    return NextResponse.json({ error: 'URL must not include credentials' }, { status: 400 });
  }
  if (url.port) {
    return NextResponse.json({ error: 'URL must not include custom port' }, { status: 400 });
  }
  if (!ALLOWED_HOSTNAMES.has(url.hostname)) {
    return NextResponse.json({ error: 'Hostname not allowed' }, { status: 400 });
  }

  const fetchUrl = normalizeDriveImageUrl(url);

  try {
    // 画像を取得
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return NextResponse.json({ error: 'Response is not an image' }, { status: 400 });
    }

    const contentLengthHeader = response.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;
    if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    // 画像データを取得（サイズ上限を越えない前提）
    const imageBuffer = await response.arrayBuffer();
    if (imageBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    // 画像を返す
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image', details: error.message },
      { status: 500 }
    );
  }
}



