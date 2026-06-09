import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ============================================================
// Re-implement timezone conversion and cron parsing from timestamp.astro
// ============================================================

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
];

/**
 * Detect if timestamp is in seconds (≤10 digits) or milliseconds (>10 digits).
 * Convert to a Date and format across 6 timezones.
 */
function convertTimestamp(timestamp: number): { date: Date; isMilliseconds: boolean; timezoneOutputs: Record<string, string> } {
  const tsStr = String(Math.abs(timestamp));
  const isMilliseconds = tsStr.length > 10;
  const ms = isMilliseconds ? timestamp : timestamp * 1000;
  const date = new Date(ms);

  const timezoneOutputs: Record<string, string> = {};
  for (const tz of TIMEZONES) {
    timezoneOutputs[tz] = date.toLocaleString('en-US', { timeZone: tz });
  }

  return { date, isMilliseconds, timezoneOutputs };
}

// Cron parsing logic
const FIELD_NAMES = ['minute', 'hour', 'day-of-month', 'month', 'day-of-week'] as const;
const FIELD_RANGES: [number, number][] = [
  [0, 59],   // minute
  [0, 23],   // hour
  [1, 31],   // day-of-month
  [1, 12],   // month
  [0, 6],    // day-of-week
];

interface CronParseResult {
  error?: string;
  description?: string;
}

function validateCronField(field: string, min: number, max: number, name: string): string | null {
  if (field === '*') return null;

  if (field.includes('/')) {
    const [base, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step < 1) {
      return `Invalid step value in ${name} field: "${field}". Step must be a positive integer.`;
    }
    if (base !== '*') {
      const baseNum = parseInt(base, 10);
      if (isNaN(baseNum) || baseNum < min || baseNum > max) {
        return `Out-of-range value in ${name} field: "${field}". ${name} must be between ${min} and ${max}.`;
      }
    }
    return null;
  }

  if (field.includes(',')) {
    const parts = field.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const rangeErr = validateRange(trimmed, min, max, name);
        if (rangeErr) return rangeErr;
      } else {
        const num = parseInt(trimmed, 10);
        if (isNaN(num) || num < min || num > max) {
          return `Out-of-range value in ${name} field: "${field}". Values must be between ${min} and ${max}.`;
        }
      }
    }
    return null;
  }

  if (field.includes('-')) {
    return validateRange(field, min, max, name);
  }

  const num = parseInt(field, 10);
  if (isNaN(num) || num < min || num > max) {
    return `Out-of-range value in ${name} field: "${field}". ${name} must be between ${min} and ${max}.`;
  }
  return null;
}

function validateRange(rangeStr: string, min: number, max: number, name: string): string | null {
  const [startStr, endStr] = rangeStr.split('-');
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);
  if (isNaN(start) || isNaN(end) || start < min || start > max || end < min || end > max) {
    return `Out-of-range value in ${name} field: "${rangeStr}". Values must be between ${min} and ${max}.`;
  }
  return null;
}

function parseCron(cronStr: string): CronParseResult {
  const fields = cronStr.split(/\s+/);

  if (fields.length !== 5) {
    return { error: `Invalid field count: expected exactly 5 fields, got ${fields.length}. Format: minute hour day-of-month month day-of-week` };
  }

  for (let i = 0; i < 5; i++) {
    const fieldError = validateCronField(fields[i], FIELD_RANGES[i][0], FIELD_RANGES[i][1], FIELD_NAMES[i]);
    if (fieldError) {
      return { error: fieldError };
    }
  }

  return { description: 'Valid cron expression' };
}

/**
 * Check if a given date satisfies a cron field constraint.
 */
function matchesCronField(value: number, field: string): boolean {
  if (field === '*') return true;

  if (field.includes('/')) {
    const [base, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);
    const startVal = base === '*' ? 0 : parseInt(base, 10);
    return (value - startVal) % step === 0 && value >= startVal;
  }

  if (field.includes(',')) {
    const parts = field.split(',');
    return parts.some(part => {
      if (part.includes('-')) {
        const [s, e] = part.split('-').map(Number);
        return value >= s && value <= e;
      }
      return value === parseInt(part, 10);
    });
  }

  if (field.includes('-')) {
    const [s, e] = field.split('-').map(Number);
    return value >= s && value <= e;
  }

  return value === parseInt(field, 10);
}

/**
 * Generate the next N runs from a starting date that satisfy the cron expression.
 */
function getNextRuns(cronStr: string, from: Date, count: number): Date[] {
  const fields = cronStr.split(/\s+/);
  if (fields.length !== 5) return [];

  const runs: Date[] = [];
  const current = new Date(from.getTime());
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1); // Start from next minute

  const maxIterations = 525600; // ~1 year of minutes
  let iterations = 0;

  while (runs.length < count && iterations < maxIterations) {
    const minute = current.getMinutes();
    const hour = current.getHours();
    const dayOfMonth = current.getDate();
    const month = current.getMonth() + 1;
    const dayOfWeek = current.getDay();

    if (
      matchesCronField(minute, fields[0]) &&
      matchesCronField(hour, fields[1]) &&
      matchesCronField(dayOfMonth, fields[2]) &&
      matchesCronField(month, fields[3]) &&
      matchesCronField(dayOfWeek, fields[4])
    ) {
      runs.push(new Date(current.getTime()));
    }

    current.setMinutes(current.getMinutes() + 1);
    iterations++;
  }

  return runs;
}

// ============================================================
// Property 14: Timezone conversion
// ============================================================
describe('Timestamp - Property 14: Timezone conversion', () => {
  test('≤10 digit timestamps treated as seconds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9999999999 }),
        (ts) => {
          const result = convertTimestamp(ts);
          expect(result.isMilliseconds).toBe(false);
          // The date should correspond to ts * 1000 ms
          expect(result.date.getTime()).toBe(ts * 1000);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('>10 digit timestamps treated as milliseconds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000000000, max: 99999999999999 }),
        (ts) => {
          const result = convertTimestamp(ts);
          expect(result.isMilliseconds).toBe(true);
          // The date should correspond to ts directly
          expect(result.date.getTime()).toBe(ts);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('formatted output provided for all 6 timezones', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000, max: 2000000000 }),
        (ts) => {
          const result = convertTimestamp(ts);
          expect(Object.keys(result.timezoneOutputs).length).toBe(6);
          for (const tz of TIMEZONES) {
            expect(result.timezoneOutputs[tz]).toBeDefined();
            expect(result.timezoneOutputs[tz].length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('all timezone outputs are non-empty strings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000, max: 2000000000 }),
        (ts) => {
          const result = convertTimestamp(ts);
          for (const tz of TIMEZONES) {
            expect(typeof result.timezoneOutputs[tz]).toBe('string');
            expect(result.timezoneOutputs[tz].trim().length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================================
// Property 15: Cron parsing
// ============================================================
describe('Timestamp - Property 15: Cron parsing', () => {
  // Generate valid cron field arbitraries
  const cronMinute = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 0, max: 59 }).map(String),
    fc.constant('*/5'),
    fc.constant('*/15'),
    fc.constant('0-30'),
    fc.constant('0,15,30,45')
  );
  const cronHour = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 0, max: 23 }).map(String),
    fc.constant('*/2'),
    fc.constant('9-17'),
    fc.constant('0,6,12,18')
  );
  const cronDom = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 1, max: 31 }).map(String),
    fc.constant('1-15'),
    fc.constant('1,15')
  );
  const cronMonth = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 1, max: 12 }).map(String),
    fc.constant('1-6'),
    fc.constant('1,4,7,10')
  );
  const cronDow = fc.oneof(
    fc.constant('*'),
    fc.integer({ min: 0, max: 6 }).map(String),
    fc.constant('1-5'),
    fc.constant('0,6')
  );

  test('valid 5-field expression produces a description (no error)', () => {
    fc.assert(
      fc.property(
        cronMinute, cronHour, cronDom, cronMonth, cronDow,
        (min, hour, dom, month, dow) => {
          const cronStr = `${min} ${hour} ${dom} ${month} ${dow}`;
          const result = parseCron(cronStr);
          expect(result.error).toBeUndefined();
          expect(result.description).toBeDefined();
        }
      ),
      { numRuns: 200 }
    );
  });

  test('invalid field count produces an error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        (fieldCount) => {
          // Generate exactly fieldCount fields that don't contain spaces
          const fields = Array(fieldCount).fill('0');
          const cronStr = fields.join(' ');
          const result = parseCron(cronStr);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('field count');
        }
      ),
      { numRuns: 200 }
    );
  });

  test('out-of-range values produce an error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 60, max: 999 }),
        (badMinute) => {
          const cronStr = `${badMinute} * * * *`;
          const result = parseCron(cronStr);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('next 5 runs satisfy cron constraints', () => {
    // Use simpler cron patterns that won't cause timeout
    const simpleCronMinute = fc.oneof(
      fc.constant('*'),
      fc.constant('0'),
      fc.constant('*/15'),
      fc.constant('30')
    );
    const simpleCronHour = fc.oneof(
      fc.constant('*'),
      fc.constant('0'),
      fc.constant('*/6'),
      fc.constant('12')
    );

    fc.assert(
      fc.property(
        simpleCronMinute, simpleCronHour,
        (min, hour) => {
          const cronStr = `${min} ${hour} * * *`;
          const from = new Date('2025-01-01T00:00:00Z');
          const runs = getNextRuns(cronStr, from, 5);

          // Should find 5 runs for these common patterns
          expect(runs.length).toBe(5);
          
          for (const run of runs) {
            const fields = cronStr.split(/\s+/);
            expect(matchesCronField(run.getMinutes(), fields[0])).toBe(true);
            expect(matchesCronField(run.getHours(), fields[1])).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  test('next runs are in chronological ascending order', () => {
    const simpleCronMinute = fc.oneof(
      fc.constant('*'),
      fc.constant('0'),
      fc.constant('*/15'),
      fc.constant('*/30')
    );
    const simpleCronHour = fc.oneof(
      fc.constant('*'),
      fc.constant('*/4'),
      fc.constant('9-17'),
      fc.constant('0')
    );

    fc.assert(
      fc.property(
        simpleCronMinute, simpleCronHour,
        (min, hour) => {
          const cronStr = `${min} ${hour} * * *`;
          const from = new Date('2025-06-01T00:00:00Z');
          const runs = getNextRuns(cronStr, from, 5);

          for (let i = 1; i < runs.length; i++) {
            expect(runs[i].getTime()).toBeGreaterThan(runs[i - 1].getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});
