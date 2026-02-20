import { NextRequest, NextResponse } from 'next/server';
import {
  getColumnById,
  updateColumn,
  deleteColumn,
} from '@/lib/columns';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionValue } from '@/lib/admin-session';

function getAdminSessionFromRequest(request: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
  const value = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';
  return verifyAdminSessionValue({ value, secret });
}

// コラム取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = getAdminSessionFromRequest(request);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const column = await getColumnById(id);

  if (!column) {
    return NextResponse.json({ error: 'Column not found' }, { status: 404 });
  }

  return NextResponse.json(column);
}

// コラム更新
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = getAdminSessionFromRequest(request);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    // ステータスがpublishedに変更された場合、published_atを設定
    const updateData: any = { ...body };
    if (body.status === 'published' && !body.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const updatedColumn = await updateColumn(id, updateData);

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
  context: { params: Promise<{ id: string }> }
) {
  const session = getAdminSessionFromRequest(request);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const success = await deleteColumn(id);

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

