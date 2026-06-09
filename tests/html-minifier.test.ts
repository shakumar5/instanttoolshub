import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement HTML minification/beautification from code-minifier-beautifier.astro
// ============================================================

function minifyHTML(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')     // Strip HTML comments
    .replace(/\s+/g, ' ')               // Collapse consecutive whitespace into single space
    .replace(/>\s+</g, '><')            // Remove whitespace between adjacent closing/opening tags
    .trim();
}

function beautifyHTML(html: string): string {
  // First minify to normalize whitespace
  let clean = minifyHTML(html);
  let formatted = '';
  let indent = 0;

  // Void elements that don't increase indent depth
  const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link'];

  // Split into tags and text content
  const tokens = clean.split(/(<\/?[^>]+>)/g);

  tokens.forEach(token => {
    if (!token.trim()) return;

    if (token.startsWith('</')) {
      // Closing tag - decrease indent first, then print
      indent = Math.max(0, indent - 1);
      formatted += '  '.repeat(indent) + token + '\n';
    } else if (token.startsWith('<')) {
      // Check if it's a void element or self-closing tag
      const tagName = token.match(/<([^\s>/]+)/)?.[1]?.toLowerCase() || '';
      const isSelfClose = token.endsWith('/>');
      const isVoid = voidElements.includes(tagName);
      const isDoctype = token.startsWith('<!');

      if (isDoctype) {
        formatted += '  '.repeat(indent) + token + '\n';
      } else if (isSelfClose || isVoid) {
        formatted += '  '.repeat(indent) + token + '\n';
      } else {
        formatted += '  '.repeat(indent) + token + '\n';
        indent++;
      }
    } else {
      // Text content
      const trimmed = token.trim();
      if (trimmed) {
        formatted += '  '.repeat(indent) + trimmed + '\n';
      }
    }
  });

  return formatted.trim();
}

// Helper to calculate savings
function calculateSavings(original: string, minified: string): number {
  if (original.length === 0) return 0;
  return ((original.length - minified.length) / original.length) * 100;
}

// Arbitraries for generating HTML-like content
const htmlTag = fc.constantFrom('div', 'span', 'p', 'section', 'article', 'main', 'header', 'footer', 'nav', 'ul', 'li', 'h1', 'h2', 'h3');
const voidTag = fc.constantFrom('img', 'input', 'br', 'hr', 'meta', 'link');
const textContent = fc.string({ minLength: 0, maxLength: 30 }).map(s => s.replace(/[<>&]/g, ''));

function genSimpleHtml(): fc.Arbitrary<string> {
  return fc.tuple(htmlTag, textContent).map(([tag, text]) =>
    `<${tag}>${text}</${tag}>`
  );
}

function genHtmlWithComments(): fc.Arbitrary<string> {
  return fc.tuple(
    textContent,
    genSimpleHtml(),
    textContent
  ).map(([comment, html, comment2]) =>
    `<!-- ${comment} -->${html}<!-- ${comment2} -->`
  );
}

function genHtmlWithWhitespace(): fc.Arbitrary<string> {
  return fc.tuple(htmlTag, htmlTag, textContent).map(([tag1, tag2, text]) =>
    `<${tag1}>   \n  <${tag2}>  ${text}  </${tag2}>  \n  </${tag1}>`
  );
}

// ============================================================
// Property 6: HTML minification invariants
// ============================================================
describe('HTML Minifier - Property 6: Minification invariants', () => {
  test('no HTML comments remain after minification', () => {
    fc.assert(
      fc.property(
        genHtmlWithComments(),
        (html) => {
          const minified = minifyHTML(html);
          expect(minified).not.toMatch(/<!--[\s\S]*?-->/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('no consecutive whitespace in minified output', () => {
    fc.assert(
      fc.property(
        genHtmlWithWhitespace(),
        (html) => {
          const minified = minifyHTML(html);
          // After minification, there should be no runs of 2+ whitespace chars
          expect(minified).not.toMatch(/\s{2,}/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('no whitespace between >< in minified output', () => {
    fc.assert(
      fc.property(
        genHtmlWithWhitespace(),
        (html) => {
          const minified = minifyHTML(html);
          expect(minified).not.toMatch(/>\s+</);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('minified output is always shorter than or equal to original', () => {
    fc.assert(
      fc.property(
        fc.oneof(genHtmlWithComments(), genHtmlWithWhitespace(), genSimpleHtml()),
        (html) => {
          const minified = minifyHTML(html);
          expect(minified.length).toBeLessThanOrEqual(html.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('tag structure is preserved (opening and closing tags remain)', () => {
    fc.assert(
      fc.property(
        htmlTag,
        textContent,
        (tag, text) => {
          const html = `<${tag}>${text}</${tag}>`;
          const minified = minifyHTML(html);
          expect(minified).toContain(`<${tag}>`);
          expect(minified).toContain(`</${tag}>`);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================================
// Property 7: HTML beautify indentation
// ============================================================
describe('HTML Minifier - Property 7: Beautify indentation', () => {
  test('each tag appears on its own line', () => {
    fc.assert(
      fc.property(
        genHtmlWithWhitespace(),
        (html) => {
          const beautified = beautifyHTML(html);
          const lines = beautified.split('\n').filter(l => l.trim());
          // Each line should contain at most one tag opening or one tag closing
          for (const line of lines) {
            const tagMatches = line.match(/<\/?[^>]+>/g) || [];
            expect(tagMatches.length).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('uses 2-space indentation', () => {
    fc.assert(
      fc.property(
        htmlTag,
        textContent.filter(t => t.trim().length > 0),
        (tag, text) => {
          const html = `<div><${tag}>${text}</${tag}></div>`;
          const beautified = beautifyHTML(html);
          const lines = beautified.split('\n');
          // Lines with nested content should use 2-space increments
          for (const line of lines) {
            const leadingSpaces = line.match(/^( *)/)?.[1]?.length || 0;
            expect(leadingSpaces % 2).toBe(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('void elements do not increase depth', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('img', 'input', 'br', 'hr'),
        fc.constantFrom('div', 'section', 'main', 'article'),
        fc.string({ minLength: 1, maxLength: 10 }).filter(t => /^[a-zA-Z0-9]+$/.test(t)),
        (voidEl, containerTag, text) => {
          // Use 'span' as the sibling tag to avoid collision with container
          const html = `<${containerTag}><${voidEl}><span>${text}</span></${containerTag}>`;
          const beautified = beautifyHTML(html);
          const lines = beautified.split('\n').filter(l => l.trim());

          // Find the void element line and the <span> tag line
          const voidLineIdx = lines.findIndex(l => l.trim().startsWith(`<${voidEl}`));
          const spanLineIdx = lines.findIndex(l => l.trim().startsWith('<span>'));

          if (voidLineIdx >= 0 && spanLineIdx >= 0) {
            const voidIndent = lines[voidLineIdx].match(/^( *)/)?.[1]?.length || 0;
            const spanIndent = lines[spanLineIdx].match(/^( *)/)?.[1]?.length || 0;
            // Both should be at the same indent level (children of container)
            expect(spanIndent).toBe(voidIndent);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================================
// Property 8: Batch file per-file correctness (savings calculation)
// ============================================================
describe('HTML Minifier - Property 8: Batch file savings calculation', () => {
  test('savings percentage is calculated correctly', () => {
    fc.assert(
      fc.property(
        fc.oneof(genHtmlWithComments(), genHtmlWithWhitespace()),
        (html) => {
          const minified = minifyHTML(html);
          const savings = calculateSavings(html, minified);
          
          // Savings should be between 0 and 100
          expect(savings).toBeGreaterThanOrEqual(0);
          expect(savings).toBeLessThanOrEqual(100);
          
          // Manual check: savings = (original - minified) / original * 100
          const expectedSavings = ((html.length - minified.length) / html.length) * 100;
          expect(savings).toBeCloseTo(expectedSavings, 5);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('empty input has zero savings', () => {
    const savings = calculateSavings('', '');
    expect(savings).toBe(0);
  });

  test('savings is non-negative for valid HTML with comments/whitespace', () => {
    fc.assert(
      fc.property(
        genHtmlWithComments(),
        (html) => {
          const minified = minifyHTML(html);
          const savings = calculateSavings(html, minified);
          expect(savings).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('batch of files each processed independently', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(genHtmlWithComments(), genHtmlWithWhitespace()), { minLength: 1, maxLength: 10 }),
        (files) => {
          const results = files.map(file => ({
            original: file,
            minified: minifyHTML(file),
            savings: calculateSavings(file, minifyHTML(file))
          }));

          // Each file should be processed correctly
          for (const result of results) {
            expect(result.minified.length).toBeLessThanOrEqual(result.original.length);
            expect(result.savings).toBeGreaterThanOrEqual(0);
            expect(result.savings).toBeLessThanOrEqual(100);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
