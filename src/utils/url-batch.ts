/**
 * Batch URL encoding/decoding utilities.
 * These pure functions are extracted for testability and used by the
 * URL Encoder/Decoder tool page.
 */

/**
 * Batch encode an array of lines. Each non-empty line is encoded independently
 * using encodeURIComponent. Empty lines (containing no characters or only
 * whitespace) are preserved as empty output lines.
 *
 * @param lines - Array of input strings (one per line)
 * @returns Array of encoded strings with the same length as input
 */
export function batchEncode(lines: string[]): string[] {
  return lines.map(line => {
    if (!line.trim()) return '';
    return encodeURIComponent(line);
  });
}

/**
 * Batch decode an array of lines. Each non-empty line is decoded independently
 * using decodeURIComponent. Lines with invalid percent-encoded sequences are
 * prefixed with an error indicator "[Error] " followed by the original input,
 * without halting processing of remaining lines. Empty lines (containing no
 * characters or only whitespace) are preserved as empty output lines.
 *
 * @param lines - Array of percent-encoded strings (one per line)
 * @returns Array of decoded strings (or error-prefixed originals) with the same length
 */
export function batchDecode(lines: string[]): string[] {
  return lines.map(line => {
    if (!line.trim()) return '';
    try {
      return decodeURIComponent(line);
    } catch (e) {
      return '[Error] ' + line;
    }
  });
}
