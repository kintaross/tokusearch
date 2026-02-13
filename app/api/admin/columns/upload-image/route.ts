import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { put } from '@vercel/blob';

function parseDataUrl(input: string): { mimeType: string; base64Data: string } {
  const s = String(input ?? '');
  const m = s.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (m) return { mimeType: m[1], base64Data: m[2] };
  // Backward compatibility: raw base64 without data URL prefix
  return { mimeType: 'image/png', base64Data: s };
}

function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mimeType.toLowerCase()] || 'png';
}

function sanitizeFilename(name: string): string {
  const base = String(name ?? '').trim() || 'image.png';
  return base.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function POST(request: NextRequest) {
  try {
    // API Key認証
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { image, filename, meta } = body;

    if (!image || !filename) {
      return NextResponse.json(
        { error: 'image と filename が必要です' },
        { status: 400 }
      );
    }

    const { mimeType, base64Data } = parseDataUrl(String(image));
    const buffer = Buffer.from(base64Data, 'base64');
    const safeName = sanitizeFilename(String(filename));
    const hasExt = /\.[a-zA-Z0-9]+$/.test(safeName);
    const finalName = hasExt ? safeName : `${safeName}.${extFromMime(mimeType)}`;

    let url = '';

    // Vercel本番では /var/task は read-only のため Blob に保存
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`columns/images/${finalName}`, buffer, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: true,
      });
      url = blob.url;
    } else {
      // Local/dev fallback: 従来通り public 配下へ保存
      const imagesDir = path.join(process.cwd(), 'public', 'columns', 'images');
      if (!existsSync(imagesDir)) {
        await mkdir(imagesDir, { recursive: true });
      }
      const filepath = path.join(imagesDir, finalName);
      await writeFile(filepath, buffer);
      url = `/columns/images/${finalName}`;
    }

    return NextResponse.json({
      success: true,
      url,
      filename: finalName,
      meta: meta ?? null,
    });
  } catch (error: any) {
    console.error('画像アップロードエラー:', error);
    return NextResponse.json(
      { error: error.message || '画像のアップロードに失敗しました' },
      { status: 500 }
    );
  }
}



