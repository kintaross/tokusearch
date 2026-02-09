import { NextRequest, NextResponse } from 'next/server';
import { fetchDealById, updateDealById } from '@/lib/deals-data';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deal = await fetchDealById(params.id, { includePrivate: false });

    if (!deal) {
      return NextResponse.json(
        { error: 'お得情報が見つかりませんでした' },
        { status: 404 }
      );
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 更新不可フィールドを除外
    const {
      id,
      date,
      created_at,
      difficulty,
      usage_type,
      tags,
      category_sub,
      ...updates
    } = body;

    // Sheets/DB を更新（env で切替）
    await updateDealById(params.id, updates);

    return NextResponse.json({
      success: true,
      message: 'お得情報を更新しました',
    });
  } catch (error) {
    console.error('更新エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新に失敗しました' },
      { status: 500 }
    );
  }
}

