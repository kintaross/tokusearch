import crypto from 'crypto';
import type { AdminUser } from '@/types/column';

export const ADMIN_SESSION_COOKIE = 'toku_admin_session';

type AdminRole = 'admin' | 'editor';

export type AdminSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    username: string;
  };
  iat: number;
  exp: number;
};

type AdminSessionPayloadV1 = {
  v: 'v1';
  sub: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  iat: number;
  exp: number;
};

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function base64urlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecodeToBuffer(input: string): Buffer {
  const s = String(input ?? '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, 'base64');
}

function sign(data: string, secret: string): Buffer {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest();
}

export function createAdminSessionValue(args: {
  user: AdminUser;
  secret: string;
  nowMs?: number;
  ttlSeconds?: number;
}): string {
  const { user, secret } = args;
  const nowMs = args.nowMs ?? Date.now();
  const ttlSeconds = args.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  if (!secret) {
    throw new Error('ADMIN session secret is missing');
  }

  const iat = Math.floor(nowMs / 1000);
  const exp = iat + ttlSeconds;

  const payload: AdminSessionPayloadV1 = {
    v: 'v1',
    sub: user.id,
    username: user.username,
    name: user.display_name,
    email: user.email,
    role: user.role,
    iat,
    exp,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64urlEncode(payloadJson);
  const sig = sign(payloadB64, secret);
  const sigB64 = base64urlEncode(sig);

  return `${payloadB64}.${sigB64}`;
}

export function verifyAdminSessionValue(args: {
  value: string;
  secret: string;
  nowMs?: number;
}): AdminSession | null {
  const { value, secret } = args;
  const nowMs = args.nowMs ?? Date.now();

  if (!secret) return null;
  const raw = String(value ?? '');
  const parts = raw.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  let payloadBuf: Buffer;
  let sigBuf: Buffer;
  try {
    payloadBuf = base64urlDecodeToBuffer(payloadB64);
    sigBuf = base64urlDecodeToBuffer(sigB64);
  } catch {
    return null;
  }

  const expectedSig = sign(payloadB64, secret);
  if (sigBuf.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedSig)) return null;

  let payload: AdminSessionPayloadV1;
  try {
    payload = JSON.parse(payloadBuf.toString('utf8'));
  } catch {
    return null;
  }

  if (payload?.v !== 'v1') return null;
  if (!payload.sub || !payload.name || !payload.email || !payload.username) return null;
  if (payload.role !== 'admin' && payload.role !== 'editor') return null;

  const nowSec = Math.floor(nowMs / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return null;
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 60) return null; // allow small clock skew

  return {
    user: {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      username: payload.username,
    },
    iat: payload.iat,
    exp: payload.exp,
  };
}

