import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { createHmac } from 'node:crypto';

// ============================================================
// Re-implement core JWT algorithms from jwt-decoder.astro
// ============================================================

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function hmacSha256Sign(message: string, secret: string): string {
  const sig = createHmac('sha256', secret).update(message).digest('base64');
  return sig
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createJwt(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;
  const signature = hmacSha256Sign(dataToSign, secret);
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

function verifyJwt(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [headerB64, payloadB64, signatureB64] = parts;
  const dataToSign = `${headerB64}.${payloadB64}`;
  const expectedSignature = hmacSha256Sign(dataToSign, secret);
  return expectedSignature === signatureB64;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

// ============================================================
// Property 5: JWT sign/verify round-trip
// ============================================================
describe('JWT - Property 5: JWT sign/verify round-trip', () => {
  test('sign with key → verify with same key = valid', () => {
    fc.assert(
      fc.property(
        fc.record({
          sub: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          admin: fc.boolean(),
          iat: fc.integer({ min: 1000000000, max: 2000000000 }),
        }),
        fc.string({ minLength: 1, maxLength: 256 }),
        (payload, secret) => {
          const token = createJwt(payload, secret);
          expect(verifyJwt(token, secret)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('sign with key → verify with different key = invalid', () => {
    fc.assert(
      fc.property(
        fc.record({
          sub: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        fc.string({ minLength: 1, maxLength: 128 }),
        fc.string({ minLength: 1, maxLength: 128 }),
        (payload, secret1, secret2) => {
          fc.pre(secret1 !== secret2);
          const token = createJwt(payload, secret1);
          expect(verifyJwt(token, secret2)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('payload round-trip preserves data', () => {
    fc.assert(
      fc.property(
        fc.record({
          sub: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          admin: fc.boolean(),
          iat: fc.integer({ min: 1000000000, max: 2000000000 }),
          exp: fc.integer({ min: 2000000000, max: 3000000000 }),
        }),
        fc.string({ minLength: 1, maxLength: 128 }),
        (payload, secret) => {
          const token = createJwt(payload, secret);
          const decoded = decodeJwtPayload(token);
          expect(decoded).not.toBeNull();
          expect(decoded!.sub).toBe(payload.sub);
          expect(decoded!.name).toBe(payload.name);
          expect(decoded!.admin).toBe(payload.admin);
          expect(decoded!.iat).toBe(payload.iat);
          expect(decoded!.exp).toBe(payload.exp);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('JWT has exactly 3 dot-separated segments', () => {
    fc.assert(
      fc.property(
        fc.record({
          sub: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        fc.string({ minLength: 1, maxLength: 64 }),
        (payload, secret) => {
          const token = createJwt(payload, secret);
          const parts = token.split('.');
          expect(parts.length).toBe(3);
          // Each part is valid base64url
          for (const part of parts) {
            expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('header always contains alg=HS256 and typ=JWT', () => {
    fc.assert(
      fc.property(
        fc.record({ sub: fc.string({ minLength: 1, maxLength: 20 }) }),
        fc.string({ minLength: 1, maxLength: 64 }),
        (payload, secret) => {
          const token = createJwt(payload, secret);
          const headerStr = base64UrlDecode(token.split('.')[0]);
          const header = JSON.parse(headerStr);
          expect(header.alg).toBe('HS256');
          expect(header.typ).toBe('JWT');
        }
      ),
      { numRuns: 100 }
    );
  });
});
