import { describe, it, expect } from 'vitest';
import { autoLinkTools, TOOL_MAP } from './autolink';

describe('autoLinkTools', () => {
  it('should return unchanged HTML when tools array is empty', () => {
    const html = '<p>Hello world</p>';
    expect(autoLinkTools(html, [])).toBe(html);
  });

  it('should return unchanged HTML when tools is undefined-like', () => {
    const html = '<p>Hello world</p>';
    expect(autoLinkTools(html, null as any)).toBe(html);
  });

  it('should link the first occurrence of a tool name', () => {
    const html = '<p>Try our JSON Formatter to format your data. The JSON Formatter is great.</p>';
    const result = autoLinkTools(html, ['json-formatter']);
    expect(result).toContain('<a href="/json-formatter">JSON Formatter</a>');
    // Should only link the first occurrence
    const linkCount = (result.match(/<a href="\/json-formatter">/g) || []).length;
    expect(linkCount).toBe(1);
  });

  it('should handle multiple tools in the array', () => {
    const html = '<p>Use the JWT Decoder and RegEx Tester for debugging.</p>';
    const result = autoLinkTools(html, ['jwt-decoder', 'regex-tester']);
    expect(result).toContain('<a href="/jwt-decoder">JWT Decoder</a>');
    expect(result).toContain('<a href="/regex-tester">RegEx Tester</a>');
  });

  it('should silently ignore invalid tool identifiers', () => {
    const html = '<p>Try our JSON Formatter tool.</p>';
    const result = autoLinkTools(html, ['invalid-tool', 'json-formatter']);
    expect(result).toContain('<a href="/json-formatter">JSON Formatter</a>');
  });

  it('should not link text that is already inside an anchor tag', () => {
    const html = '<p><a href="/existing">JSON Formatter</a> is a tool. Try JSON Formatter today.</p>';
    const result = autoLinkTools(html, ['json-formatter']);
    // The first occurrence is inside an existing anchor, so the second one should be linked
    expect(result).toContain('<a href="/existing">JSON Formatter</a>');
    expect(result).toContain('<a href="/json-formatter">JSON Formatter</a>');
  });

  it('should handle case-insensitive matching', () => {
    const html = '<p>The json formatter helps you format JSON.</p>';
    const result = autoLinkTools(html, ['json-formatter']);
    expect(result).toContain('<a href="/json-formatter">json formatter</a>');
  });

  it('should not modify HTML when tool name is not present', () => {
    const html = '<p>This is a paragraph about something else.</p>';
    const result = autoLinkTools(html, ['json-formatter']);
    expect(result).toBe(html);
  });

  it('should handle all valid tool identifiers', () => {
    const validTools = Object.keys(TOOL_MAP);
    expect(validTools).toHaveLength(10);
    validTools.forEach(toolId => {
      expect(TOOL_MAP[toolId]).toHaveProperty('displayName');
      expect(TOOL_MAP[toolId]).toHaveProperty('path');
    });
  });
});
