import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getColumnById,
  updateColumn,
  deleteColumn,
} from '@/lib/columns';

// コラム取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const column = await getColumnById(params.id);

  if (!column) {
    return NextResponse.json({ error: 'Column not found' }, { status: 404 });
  }

  return NextResponse.json(column);
}

// コラム更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // ステータスがpublishedに変更された場合、published_atを設定
    const updateData: any = { ...body };
    if (body.status === 'published' && !body.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const updatedColumn = await updateColumn(params.id, updateData);

    if (!updatedColumn) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    return NextResponse.json(updatedColumn);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update column' },
      { status: 500 }
    );
  }
}

// コラム削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await deleteColumn(params.id);

    if (!success) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Column deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete column' },
      { status: 500 }
    );
  }
}

