import { describe, it, expect } from 'vitest';
import { batchEncode, batchDecode } from './url-batch';

describe('batchEncode', () => {
  it('encodes each non-empty line independently with encodeURIComponent', () => {
    const input = ['hello world', 'foo&bar=baz'];
    const result = batchEncode(input);
    expect(result).toEqual(['hello%20world', 'foo%26bar%3Dbaz']);
  });

  it('preserves empty lines as empty output lines', () => {
    const input = ['hello', '', 'world'];
    const result = batchEncode(input);
    expect(result).toEqual([encodeURIComponent('hello'), '', encodeURIComponent('world')]);
  });

  it('treats whitespace-only lines as empty', () => {
    const input = ['hello', '   ', '\t', 'world'];
    const result = batchEncode(input);
    expect(result).toEqual([encodeURIComponent('hello'), '', '', encodeURIComponent('world')]);
  });

  it('preserves the same number of output lines as input lines', () => {
    const input = ['a', '', 'b', '', '', 'c'];
    const result = batchEncode(input);
    expect(result.length).toBe(input.length);
  });

  it('handles an empty array', () => {
    expect(batchEncode([])).toEqual([]);
  });

  it('encodes special URL characters', () => {
    const input = ['https://example.com?q=hello world&lang=en'];
    const result = batchEncode(input);
    expect(result[0]).toBe(encodeURIComponent('https://example.com?q=hello world&lang=en'));
  });
});

describe('batchDecode', () => {
  it('decodes each non-empty line independently', () => {
    const input = ['hello%20world', 'foo%26bar%3Dbaz'];
    const result = batchDecode(input);
    expect(result).toEqual(['hello world', 'foo&bar=baz']);
  });

  it('preserves empty lines as empty output lines', () => {
    const input = ['hello%20world', '', 'foo'];
    const result = batchDecode(input);
    expect(result).toEqual(['hello world', '', 'foo']);
  });

  it('treats whitespace-only lines as empty', () => {
    const input = ['hello%20world', '   ', 'foo'];
    const result = batchDecode(input);
    expect(result).toEqual(['hello world', '', 'foo']);
  });

  it('prefixes invalid percent-encoded lines with [Error] indicator', () => {
    const input = ['%E0%A4%A'];  // incomplete percent-encoded sequence
    const result = batchDecode(input);
    expect(result[0]).toBe('[Error] %E0%A4%A');
  });

  it('continues processing remaining lines after an error', () => {
    const input = ['hello%20world', '%ZZ', 'foo%20bar'];
    const result = batchDecode(input);
    expect(result).toEqual(['hello world', '[Error] %ZZ', 'foo bar']);
  });

  it('preserves the same number of output lines as input lines', () => {
    const input = ['a', '', '%invalid', '', 'b'];
    const result = batchDecode(input);
    expect(result.length).toBe(input.length);
  });

  it('handles an empty array', () => {
    expect(batchDecode([])).toEqual([]);
  });

  it('does not halt processing when encountering errors', () => {
    const input = ['%ZZ', '%YY', 'valid'];
    const result = batchDecode(input);
    expect(result[0]).toMatch(/^\[Error\] /);
    expect(result[1]).toMatch(/^\[Error\] /);
    expect(result[2]).toBe('valid');
  });
});
