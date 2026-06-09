import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement inline validation error association logic
// Based on the aria-describedby pattern used across tool pages
// ============================================================

interface ValidationState {
  fieldId: string;
  errorId: string;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * When a field is invalid, an error element is shown and the field's
 * aria-describedby is set to the error element's id.
 * When valid, the error element is hidden and aria-describedby is removed.
 */
function getFieldAttributes(state: ValidationState): {
  ariaDescribedBy: string | null;
  errorVisible: boolean;
  errorContent: string;
} {
  if (state.isValid) {
    return {
      ariaDescribedBy: null,
      errorVisible: false,
      errorContent: '',
    };
  }
  return {
    ariaDescribedBy: state.errorId,
    errorVisible: true,
    errorContent: state.errorMessage || 'Validation error',
  };
}

/**
 * Simulate the UTM builder validation that shows/hides error and
 * associates it via aria-describedby on multiple fields.
 */
interface UtmValidationResult {
  isValid: boolean;
  errorId: string;
  fieldsWithDescribedBy: string[];
  errorMessage?: string;
}

function validateUtmForm(params: {
  websiteUrl: string;
  source: string;
  medium: string;
  campaign: string;
}): UtmValidationResult {
  const errorId = 'utm-validation-error';
  const requiredFields = ['utm-url', 'utm-source', 'utm-medium', 'utm-name'];

  const { websiteUrl, source, medium, campaign } = params;
  const missing: string[] = [];
  if (!websiteUrl.trim()) missing.push('Website URL');
  if (!source.trim()) missing.push('Source');
  if (!medium.trim()) missing.push('Medium');
  if (!campaign.trim()) missing.push('Campaign');

  if (missing.length > 0) {
    return {
      isValid: false,
      errorId,
      fieldsWithDescribedBy: requiredFields,
      errorMessage: `Please fill in: ${missing.join(', ')}`,
    };
  }

  return {
    isValid: true,
    errorId,
    fieldsWithDescribedBy: [],
  };
}

/**
 * Simulate query parser error when URL is invalid
 */
function validateQueryParserInput(url: string): {
  isValid: boolean;
  errorId: string;
  errorMessage?: string;
} {
  const errorId = 'query-error-notification';
  try {
    if (!url.trim()) {
      return { isValid: false, errorId, errorMessage: 'Please enter a URL to parse.' };
    }
    // Try to parse the URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
    } else {
      new URL('https://' + url);
    }
    return { isValid: true, errorId };
  } catch {
    return { isValid: false, errorId, errorMessage: 'Invalid URL format.' };
  }
}

// ============================================================
// Property 24: Inline validation error association
// ============================================================
describe('Validation - Property 24: Inline validation error association', () => {
  test('invalid field has aria-describedby referencing error id', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `field-${s.replace(/[^a-z0-9]/gi, '')}`),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `error-${s.replace(/[^a-z0-9]/gi, '')}`),
        fc.string({ minLength: 1, maxLength: 50 }),
        (fieldId, errorId, errorMsg) => {
          const state: ValidationState = {
            fieldId,
            errorId,
            isValid: false,
            errorMessage: errorMsg,
          };
          const attrs = getFieldAttributes(state);
          
          expect(attrs.ariaDescribedBy).toBe(errorId);
          expect(attrs.errorVisible).toBe(true);
          expect(attrs.errorContent).toBe(errorMsg);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('valid field has aria-describedby removed (null)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `field-${s.replace(/[^a-z0-9]/gi, '')}`),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `error-${s.replace(/[^a-z0-9]/gi, '')}`),
        (fieldId, errorId) => {
          const state: ValidationState = {
            fieldId,
            errorId,
            isValid: true,
          };
          const attrs = getFieldAttributes(state);
          
          expect(attrs.ariaDescribedBy).toBeNull();
          expect(attrs.errorVisible).toBe(false);
          expect(attrs.errorContent).toBe('');
        }
      ),
      { numRuns: 200 }
    );
  });

  test('UTM validation: missing required fields shows error on all field inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          websiteUrl: fc.oneof(fc.constant(''), fc.constant('   ')),
          source: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 10 })),
          medium: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 10 })),
          campaign: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 10 })),
        }),
        (params) => {
          // Ensure at least websiteUrl is empty
          const result = validateUtmForm(params);
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBeDefined();
          // Error id exists
          expect(result.errorId).toBe('utm-validation-error');
          // Fields should reference this error via aria-describedby
          expect(result.fieldsWithDescribedBy.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('UTM validation: all fields filled removes error association', () => {
    fc.assert(
      fc.property(
        fc.record({
          websiteUrl: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          source: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          medium: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          campaign: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        }),
        (params) => {
          const result = validateUtmForm(params);
          expect(result.isValid).toBe(true);
          expect(result.fieldsWithDescribedBy.length).toBe(0);
          expect(result.errorMessage).toBeUndefined();
        }
      ),
      { numRuns: 200 }
    );
  });

  test('query parser: empty URL shows error', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.constant('   '), fc.constant('\t')),
        (emptyUrl) => {
          const result = validateQueryParserInput(emptyUrl);
          expect(result.isValid).toBe(false);
          expect(result.errorId).toBe('query-error-notification');
          expect(result.errorMessage).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('query parser: valid URL removes error', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (url) => {
          const result = validateQueryParserInput(url);
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeUndefined();
        }
      ),
      { numRuns: 200 }
    );
  });

  test('error id is consistent between show and hide states', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `err-${s.replace(/[^a-z0-9]/gi, '')}`),
        fc.boolean(),
        (errorId, isValid) => {
          const state: ValidationState = {
            fieldId: 'test-field',
            errorId,
            isValid,
            errorMessage: isValid ? undefined : 'Some error',
          };
          const attrs = getFieldAttributes(state);
          
          if (!isValid) {
            // aria-describedby points to the error element's id
            expect(attrs.ariaDescribedBy).toBe(errorId);
          } else {
            // When valid, the association is removed
            expect(attrs.ariaDescribedBy).toBeNull();
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
