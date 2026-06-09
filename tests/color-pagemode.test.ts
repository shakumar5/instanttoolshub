import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement PageMode activation logic from ColorConverterTool.astro
// ============================================================

const VALID_FORMATS = ['hex', 'rgb', 'hsl', 'cmyk'] as const;
type ColorFormat = typeof VALID_FORMATS[number];

const FORMAT_TO_INPUT_ID: Record<string, string> = {
  'hex': 'color-hex',
  'rgb': 'color-rgb',
  'hsl': 'color-hsl',
  'cmyk': 'color-cmyk',
};

interface PageModeResult {
  valid: boolean;
  source?: ColorFormat;
  target?: ColorFormat;
  sourceId?: string;
  targetId?: string;
}

/**
 * Parse and validate a pageMode string.
 * Valid format: "{source}-to-{target}" where source and target are color formats.
 * Returns parsed info for DOM manipulation (focus source, highlight target).
 */
function parsePageMode(pageMode: string): PageModeResult {
  if (!pageMode) return { valid: false };

  const modeMatch = pageMode.match(/^(hex|rgb|hsl|cmyk)-to-(hex|rgb|hsl|cmyk)$/);
  if (!modeMatch) return { valid: false };

  const source = modeMatch[1] as ColorFormat;
  const target = modeMatch[2] as ColorFormat;
  const sourceId = FORMAT_TO_INPUT_ID[source];
  const targetId = FORMAT_TO_INPUT_ID[target];

  return {
    valid: true,
    source,
    target,
    sourceId,
    targetId,
  };
}

// Arbitrary for valid color formats
const colorFormat = fc.constantFrom(...VALID_FORMATS);

// ============================================================
// Property 22: PageMode activation
// ============================================================
describe('Color PageMode - Property 22: PageMode activation', () => {
  test('valid "{source}-to-{target}" is parsed correctly', () => {
    fc.assert(
      fc.property(
        colorFormat,
        colorFormat,
        (source, target) => {
          const pageMode = `${source}-to-${target}`;
          const result = parsePageMode(pageMode);
          
          expect(result.valid).toBe(true);
          expect(result.source).toBe(source);
          expect(result.target).toBe(target);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('source resolves to correct input ID for focus', () => {
    fc.assert(
      fc.property(
        colorFormat,
        colorFormat,
        (source, target) => {
          const pageMode = `${source}-to-${target}`;
          const result = parsePageMode(pageMode);
          
          expect(result.sourceId).toBe(`color-${source}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('target resolves to correct input ID for highlight', () => {
    fc.assert(
      fc.property(
        colorFormat,
        colorFormat,
        (source, target) => {
          const pageMode = `${source}-to-${target}`;
          const result = parsePageMode(pageMode);
          
          expect(result.targetId).toBe(`color-${target}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('invalid pageMode strings return valid=false', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('invalid'),
          fc.constant('hex-rgb'),
          fc.constant('hex-to'),
          fc.constant('-to-rgb'),
          fc.constant('hex-to-xyz'),
          fc.constant('foo-to-bar'),
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.match(/^(hex|rgb|hsl|cmyk)-to-(hex|rgb|hsl|cmyk)$/))
        ),
        (invalidMode) => {
          const result = parsePageMode(invalidMode);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('empty string returns valid=false', () => {
    const result = parsePageMode('');
    expect(result.valid).toBe(false);
  });

  test('all 16 valid combinations are recognized', () => {
    const validCombinations: string[] = [];
    for (const src of VALID_FORMATS) {
      for (const tgt of VALID_FORMATS) {
        validCombinations.push(`${src}-to-${tgt}`);
      }
    }
    expect(validCombinations.length).toBe(16);

    for (const combo of validCombinations) {
      const result = parsePageMode(combo);
      expect(result.valid).toBe(true);
    }
  });

  test('source and target can be the same format', () => {
    fc.assert(
      fc.property(
        colorFormat,
        (format) => {
          const pageMode = `${format}-to-${format}`;
          const result = parsePageMode(pageMode);
          expect(result.valid).toBe(true);
          expect(result.source).toBe(format);
          expect(result.target).toBe(format);
        }
      ),
      { numRuns: 100 }
    );
  });
});
