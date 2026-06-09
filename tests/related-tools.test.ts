import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement RelatedTools logic from RelatedTools.astro
// ============================================================

const TOOL_CATEGORIES: Record<string, string[]> = {
  encoding: ['base64', 'url-encoder-decoder'],
  formatting: ['json-formatter', 'code-minifier-beautifier', 'markdown-editor'],
  security: ['jwt-decoder', 'hash-generator'],
  conversion: ['color-converter', 'timestamp'],
  development: ['regex-tester'],
};

const CATEGORY_ORDER = ['encoding', 'formatting', 'security', 'conversion', 'development'];

const ALL_TOOLS = Object.values(TOOL_CATEGORIES).flat();

function findCategory(toolId: string): string | null {
  for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
    if (tools.includes(toolId)) return category;
  }
  return null;
}

function getRelatedTools(toolId: string): string[] {
  const category = findCategory(toolId);
  if (!category) return [];

  // Get same-category tools (excluding current)
  const sameCategoryTools = TOOL_CATEGORIES[category].filter(t => t !== toolId);

  // If we have 2 or more from the same category, return up to 4
  if (sameCategoryTools.length >= 2) {
    return sameCategoryTools.slice(0, 4);
  }

  // Supplement from adjacent categories
  const related = [...sameCategoryTools];
  const categoryIndex = CATEGORY_ORDER.indexOf(category);

  for (let offset = 1; offset < CATEGORY_ORDER.length && related.length < 3; offset++) {
    const nextIdx = (categoryIndex + offset) % CATEGORY_ORDER.length;
    const nextCategory = CATEGORY_ORDER[nextIdx];
    if (nextCategory !== category) {
      for (const tool of TOOL_CATEGORIES[nextCategory]) {
        if (related.length >= 3) break;
        if (!related.includes(tool) && tool !== toolId) {
          related.push(tool);
        }
      }
    }
  }

  return related;
}

// ============================================================
// Property 17: Category correctness
// ============================================================
describe('Related Tools - Property 17: Category correctness', () => {
  const toolArb = fc.constantFrom(...ALL_TOOLS);

  test('returns 2-4 related cards', () => {
    fc.assert(
      fc.property(
        toolArb,
        (toolId) => {
          const related = getRelatedTools(toolId);
          expect(related.length).toBeGreaterThanOrEqual(2);
          expect(related.length).toBeLessThanOrEqual(4);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('never includes current tool', () => {
    fc.assert(
      fc.property(
        toolArb,
        (toolId) => {
          const related = getRelatedTools(toolId);
          expect(related).not.toContain(toolId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('same-category tools appear first', () => {
    fc.assert(
      fc.property(
        toolArb,
        (toolId) => {
          const related = getRelatedTools(toolId);
          const category = findCategory(toolId);
          if (!category) return;

          const sameCategoryTools = TOOL_CATEGORIES[category].filter(t => t !== toolId);

          if (sameCategoryTools.length >= 2) {
            // All results should be from same category
            for (const tool of related) {
              expect(sameCategoryTools).toContain(tool);
            }
          } else {
            // The same-category tools should appear before supplementary ones
            for (let i = 0; i < sameCategoryTools.length; i++) {
              expect(related[i]).toBe(sameCategoryTools[i]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all returned tools are valid tool IDs', () => {
    fc.assert(
      fc.property(
        toolArb,
        (toolId) => {
          const related = getRelatedTools(toolId);
          for (const tool of related) {
            expect(ALL_TOOLS).toContain(tool);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('no duplicates in returned list', () => {
    fc.assert(
      fc.property(
        toolArb,
        (toolId) => {
          const related = getRelatedTools(toolId);
          const unique = new Set(related);
          expect(unique.size).toBe(related.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unknown tool returns empty array', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 20 }).filter(s => !ALL_TOOLS.includes(s)),
        (unknownTool) => {
          const related = getRelatedTools(unknownTool);
          expect(related.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('categories with single tool get supplemented from adjacent categories', () => {
    // 'development' has only 'regex-tester'
    const related = getRelatedTools('regex-tester');
    expect(related.length).toBeGreaterThanOrEqual(2);
    // Should not contain regex-tester itself
    expect(related).not.toContain('regex-tester');
  });
});
