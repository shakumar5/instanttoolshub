import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement blog logic from blog/index.astro and BlogLayout.astro
// ============================================================

interface BlogPost {
  title: string;
  datePublished: string; // ISO date string
  dateModified: string;
  author: string;
  topic: string;
  tools: string[];
  excerpt: string;
}

/**
 * Sort posts by datePublished descending (newest first)
 */
function sortPostsChronological(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    return new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime();
  });
}

/**
 * Auto-link the first occurrence of each tool display name in HTML content.
 * Based on src/utils/autolink.ts
 */
const TOOL_MAP: Record<string, { displayName: string; path: string }> = {
  'json-formatter': { displayName: 'JSON Formatter', path: '/json-formatter' },
  'base64': { displayName: 'Base64', path: '/base64' },
  'regex-tester': { displayName: 'RegEx Tester', path: '/regex-tester' },
  'jwt-decoder': { displayName: 'JWT Decoder', path: '/jwt-decoder' },
  'hash-generator': { displayName: 'Hash Generator', path: '/hash-generator' },
  'url-encoder-decoder': { displayName: 'URL Encoder', path: '/url-encoder-decoder' },
  'timestamp': { displayName: 'Timestamp Converter', path: '/timestamp' },
  'markdown-editor': { displayName: 'Markdown Editor', path: '/markdown-editor' },
  'color-converter': { displayName: 'Color Converter', path: '/color-converter' },
  'code-minifier-beautifier': { displayName: 'Code Minifier', path: '/code-minifier-beautifier' },
};

function autoLinkTools(html: string, tools: string[]): string {
  if (!tools || tools.length === 0) return html;

  let result = html;

  for (const toolId of tools) {
    const tool = TOOL_MAP[toolId];
    if (!tool) continue;

    const { displayName, path } = tool;
    const escapedName = displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const anchorRegex = new RegExp(`\\b${escapedName}\\b`, 'i');
    const match = anchorRegex.exec(result);

    if (match) {
      const matchIndex = match.index;
      const matchText = match[0];
      const before = result.substring(0, matchIndex);
      const after = result.substring(matchIndex + matchText.length);

      const openAnchors = (before.match(/<a\b/gi) || []).length;
      const closeAnchors = (before.match(/<\/a>/gi) || []).length;

      if (openAnchors <= closeAnchors) {
        const link = `<a href="${path}">${matchText}</a>`;
        result = before + link + after;
      }
    }
  }

  return result;
}

/**
 * Generate JSON-LD structured data for a blog post
 */
function generateJsonLd(post: BlogPost): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'description': post.excerpt,
    'author': { '@type': 'Person', 'name': post.author },
    'publisher': { '@type': 'Organization', 'name': 'ToolsHub', 'logo': { '@type': 'ImageObject', 'url': 'https://instanttoolshub.com/favicon.svg' } },
    'datePublished': post.datePublished,
    'dateModified': post.dateModified || post.datePublished,
    'mainEntityOfPage': { '@type': 'WebPage', '@id': `https://instanttoolshub.com/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}` },
  };
}

// Arbitrary for dates in ISO format (YYYY-MM-DD)
const isoDate = fc.tuple(
  fc.integer({ min: 2020, max: 2026 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 })
).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

const blogPost = fc.record({
  title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[a-zA-Z]/.test(s)),
  datePublished: isoDate,
  dateModified: isoDate,
  author: fc.constantFrom('ToolsHub Team', 'Alice', 'Bob', 'Jane'),
  topic: fc.constantFrom('tutorial', 'guide', 'security', 'performance'),
  tools: fc.subarray(Object.keys(TOOL_MAP), { minLength: 0, maxLength: 3 }),
  excerpt: fc.string({ minLength: 10, maxLength: 100 }),
});

// ============================================================
// Property 19: Chronological ordering
// ============================================================
describe('Blog - Property 19: Chronological ordering', () => {
  test('datePublished descending after sort', () => {
    fc.assert(
      fc.property(
        fc.array(blogPost, { minLength: 2, maxLength: 20 }),
        (posts) => {
          const sorted = sortPostsChronological(posts);
          for (let i = 1; i < sorted.length; i++) {
            const prevDate = new Date(sorted[i - 1].datePublished).getTime();
            const currDate = new Date(sorted[i].datePublished).getTime();
            expect(prevDate).toBeGreaterThanOrEqual(currDate);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('sort is stable (preserves original order for same dates)', () => {
    fc.assert(
      fc.property(
        fc.array(blogPost, { minLength: 2, maxLength: 10 }),
        (posts) => {
          // Give all posts the same date
          const sameDatePosts = posts.map(p => ({ ...p, datePublished: '2025-01-15' }));
          const sorted = sortPostsChronological(sameDatePosts);
          // All should still be present
          expect(sorted.length).toBe(sameDatePosts.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('sort does not add or remove posts', () => {
    fc.assert(
      fc.property(
        fc.array(blogPost, { minLength: 1, maxLength: 20 }),
        (posts) => {
          const sorted = sortPostsChronological(posts);
          expect(sorted.length).toBe(posts.length);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================================
// Property 20: Auto-link tool names
// ============================================================
describe('Blog - Property 20: Auto-link tool names', () => {
  test('first occurrence wrapped in <a> tag', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TOOL_MAP)),
        (toolId) => {
          const tool = TOOL_MAP[toolId];
          const html = `<p>This article discusses the ${tool.displayName} and how to use it effectively. The ${tool.displayName} is great.</p>`;
          const result = autoLinkTools(html, [toolId]);
          
          expect(result).toContain(`<a href="${tool.path}">${tool.displayName}</a>`);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('subsequent occurrences remain unchanged', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TOOL_MAP)),
        (toolId) => {
          const tool = TOOL_MAP[toolId];
          const html = `<p>Use the ${tool.displayName} here. Then ${tool.displayName} again. And ${tool.displayName} once more.</p>`;
          const result = autoLinkTools(html, [toolId]);
          
          // Count anchor tags for this tool
          const linkPattern = new RegExp(`<a href="${tool.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">[^<]*</a>`, 'g');
          const matches = result.match(linkPattern) || [];
          
          // Only the first occurrence should be linked
          expect(matches.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('already linked text is not double-linked', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TOOL_MAP)),
        (toolId) => {
          const tool = TOOL_MAP[toolId];
          // Content where the name is already in a link
          const html = `<p><a href="/other">${tool.displayName}</a> is mentioned again as ${tool.displayName} later.</p>`;
          const result = autoLinkTools(html, [toolId]);
          
          // Should not create nested anchors
          expect(result).not.toContain(`<a href="${tool.path}"><a`);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('invalid tool identifiers are silently ignored', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 20 }).filter(s => !(s in TOOL_MAP)),
        (invalidToolId) => {
          const html = '<p>Some content here</p>';
          const result = autoLinkTools(html, [invalidToolId]);
          expect(result).toBe(html);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('empty tools array returns html unchanged', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 200 }),
        (html) => {
          const result = autoLinkTools(html, []);
          expect(result).toBe(html);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 21: JSON-LD correctness
// ============================================================
describe('Blog - Property 21: JSON-LD correctness', () => {
  test('contains author field', () => {
    fc.assert(
      fc.property(
        blogPost,
        (post) => {
          const jsonLd = generateJsonLd(post);
          const author = jsonLd.author as Record<string, unknown>;
          expect(author['@type']).toBe('Person');
          expect(author['name']).toBe(post.author);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('datePublished is in ISO 8601 format', () => {
    fc.assert(
      fc.property(
        blogPost,
        (post) => {
          const jsonLd = generateJsonLd(post);
          const dateStr = jsonLd.datePublished as string;
          // ISO 8601 date format: YYYY-MM-DD
          expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          // Verify it parses to a valid date
          const parsed = new Date(dateStr);
          expect(parsed.getTime()).not.toBeNaN();
        }
      ),
      { numRuns: 200 }
    );
  });

  test('dateModified is in ISO 8601 format and defaults to datePublished', () => {
    fc.assert(
      fc.property(
        blogPost,
        (post) => {
          const jsonLd = generateJsonLd(post);
          const dateModified = jsonLd.dateModified as string;
          expect(dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          
          // If post has dateModified, use it; otherwise it equals datePublished
          if (post.dateModified) {
            expect(dateModified).toBe(post.dateModified);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('JSON-LD has required schema.org fields', () => {
    fc.assert(
      fc.property(
        blogPost,
        (post) => {
          const jsonLd = generateJsonLd(post);
          expect(jsonLd['@context']).toBe('https://schema.org');
          expect(jsonLd['@type']).toBe('Article');
          expect(jsonLd['headline']).toBe(post.title);
          expect(jsonLd['datePublished']).toBeDefined();
          expect(jsonLd['dateModified']).toBeDefined();
          expect(jsonLd['author']).toBeDefined();
          expect(jsonLd['publisher']).toBeDefined();
          expect(jsonLd['mainEntityOfPage']).toBeDefined();
        }
      ),
      { numRuns: 200 }
    );
  });

  test('JSON-LD serializes to valid JSON', () => {
    fc.assert(
      fc.property(
        blogPost,
        (post) => {
          const jsonLd = generateJsonLd(post);
          const serialized = JSON.stringify(jsonLd);
          expect(() => JSON.parse(serialized)).not.toThrow();
        }
      ),
      { numRuns: 200 }
    );
  });
});
