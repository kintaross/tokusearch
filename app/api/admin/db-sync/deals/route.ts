import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Sheets → DB 同期は廃止済み。deals は DB を唯一の正とする運用に移行しています。
 * 一括投入は scripts/db/backfill-from-xlsx.ts を使用してください。
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'このエンドポイントは廃止されました。deals は DB 運用です。一括投入は scripts/db/backfill-from-xlsx.ts を使用してください。',
    },
    { status: 410 }
  );
}
