import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement markdown table generator and HTML export from markdown-editor.astro
// ============================================================

function generateTable(rows: number, cols: number): string {
  let tableMd = '\n';
  // Header row with placeholder text
  tableMd += '| ' + Array(cols).fill('Header').join(' | ') + ' |\n';
  // Separator row with dashes and pipes
  tableMd += '| ' + Array(cols).fill('---').join(' | ') + ' |\n';
  // Data rows with placeholder text
  for (let r = 0; r < rows; r++) {
    tableMd += '| ' + Array(cols).fill('Cell').join(' | ') + ' |\n';
  }
  return tableMd;
}

function exportHtmlDocument(renderedContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Exported Markdown</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; color: #333; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { font-family: monospace; background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th, td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #eee; }
    blockquote { border-left: 4px solid #8b5cf6; padding-left: 1rem; color: #666; font-style: italic; margin-left: 0; }
  </style>
</head>
<body>
  ${renderedContent}
</body>
</html>`;
}

// ============================================================
// Property 9: Table generator structure
// ============================================================
describe('Markdown - Property 9: Table generator structure', () => {
  test('correct total row count (header + separator + data rows)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (rows, cols) => {
          const table = generateTable(rows, cols);
          const lines = table.split('\n').filter(l => l.trim());
          // Total lines = 1 header + 1 separator + rows data rows
          expect(lines.length).toBe(rows + 2);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('correct column count in each row', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (rows, cols) => {
          const table = generateTable(rows, cols);
          const lines = table.split('\n').filter(l => l.trim());
          for (const line of lines) {
            // Count pipe characters (columns = pipes - 1 for leading pipe)
            // Format: "| Header | Header |" → count of | delimiters between content
            const cells = line.split('|').filter(cell => cell.trim() !== '');
            expect(cells.length).toBe(cols);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('header row contains "Header" text in all cells', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (rows, cols) => {
          const table = generateTable(rows, cols);
          const lines = table.split('\n').filter(l => l.trim());
          const headerLine = lines[0];
          const headerCells = headerLine.split('|').filter(c => c.trim() !== '');
          for (const cell of headerCells) {
            expect(cell.trim()).toBe('Header');
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('separator row contains "---" in all cells', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (rows, cols) => {
          const table = generateTable(rows, cols);
          const lines = table.split('\n').filter(l => l.trim());
          const separatorLine = lines[1];
          const separatorCells = separatorLine.split('|').filter(c => c.trim() !== '');
          for (const cell of separatorCells) {
            expect(cell.trim()).toBe('---');
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('data rows contain "Cell" text in all cells', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (rows, cols) => {
          const table = generateTable(rows, cols);
          const lines = table.split('\n').filter(l => l.trim());
          const dataLines = lines.slice(2); // Skip header and separator
          expect(dataLines.length).toBe(rows);
          for (const line of dataLines) {
            const cells = line.split('|').filter(c => c.trim() !== '');
            for (const cell of cells) {
              expect(cell.trim()).toBe('Cell');
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================================
// Property 10: Export HTML document integrity
// ============================================================
describe('Markdown - Property 10: Export HTML document integrity', () => {
  test('output contains DOCTYPE declaration', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (content) => {
          const doc = exportHtmlDocument(content);
          expect(doc).toMatch(/<!DOCTYPE html>/i);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('output contains html element', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (content) => {
          const doc = exportHtmlDocument(content);
          expect(doc).toMatch(/<html[\s>]/);
          expect(doc).toMatch(/<\/html>/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('output contains head with style element', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (content) => {
          const doc = exportHtmlDocument(content);
          expect(doc).toMatch(/<head>/);
          expect(doc).toMatch(/<\/head>/);
          expect(doc).toMatch(/<style>/);
          expect(doc).toMatch(/<\/style>/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('output contains body with rendered content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => !s.includes('<') && !s.includes('>')),
        (content) => {
          const doc = exportHtmlDocument(content);
          expect(doc).toMatch(/<body>/);
          expect(doc).toMatch(/<\/body>/);
          expect(doc).toContain(content);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('document has proper nesting order: DOCTYPE > html > head + body', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (content) => {
          const doc = exportHtmlDocument(content);
          const doctypeIdx = doc.indexOf('<!DOCTYPE html>');
          const htmlOpenIdx = doc.indexOf('<html');
          const headOpenIdx = doc.indexOf('<head>');
          const headCloseIdx = doc.indexOf('</head>');
          const bodyOpenIdx = doc.indexOf('<body>');
          const bodyCloseIdx = doc.indexOf('</body>');
          const htmlCloseIdx = doc.indexOf('</html>');

          expect(doctypeIdx).toBeLessThan(htmlOpenIdx);
          expect(htmlOpenIdx).toBeLessThan(headOpenIdx);
          expect(headOpenIdx).toBeLessThan(headCloseIdx);
          expect(headCloseIdx).toBeLessThan(bodyOpenIdx);
          expect(bodyOpenIdx).toBeLessThan(bodyCloseIdx);
          expect(bodyCloseIdx).toBeLessThan(htmlCloseIdx);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('contains charset meta tag', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        (content) => {
          const doc = exportHtmlDocument(content);
          expect(doc).toMatch(/<meta charset="UTF-8">/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
