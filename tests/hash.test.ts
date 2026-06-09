import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { createHash } from 'node:crypto';

// ============================================================
// Re-implement file/text checksum logic from hash-generator.astro
// ============================================================

function computeHash(input: string, algorithm: 'md5' | 'sha256' | 'sha1' | 'sha512'): string {
  return createHash(algorithm).update(input).digest('hex');
}

function computeHashFromBuffer(input: Buffer, algorithm: 'md5' | 'sha256' | 'sha1' | 'sha512'): string {
  return createHash(algorithm).update(input).digest('hex');
}

// ============================================================
// Property 16: File checksum determinism
// ============================================================
describe('Hash - Property 16: File checksum determinism', () => {
  test('MD5 produces 32 hex characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (input) => {
          const hash = computeHash(input, 'md5');
          expect(hash.length).toBe(32);
          expect(hash).toMatch(/^[0-9a-f]{32}$/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('SHA-256 produces 64 hex characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (input) => {
          const hash = computeHash(input, 'sha256');
          expect(hash.length).toBe(64);
          expect(hash).toMatch(/^[0-9a-f]{64}$/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('SHA-1 produces 40 hex characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (input) => {
          const hash = computeHash(input, 'sha1');
          expect(hash.length).toBe(40);
          expect(hash).toMatch(/^[0-9a-f]{40}$/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('SHA-512 produces 128 hex characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (input) => {
          const hash = computeHash(input, 'sha512');
          expect(hash.length).toBe(128);
          expect(hash).toMatch(/^[0-9a-f]{128}$/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('same input always produces same MD5 output (determinism)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (input) => {
          const hash1 = computeHash(input, 'md5');
          const hash2 = computeHash(input, 'md5');
          expect(hash1).toBe(hash2);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('same input always produces same SHA-256 output (determinism)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (input) => {
          const hash1 = computeHash(input, 'sha256');
          const hash2 = computeHash(input, 'sha256');
          expect(hash1).toBe(hash2);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('different inputs produce different hashes (collision resistance)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (input1, input2) => {
          fc.pre(input1 !== input2);
          const hash1 = computeHash(input1, 'sha256');
          const hash2 = computeHash(input2, 'sha256');
          expect(hash1).not.toBe(hash2);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('binary buffer hashing is deterministic', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 1000 }),
        (bytes) => {
          const buffer = Buffer.from(bytes);
          const hash1 = computeHashFromBuffer(buffer, 'sha256');
          const hash2 = computeHashFromBuffer(buffer, 'sha256');
          expect(hash1).toBe(hash2);
          expect(hash1.length).toBe(64);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('different algorithms produce different outputs for same input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (input) => {
          const md5 = computeHash(input, 'md5');
          const sha256 = computeHash(input, 'sha256');
          const sha512 = computeHash(input, 'sha512');
          // Different lengths already guarantee difference, but verify explicitly
          expect(md5).not.toBe(sha256);
          expect(sha256).not.toBe(sha512);
          expect(md5).not.toBe(sha512);
        }
      ),
      { numRuns: 100 }
    );
  });
});
