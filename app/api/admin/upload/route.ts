import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionValue } from '@/lib/admin-session';

/**
 * Google Drive API v3 を使用した画像アップロード
 * 
 * 問題: Service Accountにはストレージクォータがないため、ファイル作成自体が失敗する
 * 解決策: OAuth 2.0リフレッシュトークンを使用して、ユーザーのトークンでファイルを作成
 * 
 * 実装方法:
 * 1. ユーザーがOAuth 2.0認証を行い、リフレッシュトークンを取得
 * 2. リフレッシュトークンを環境変数 GOOGLE_DRIVE_REFRESH_TOKEN に保存
 * 3. リフレッシュトークンを使用してアクセストークンを取得
 * 4. アクセストークンでファイルを作成（ユーザーのストレージクォータを使用）
 */

/**
 * OAuth 2.0クライアントを使用してGoogle Drive APIクライアントを取得
 * リフレッシュトークンを使用してアクセストークンを取得し、ユーザーのドライブにアクセス
 */
async function getGoogleDriveClientWithOAuth() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const debug = process.env.DEBUG_UPLOAD === '1';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'OAuth 2.0認証情報が設定されていません。' +
      'GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN を設定してください。'
    );
  }

  // リフレッシュトークン取得時に使用したリダイレクトURIと同じものを使用
  // リフレッシュトークンを使用する場合、リダイレクトURIは実際には使用されないが、初期化時に指定が必要
  // 環境変数から読み込むか、デフォルトでlocalhostを使用（リフレッシュトークン取得時に使用したURI）
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
  if (debug) {
    console.log('OAuth 2.0認証情報の確認:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
      redirectUri,
    });
    if (refreshToken && !refreshToken.startsWith('1//')) {
      console.warn('⚠️ リフレッシュトークンの形式が正しくない可能性があります');
    }
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // リフレッシュトークンを設定
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // アクセストークンを取得（リフレッシュトークンから自動的に取得される）
  try {
    const accessToken = await oauth2Client.getAccessToken();
    if (!accessToken.token) {
      throw new Error('アクセストークンの取得に失敗しました');
    }
    if (debug) console.log('アクセストークンの取得に成功しました');
  } catch (tokenError: any) {
    console.error('アクセストークン取得エラー:', { message: tokenError.message, code: tokenError.code });
    
    // より詳細なエラー情報を提供
    let errorDetails = `アクセストークンの取得に失敗しました: ${tokenError.message}`;
    
    if (tokenError.message.includes('invalid_grant')) {
      errorDetails += '\n\n`invalid_grant`エラーの原因:';
      errorDetails += '\n1. リフレッシュトークンが無効（期限切れ、取り消し済み、または間違っている）';
      errorDetails += '\n2. リフレッシュトークンが別のクライアントID/シークレットで取得されたもの';
      errorDetails += '\n3. リダイレクトURIの不一致';
      errorDetails += '\n\n解決方法:';
      errorDetails += '\n1. 新しい認証コードでリフレッシュトークンを再取得してください';
      errorDetails += '\n2. クライアントIDとシークレットが正しく設定されているか確認してください';
      errorDetails += '\n3. リダイレクトURIが一致しているか確認してください（現在: ' + redirectUri + '）';
    }
    
    throw new Error(errorDetails);
  }

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  return drive;
}

/**
 * フォルダを取得または作成する関数
 * ユーザーのドライブに直接アクセスするため、所有権の問題は発生しない
 */
async function getOrCreateFolder(
  drive: any,
  folderName: string,
  parentId?: string
): Promise<string> {
  // 既存のフォルダを検索
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

  // 既存のフォルダが見つかった場合
  if (searchResponse.data.files && searchResponse.data.files.length > 0) {
    return searchResponse.data.files[0].id!;
  }

  // フォルダが存在しない場合は作成
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
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
  const value = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';
  const session = verifyAdminSessionValue({ value, secret });
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const debug = process.env.DEBUG_UPLOAD === '1';
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
    }

    // 画像ファイルチェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '画像ファイルを選択してください' }, { status: 400 });
    }

    // OAuth 2.0を使用してGoogle Drive APIクライアントを取得
    // ユーザーのトークンでファイルを作成するため、ストレージクォータの問題は発生しない
    const drive = await getGoogleDriveClientWithOAuth();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ディレクトリ構造を作成: TokuSearch/columns/thumbnails/{year}/{month}/
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // フォルダ階層を作成（ユーザーのドライブに直接作成される）
    const tokuSearchFolderId = await getOrCreateFolder(drive, 'TokuSearch');
    const columnsFolderId = await getOrCreateFolder(drive, 'columns', tokuSearchFolderId);
    const thumbnailsFolderId = await getOrCreateFolder(drive, 'thumbnails', columnsFolderId);
    const yearFolderId = await getOrCreateFolder(drive, year, thumbnailsFolderId);
    const monthFolderId = await getOrCreateFolder(drive, month, yearFolderId);

    // ファイル名を生成
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `column-thumbnail-${timestamp}-${random}.${extension}`;

    // BufferをReadableストリームに変換
    const stream = Readable.from(buffer);

    // ユーザーのトークンでファイルを作成
    // ユーザーのドライブに直接作成されるため、ストレージクォータの問題は発生しない
    const driveFile = await drive.files.create({
      requestBody: {
        name: filename,
        mimeType: file.type,
        parents: [monthFolderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink, webContentLink',
    });

    if (!driveFile.data.id) {
      throw new Error('Google Driveへのアップロードに失敗しました');
    }

    const fileId = driveFile.data.id;

    // ファイルを共有可能にする（Anyone with the link can view）
    let shareSuccess = false;
    try {
      const shareResult = await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      if (debug) console.log('ファイルの共有設定が完了しました:', shareResult.data);
      shareSuccess = true;
    } catch (shareError: any) {
      console.error('共有設定に失敗しました:', shareError.message);
      
      // 共有設定に失敗した場合、ファイルの共有状態を確認
      try {
        const fileInfo = await drive.files.get({
          fileId: fileId,
          fields: 'shared, permissions',
        });
        if (debug) {
          console.log('ファイル情報:', {
            shared: fileInfo.data.shared,
            permissions: fileInfo.data.permissions,
          });
        }
      } catch (infoError: any) {
        console.error('ファイル情報の取得に失敗しました:', infoError.message);
      }
    }

    // 画像URLを生成（Google Driveの画像表示用URL形式）
    // 参考: https://monomonotech.jp/kurage/memo/m23_0921_googledrive_picture_imgtag.html
    // 共有設定済みファイルは uc?export=view&id=ファイルID 形式で直接表示可能
    // fileIdを確実に含めるため、常にこの形式で生成
    const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    if (debug) {
      console.log('共有設定状態:', shareSuccess ? '成功' : '失敗（確認が必要）');
      console.log('webContentLink:', driveFile.data.webContentLink || '利用不可');
      console.log('webViewLink:', driveFile.data.webViewLink || '利用不可');
    }

    const responseData = {
      url: imageUrl,
      fileId: fileId,
      message: 'ファイルがアップロードされました。',
    };
    
    return NextResponse.json(responseData, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    console.error('Error details:', { message: error.message, code: error.code });
    
    // エラーの詳細を返す
    const errorMessage = error.message || 'Failed to upload file';
    const statusCode = error.response?.status || 500;
    const errorResponse = error.response?.data || error.errors;
    
    // OAuth認証エラーの場合、より詳細なメッセージを返す
    if (errorMessage.includes('OAuth 2.0認証情報') || errorMessage.includes('invalid_client')) {
      let details = 'OAuth 2.0認証情報を設定する必要があります。';
      
      if (errorMessage.includes('invalid_client')) {
        details += '\n\n原因: クライアントIDまたはクライアントシークレットが正しくない可能性があります。';
        details += '\n\n確認事項:';
        details += '\n1. Google Cloud ConsoleでOAuth 2.0認証情報が正しく作成されているか';
        details += '\n2. 環境変数 GOOGLE_DRIVE_CLIENT_ID と GOOGLE_DRIVE_CLIENT_SECRET が正しく設定されているか';
        details += '\n3. リダイレクトURIが Google Cloud Console で正しく設定されているか';
        details += '\n   （http://localhost:3000/oauth2callback が登録されているか）';
      } else {
        details += 'リフレッシュトークンの取得方法については、ドキュメントを参照してください。';
      }
      
      return NextResponse.json(
        {
          error: errorMessage,
          details: details,
          errorResponse: process.env.DEBUG_UPLOAD === '1' ? errorResponse : undefined,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorResponse || undefined,
      },
      { status: statusCode }
    );
  }
}
