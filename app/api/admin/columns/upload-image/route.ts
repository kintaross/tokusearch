import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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
    const { image, filename } = body;

    if (!image || !filename) {
      return NextResponse.json(
        { error: 'image と filename が必要です' },
        { status: 400 }
      );
    }

    // Base64からバッファに変換
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 保存先ディレクトリ
    const imagesDir = path.join(process.cwd(), 'public', 'columns', 'images');

    // ディレクトリが存在しない場合は作成
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }

    // ファイル保存
    const filepath = path.join(imagesDir, filename);
    await writeFile(filepath, buffer);

    // URLを返す
    const url = `/columns/images/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      filename,
    });
  } catch (error: any) {
    console.error('画像アップロードエラー:', error);
    return NextResponse.json(
      { error: error.message || '画像のアップロードに失敗しました' },
      { status: 500 }
    );
  }
}



