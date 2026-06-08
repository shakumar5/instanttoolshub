/**
 * Auto-linking utility for blog posts.
 * Links the first occurrence of each tool's display name to its corresponding tool page.
 */

/** Map of valid tool identifiers to their display name and page path */
export const TOOL_MAP: Record<string, { displayName: string; path: string }> = {
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

/**
 * Auto-links the first occurrence of each tool name in HTML content.
 * Only processes tools listed in the provided tools array.
 * Invalid tool identifiers are silently ignored.
 *
 * @param html - The rendered HTML string of the blog post body
 * @param tools - Array of tool identifier strings from post frontmatter
 * @returns HTML string with first occurrence of each tool name wrapped in an anchor tag
 */
export function autoLinkTools(html: string, tools: string[]): string {
  if (!tools || tools.length === 0) return html;

  let result = html;

  for (const toolId of tools) {
    const tool = TOOL_MAP[toolId];
    // Silently ignore invalid tool identifiers
    if (!tool) continue;

    const { displayName, path } = tool;

    // Escape special regex characters in the display name
    const escapedName = displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match the first occurrence of the tool display name that is NOT already inside an <a> tag.
    // We use a regex that:
    // 1. Ensures the match is not inside an existing anchor tag (not preceded by <a...> without a closing </a>)
    // 2. Matches the display name as a whole word-ish boundary (not inside another word)
    // Simple approach: replace only the first occurrence that is not already wrapped in a link.
    const regex = new RegExp(
      `(?<!<a[^>]*>[^<]*)\\b(${escapedName})\\b(?![^<]*<\\/a>)`,
      'i'
    );

    // Try a simpler approach: find the first occurrence not already inside an anchor
    const anchorRegex = new RegExp(`\\b${escapedName}\\b`, 'i');
    const match = anchorRegex.exec(result);

    if (match) {
      const matchIndex = match.index;
      const matchText = match[0];

      // Check if this occurrence is already inside an <a> tag
      // by looking at the context before and after
      const before = result.substring(0, matchIndex);
      const after = result.substring(matchIndex + matchText.length);

      // Count open <a> tags vs </a> tags before the match
      const openAnchors = (before.match(/<a\b/gi) || []).length;
      const closeAnchors = (before.match(/<\/a>/gi) || []).length;

      if (openAnchors <= closeAnchors) {
        // Not inside an anchor tag - safe to wrap
        const link = `<a href="${path}">${matchText}</a>`;
        result = before + link + after;
      }
      // If already inside an anchor, try to find the next occurrence
      else {
        // Find subsequent occurrences
        const remainingRegex = new RegExp(`\\b${escapedName}\\b`, 'gi');
        let nextMatch;
        let found = false;
        remainingRegex.lastIndex = 0;

        // Reset and search through the entire string
        while ((nextMatch = remainingRegex.exec(result)) !== null) {
          const idx = nextMatch.index;
          const txt = nextMatch[0];
          const beforeNext = result.substring(0, idx);
          const openA = (beforeNext.match(/<a\b/gi) || []).length;
          const closeA = (beforeNext.match(/<\/a>/gi) || []).length;

          if (openA <= closeA) {
            const link = `<a href="${path}">${txt}</a>`;
            result = result.substring(0, idx) + link + result.substring(idx + txt.length);
            found = true;
            break;
          }
        }
      }
    }
  }

  return result;
}
