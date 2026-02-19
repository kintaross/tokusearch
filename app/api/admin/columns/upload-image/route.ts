import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { isIngestAuthorized } from '@/lib/ingest-auth';

function cleanEnvValue(value: string | undefined): string {
  return String(value ?? '')
    .trim()
    .replace(/\\r\\n|\\n|\\r/g, '')
    .replace(/[\r\n]+$/g, '');
}

function parseDataUrl(input: string): { mimeType: string; base64Data: string } {
  const s = String(input ?? '');
  const m = s.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (m) return { mimeType: m[1], base64Data: m[2] };
  return { mimeType: 'image/png', base64Data: s };
}

function sanitizeFilename(name: string): string {
  const base = String(name ?? '').trim() || 'image.png';
  return base.replace(/[^a-zA-Z0-9._-]/g, '-');
}

async function getGoogleDriveClientWithOAuth() {
  const clientId = cleanEnvValue(process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET);
  const refreshToken = cleanEnvValue(process.env.GOOGLE_DRIVE_REFRESH_TOKEN);
  const redirectUri =
    cleanEnvValue(process.env.GOOGLE_DRIVE_REDIRECT_URI) ||
    (cleanEnvValue(process.env.NEXTAUTH_URL)
      ? `${cleanEnvValue(process.env.NEXTAUTH_URL)}/api/auth/callback/google`
      : 'http://localhost:3000/oauth2callback');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google Drive OAuth情報が不足しています。GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET / GOOGLE_DRIVE_REFRESH_TOKEN を設定してください。'
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  await oauth2Client.getAccessToken();

  return google.drive({ version: 'v3', auth: oauth2Client });
}

async function getOrCreateFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  const searchResponse = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 10,
  });

  if (searchResponse.data.files && searchResponse.data.files.length > 0) {
    return searchResponse.data.files[0].id!;
  }

  const folderMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    folderMetadata.parents = [parentId];
  }

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return folder.data.id!;
}

export async function POST(request: NextRequest) {
  try {
    // API Key認証
    if (!isIngestAuthorized(request)) {
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

    // 既存管理画面と同じ保存方式: Google Drive
    const drive = await getGoogleDriveClientWithOAuth();

    // ディレクトリ構造: TokuSearch/columns/thumbnails/{year}/{month}/
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const tokuSearchFolderId = await getOrCreateFolder(drive, 'TokuSearch');
    const columnsFolderId = await getOrCreateFolder(drive, 'columns', tokuSearchFolderId);
    const thumbnailsFolderId = await getOrCreateFolder(drive, 'thumbnails', columnsFolderId);
    const yearFolderId = await getOrCreateFolder(drive, year, thumbnailsFolderId);
    const monthFolderId = await getOrCreateFolder(drive, month, yearFolderId);

    const stream = Readable.from(buffer);
    const driveFile = await drive.files.create({
      requestBody: {
        name: safeName,
        mimeType,
        parents: [monthFolderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, name',
    });

    if (!driveFile.data.id) {
      throw new Error('Google Driveへのアップロードに失敗しました');
    }

    const fileId = driveFile.data.id;

    // 既存管理画面と同じ公開設定
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const url = `https://drive.google.com/uc?export=view&id=${fileId}`;

    return NextResponse.json({
      success: true,
      url,
      filename: safeName,
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



