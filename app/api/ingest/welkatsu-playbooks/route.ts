import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { upsertWelkatsuPlaybooks, type WelkatsuPlaybookIngestItem } from '@/lib/db-welkatsu-playbooks';
import { isIngestAuthorized } from '@/lib/ingest-auth';
import type { WelkatsuPlaybookContentJson } from '@/types/welkatsu-playbook';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type IngestBody =
  | WelkatsuPlaybookIngestItem
  | WelkatsuPlaybookIngestItem[]
  | { items: WelkatsuPlaybookIngestItem[] };

function normalizeToArray(body: IngestBody): WelkatsuPlaybookIngestItem[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object' && 'items' in body && Array.isArray((body as any).items)) {
    return (body as any).items;
  }
  return [body as WelkatsuPlaybookIngestItem];
}

function isValidMonth(s: string): boolean {
  return /^\d{4}-\d{2}$/.test(s);
}

function validateContentJson(c: unknown): c is WelkatsuPlaybookContentJson {
  if (c == null || typeof c !== 'object') return false;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    if (!isIngestAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as IngestBody;
    const items = normalizeToArray(body);

    if (items.length === 0) {
      return NextResponse.json({ error: 'No playbooks provided' }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ error: 'Too many playbooks (max 50)' }, { status: 400 });
    }

    const invalid: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it?.month || !isValidMonth(it.month)) invalid.push(`items[${i}].month (YYYY-MM required)`);
      if (!it?.title || typeof it.title !== 'string') invalid.push(`items[${i}].title required`);
      if (!validateContentJson(it?.content_json)) invalid.push(`items[${i}].content_json required (object)`);
    }
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: invalid },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const { upserted } = await upsertWelkatsuPlaybooks(pool, items);

    return NextResponse.json({ success: true, received: items.length, upserted });
  } catch (error: any) {
    console.error('Ingest welkatsu-playbooks error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to ingest welkatsu playbooks' },
      { status: 500 }
    );
  }
}
