import { NextRequest } from 'next/server';

/**
 * Get API key from request: x-api-key header, or Authorization: Bearer <key>.
 * Trims whitespace so n8n/network quirks don't break auth.
 */
export function getIngestApiKey(request: NextRequest): string {
  const fromHeader = (request.headers.get('x-api-key') ?? '').trim();
  if (fromHeader) return fromHeader;
  const auth = (request.headers.get('authorization') ?? '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return '';
}

export function isIngestAuthorized(request: NextRequest): boolean {
  const received = getIngestApiKey(request);
  const expected = (process.env.N8N_API_KEY ?? process.env.N8N_INGEST_API_KEY ?? '').trim();
  return expected.length > 0 && received === expected;
}
