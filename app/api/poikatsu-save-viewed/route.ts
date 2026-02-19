import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * サーバー側の閲覧保存は廃止しました。クライアントの localStorage のみで運用してください。
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'サーバー側の閲覧保存は廃止されました。閲覧履歴はブラウザの localStorage で保存されます。',
    },
    { status: 410 }
  );
}
