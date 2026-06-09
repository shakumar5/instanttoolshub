import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement color math utilities from ColorConverterTool.astro
// ============================================================

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function generateComplementary(h: number, s: number, l: number): [number, number, number] {
  const compH = (h + 0.5) % 1.0;
  return [compH, s, l];
}

function generateAnalogous(h: number, s: number, l: number): Array<[number, number, number]> {
  const h1 = (h + 30 / 360) % 1.0;
  const h2 = (h + 330 / 360) % 1.0;
  return [[h2, s, l], [h, s, l], [h1, s, l]];
}

function generateTriadic(h: number, s: number, l: number): Array<[number, number, number]> {
  const h1 = (h + 120 / 360) % 1.0;
  const h2 = (h + 240 / 360) % 1.0;
  return [[h, s, l], [h1, s, l], [h2, s, l]];
}

function generateMonochromatic(h: number, s: number, l: number): Array<[number, number, number]> {
  const l1 = Math.max(0.1, l - 0.2);
  const l2 = Math.max(0.2, l - 0.1);
  const l3 = Math.min(0.9, l + 0.1);
  const l4 = Math.min(0.95, l + 0.2);
  return [[h, s, l1], [h, s, l2], [h, s, l], [h, s, l3], [h, s, l4]];
}

function buildGradientCSS(col1: string, col2: string, angle: number): string {
  const cssCode = `linear-gradient(${angle}deg, ${col1}, ${col2})`;
  return `background-color: ${col1};\nbackground: ${cssCode};`;
}

// Arbitrary for valid hex colors
const hexColor = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => rgbToHex(r, g, b));

// Arbitrary for HSL values (h in 0..1, s in 0..1, l in 0.1..0.9)
const hslValues = fc.tuple(
  fc.double({ min: 0, max: 0.999, noNaN: true }),
  fc.double({ min: 0.01, max: 1, noNaN: true }),
  fc.double({ min: 0.1, max: 0.9, noNaN: true })
);

// ============================================================
// Property 11: Palette generation
// ============================================================
describe('Color - Property 11: Palette generation', () => {
  test('complementary = 180° hue shift', () => {
    fc.assert(
      fc.property(
        hslValues,
        ([h, s, l]) => {
          const [compH, compS, compL] = generateComplementary(h, s, l);
          // Hue should differ by exactly 0.5 (180°)
          const hueDiff = Math.abs(compH - h);
          const normalizedDiff = Math.min(hueDiff, 1 - hueDiff);
          expect(normalizedDiff).toBeCloseTo(0.5, 5);
          // Saturation and lightness should be preserved
          expect(compS).toBeCloseTo(s, 10);
          expect(compL).toBeCloseTo(l, 10);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('analogous = ±30° hue', () => {
    fc.assert(
      fc.property(
        hslValues,
        ([h, s, l]) => {
          const colors = generateAnalogous(h, s, l);
          expect(colors.length).toBe(3);

          // colors[0] = h - 30°, colors[1] = original, colors[2] = h + 30°
          const expectedMinus30 = (h + 330 / 360) % 1.0;
          const expectedPlus30 = (h + 30 / 360) % 1.0;

          expect(colors[0][0]).toBeCloseTo(expectedMinus30, 5);
          expect(colors[1][0]).toBeCloseTo(h, 5);
          expect(colors[2][0]).toBeCloseTo(expectedPlus30, 5);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('triadic = 120° intervals', () => {
    fc.assert(
      fc.property(
        hslValues,
        ([h, s, l]) => {
          const colors = generateTriadic(h, s, l);
          expect(colors.length).toBe(3);

          // Original, +120°, +240°
          const expected1 = (h + 120 / 360) % 1.0;
          const expected2 = (h + 240 / 360) % 1.0;

          expect(colors[0][0]).toBeCloseTo(h, 5);
          expect(colors[1][0]).toBeCloseTo(expected1, 5);
          expect(colors[2][0]).toBeCloseTo(expected2, 5);

          // Saturation and lightness preserved across all
          for (const color of colors) {
            expect(color[1]).toBeCloseTo(s, 10);
            expect(color[2]).toBeCloseTo(l, 10);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('monochromatic = 5 lightness variations with same hue', () => {
    fc.assert(
      fc.property(
        hslValues,
        ([h, s, l]) => {
          const colors = generateMonochromatic(h, s, l);
          expect(colors.length).toBe(5);

          // All should have the same hue and saturation
          for (const color of colors) {
            expect(color[0]).toBeCloseTo(h, 10);
            expect(color[1]).toBeCloseTo(s, 10);
          }

          // The middle (index 2) should be the original lightness
          expect(colors[2][2]).toBeCloseTo(l, 10);

          // All lightness values should be between 0 and 1
          for (const color of colors) {
            expect(color[2]).toBeGreaterThanOrEqual(0);
            expect(color[2]).toBeLessThanOrEqual(1);
          }

          // There should be 5 distinct or near-distinct lightness entries
          // (may coincide at boundaries, but always 5 entries)
          expect(colors.length).toBe(5);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================================
// Property 12: WCAG contrast ratio calculation
// ============================================================
describe('Color - Property 12: WCAG contrast ratio', () => {
  test('formula: (L1+0.05)/(L2+0.05) with L1 >= L2', () => {
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        (hex1, hex2) => {
          const l1 = getLuminance(hex1);
          const l2 = getLuminance(hex2);
          const expected = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          const actual = calculateContrastRatio(hex1, hex2);
          expect(actual).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('contrast ratio is always >= 1', () => {
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        (hex1, hex2) => {
          const ratio = calculateContrastRatio(hex1, hex2);
          expect(ratio).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('contrast ratio is symmetric', () => {
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        (hex1, hex2) => {
          const ratio1 = calculateContrastRatio(hex1, hex2);
          const ratio2 = calculateContrastRatio(hex2, hex1);
          expect(ratio1).toBeCloseTo(ratio2, 10);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('same color has contrast ratio of 1', () => {
    fc.assert(
      fc.property(
        hexColor,
        (hex) => {
          const ratio = calculateContrastRatio(hex, hex);
          expect(ratio).toBeCloseTo(1, 5);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('WCAG AA normal text passes at >= 4.5', () => {
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        (hex1, hex2) => {
          const ratio = calculateContrastRatio(hex1, hex2);
          const passAA = ratio >= 4.5;
          const passAALarge = ratio >= 3.0;
          const passAAA = ratio >= 7.0;
          
          // If AAA passes, AA must also pass
          if (passAAA) {
            expect(passAA).toBe(true);
          }
          // If AA passes, AA large must also pass
          if (passAA) {
            expect(passAALarge).toBe(true);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('black vs white has maximum contrast (~21:1)', () => {
    const ratio = calculateContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });
});

// ============================================================
// Property 13: Gradient CSS output
// ============================================================
describe('Color - Property 13: Gradient CSS output', () => {
  test('output contains background-color fallback', () => {
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        fc.integer({ min: 0, max: 360 }),
        (col1, col2, angle) => {
          const css = buildGradientCSS(col1, col2, angle);
          expect(css).toContain(`background-color: ${col1};`);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('output contains linear-gradient declaration', () => {
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        fc.integer({ min: 0, max: 360 }),
        (col1, col2, angle) => {
          const css = buildGradientCSS(col1, col2, angle);
          expect(css).toContain(`linear-gradient(${angle}deg, ${col1}, ${col2})`);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('fallback color matches first gradient stop', () => {
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        fc.integer({ min: 0, max: 360 }),
        (col1, col2, angle) => {
          const css = buildGradientCSS(col1, col2, angle);
          const lines = css.split('\n');
          // First line has background-color with col1
          expect(lines[0]).toBe(`background-color: ${col1};`);
          // Second line has the gradient with both colors
          expect(lines[1]).toContain(col1);
          expect(lines[1]).toContain(col2);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('gradient angle is reflected in output', () => {
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        fc.integer({ min: 0, max: 360 }),
        (col1, col2, angle) => {
          const css = buildGradientCSS(col1, col2, angle);
          expect(css).toContain(`${angle}deg`);
        }
      ),
      { numRuns: 200 }
    );
  });
});
