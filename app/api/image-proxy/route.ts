import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTNAMES = new Set(['drive.google.com', 'lh3.googleusercontent.com']);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function getDriveFileId(parsed: URL): string | null {
  if (parsed.hostname !== 'drive.google.com') return null;
  const path = parsed.pathname;
  const idFromPath = path.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  const idFromQuery = parsed.searchParams.get('id');
  return idFromPath || idFromQuery;
}

function buildDriveCandidateUrls(fileId: string): string[] {
  // Drive はリンク形式により HTML が返ることがあるため、複数の取り方で試す
  return [
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
  ];
}

async function fetchImage(url: string): Promise<{ ok: true; buf: ArrayBuffer; contentType: string } | { ok: false; status: number }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'image/avif,image/webp,image/*,*/*',
      Referer: 'https://drive.google.com/',
    },
  });

  if (!response.ok) return { ok: false, status: response.status };

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) return { ok: false, status: 400 };

  const contentLengthHeader = response.headers.get('content-length');
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;
  if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) return { ok: false, status: 413 };

  const buf = await response.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return { ok: false, status: 413 };

  return { ok: true, buf, contentType };
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

  try {
    const driveFileId = getDriveFileId(url);
    const candidates = driveFileId ? buildDriveCandidateUrls(driveFileId) : [url.toString()];

    let lastStatus = 400;
    for (const candidateUrl of candidates) {
      const result = await fetchImage(candidateUrl);
      if (result.ok) {
        return new NextResponse(result.buf, {
          status: 200,
          headers: {
            'Content-Type': result.contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
      lastStatus = result.status;
    }

    return NextResponse.json({ error: 'Failed to fetch image' }, { status: lastStatus });
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image', details: error.message },
      { status: 500 }
    );
  }
}



