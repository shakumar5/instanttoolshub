import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement regex pattern library link logic from regex-patterns.astro
// ============================================================

/**
 * Build a link to the regex tester with a pattern URI-encoded in the query string.
 * Based on: href="/regex-tester?pattern=${encodeURIComponent(p.pattern)}"
 */
function buildPatternLink(pattern: string): string {
  return `/regex-tester?pattern=${encodeURIComponent(pattern)}`;
}

/**
 * Extract the pattern from a regex tester link by decoding the query parameter.
 */
function extractPatternFromLink(href: string): string | null {
  const match = href.match(/\/regex-tester\?pattern=(.*)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

// ============================================================
// Property 23: Pattern library link round-trip
// ============================================================
describe('Regex Links - Property 23: Pattern library link round-trip', () => {
  test('encode → decode produces original pattern', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (pattern) => {
          const link = buildPatternLink(pattern);
          const extracted = extractPatternFromLink(link);
          expect(extracted).toBe(pattern);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('href starts with /regex-tester?pattern=', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (pattern) => {
          const link = buildPatternLink(pattern);
          expect(link).toMatch(/^\/regex-tester\?pattern=/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('special regex characters are properly encoded', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '^\\d{3}-\\d{4}$',
          '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
          '(?:https?://)?(?:www\\.)?([^/]+)',
          '\\b\\w+\\b',
          '(foo|bar|baz){1,3}',
          '[^\\s]+',
          '\\d+\\.\\d+\\.\\d+\\.\\d+'
        ),
        (pattern) => {
          const link = buildPatternLink(pattern);
          const extracted = extractPatternFromLink(link);
          expect(extracted).toBe(pattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unicode patterns survive encoding round-trip', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (pattern) => {
          const link = buildPatternLink(pattern);
          const extracted = extractPatternFromLink(link);
          expect(extracted).toBe(pattern);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('patterns with URL-unsafe characters are encoded', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'foo&bar=baz',
          'hello world',
          'test?query#fragment',
          'path/to/thing',
          'special%chars',
          'plus+sign'
        ),
        (pattern) => {
          const link = buildPatternLink(pattern);
          // The part after ?pattern= should not contain raw & ? # or spaces
          const encodedPart = link.substring('/regex-tester?pattern='.length);
          expect(encodedPart).not.toMatch(/[ &#]/);
          // But round-trip should work
          const extracted = extractPatternFromLink(link);
          expect(extracted).toBe(pattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('empty pattern produces valid link', () => {
    const link = buildPatternLink('');
    expect(link).toBe('/regex-tester?pattern=');
    const extracted = extractPatternFromLink(link);
    expect(extracted).toBe('');
  });

  test('encodeURIComponent is idempotent for safe chars', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_.~-]+$/.test(s)),
        (safePattern) => {
          const link = buildPatternLink(safePattern);
          // For URL-safe characters, the encoded version equals the original
          expect(link).toBe(`/regex-tester?pattern=${safePattern}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
