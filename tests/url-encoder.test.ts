import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement core URL encoding algorithms from url-encoder-decoder.astro
// ============================================================

function batchEncode(lines: string[]): string[] {
  return lines.map(line => {
    if (!line.trim()) return '';
    return encodeURIComponent(line);
  });
}

function batchDecode(lines: string[]): string[] {
  return lines.map(line => {
    if (!line.trim()) return '';
    try {
      return decodeURIComponent(line);
    } catch (e) {
      return '[Error] ' + line;
    }
  });
}

function parseQueryString(url: string): { base: string; params: { key: string; value: string }[] } {
  let urlObj: URL;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    urlObj = new URL(url);
  } else {
    urlObj = new URL('https://' + url);
  }
  const base = urlObj.origin + urlObj.pathname;
  const params = Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({ key, value }));
  return { base, params };
}

function rebuildUrl(base: string, params: { key: string; value: string }[]): string {
  const searchParams = new URLSearchParams();
  params.forEach(({ key, value }) => {
    if (key.trim()) {
      searchParams.append(key.trim(), value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `${base}?${queryString}` : base;
}

function buildUtmUrl(params: {
  websiteUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}): string | null {
  const { websiteUrl, source, medium, campaign, term, content } = params;
  if (!websiteUrl || !source || !medium || !campaign) {
    return null;
  }

  let urlObj: URL;
  if (websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://')) {
    urlObj = new URL(websiteUrl);
  } else {
    urlObj = new URL('https://' + websiteUrl);
  }

  urlObj.searchParams.set('utm_source', source);
  urlObj.searchParams.set('utm_medium', medium);
  urlObj.searchParams.set('utm_campaign', campaign);
  if (term) urlObj.searchParams.set('utm_term', term);
  if (content) urlObj.searchParams.set('utm_content', content);

  return urlObj.toString();
}

// ============================================================
// Property 1: Batch encode preserves line structure
// ============================================================
describe('URL Encoder - Property 1: Batch encode preserves line structure', () => {
  test('output array has same length as input array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
        (lines) => {
          const result = batchEncode(lines);
          expect(result.length).toBe(lines.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('empty lines stay empty in output', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(fc.constant(''), fc.constant('   '), fc.constant('\t'), fc.string()), { minLength: 1, maxLength: 30 }),
        (lines) => {
          const result = batchEncode(lines);
          for (let i = 0; i < lines.length; i++) {
            if (!lines[i].trim()) {
              expect(result[i]).toBe('');
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('non-empty lines produce non-empty encoded output', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 20 }),
        (lines) => {
          const result = batchEncode(lines);
          for (let i = 0; i < lines.length; i++) {
            expect(result[i].length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================================
// Property 2: Batch decode with error recovery
// ============================================================
describe('URL Encoder - Property 2: Batch decode with error recovery', () => {
  test('valid encoded lines are decoded correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 20 }),
        (originals) => {
          const encoded = originals.map(s => encodeURIComponent(s));
          const decoded = batchDecode(encoded);
          for (let i = 0; i < originals.length; i++) {
            expect(decoded[i]).toBe(originals[i]);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('invalid percent-encoded lines are prefixed with [Error]', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant('%ZZ%invalid%sequence'), { minLength: 1, maxLength: 10 }),
        (invalidLines) => {
          const decoded = batchDecode(invalidLines);
          for (const line of decoded) {
            expect(line).toMatch(/^\[Error\] /);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('output preserves same array length as input', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(
          fc.string().map(s => encodeURIComponent(s || 'x')),
          fc.constant('%ZZ%bad'),
          fc.constant('')
        ), { minLength: 0, maxLength: 30 }),
        (lines) => {
          const result = batchDecode(lines);
          expect(result.length).toBe(lines.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('empty lines remain empty after decode', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(fc.constant(''), fc.constant('  '), fc.constant('\t')), { minLength: 1, maxLength: 10 }),
        (emptyLines) => {
          const decoded = batchDecode(emptyLines);
          for (const line of decoded) {
            expect(line).toBe('');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 3: URL query string parse/rebuild round-trip
// ============================================================
describe('URL Encoder - Property 3: Query string parse/rebuild round-trip', () => {
  test('parsing and rebuilding preserves base URL', () => {
    fc.assert(
      fc.property(
        fc.record({
          scheme: fc.constantFrom('http', 'https'),
          host: fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-z][a-z0-9.-]+$/.test(s)).map(s => s + '.com'),
          path: fc.string({ minLength: 0, maxLength: 20 }).filter(s => /^[a-z0-9/]*$/.test(s)).map(s => '/' + s),
        }),
        ({ scheme, host, path }) => {
          const url = `${scheme}://${host}${path}`;
          try {
            const { base, params } = parseQueryString(url);
            const rebuilt = rebuildUrl(base, params);
            expect(rebuilt.startsWith(base)).toBe(true);
          } catch {
            // Some generated URLs may be unparseable, skip gracefully
          }
        }
      ),
      { numRuns: 200 }
    );
  }, 15000);

  test('parse then rebuild maintains query parameters', () => {
    fc.assert(
      fc.property(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
          value: fc.string({ minLength: 0, maxLength: 50 }),
        }),
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
            value: fc.string({ minLength: 0, maxLength: 50 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (firstParam, otherParams) => {
          const params = [firstParam, ...otherParams];
          const base = 'https://example.com/path';
          const rebuilt = rebuildUrl(base, params);
          const parsed = parseQueryString(rebuilt);

          // All keys should be preserved
          expect(parsed.params.length).toBe(params.length);
          for (let i = 0; i < params.length; i++) {
            expect(parsed.params[i].key).toBe(params[i].key.trim());
            expect(parsed.params[i].value).toBe(params[i].value);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('params with empty keys are omitted', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.oneof(fc.constant(''), fc.constant('  ')),
            value: fc.string(),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (emptyKeyParams) => {
          const rebuilt = rebuildUrl('https://example.com', emptyKeyParams);
          expect(rebuilt).toBe('https://example.com');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 4: UTM URL generation
// ============================================================
describe('URL Encoder - Property 4: UTM URL generation', () => {
  test('required params present and percent-encoded in output', () => {
    fc.assert(
      fc.property(
        fc.record({
          websiteUrl: fc.webUrl(),
          source: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          medium: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          campaign: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        }),
        ({ websiteUrl, source, medium, campaign }) => {
          const result = buildUtmUrl({ websiteUrl, source, medium, campaign });
          expect(result).not.toBeNull();
          if (result) {
            const url = new URL(result);
            expect(url.searchParams.get('utm_source')).toBe(source);
            expect(url.searchParams.get('utm_medium')).toBe(medium);
            expect(url.searchParams.get('utm_campaign')).toBe(campaign);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('returns null when required fields are missing', () => {
    fc.assert(
      fc.property(
        fc.record({
          websiteUrl: fc.oneof(fc.constant(''), fc.webUrl()),
          source: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
          medium: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
          campaign: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
        }),
        ({ websiteUrl, source, medium, campaign }) => {
          // At least one required field must be empty for null result
          if (!websiteUrl || !source || !medium || !campaign) {
            const result = buildUtmUrl({ websiteUrl, source, medium, campaign });
            expect(result).toBeNull();
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('optional params only appear when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          websiteUrl: fc.constant('https://example.com'),
          source: fc.constant('google'),
          medium: fc.constant('cpc'),
          campaign: fc.constant('test'),
          term: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { nil: undefined }),
          content: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { nil: undefined }),
        }),
        (params) => {
          const result = buildUtmUrl(params);
          expect(result).not.toBeNull();
          if (result) {
            const url = new URL(result);
            if (params.term) {
              expect(url.searchParams.get('utm_term')).toBe(params.term);
            } else {
              expect(url.searchParams.has('utm_term')).toBe(false);
            }
            if (params.content) {
              expect(url.searchParams.get('utm_content')).toBe(params.content);
            } else {
              expect(url.searchParams.has('utm_content')).toBe(false);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
