# Implementation Plan: ToolsHub Completion

## Overview

This plan implements the remaining 7 tool engines (URL Encoder, JWT Decoder, Code Minifier, Markdown Editor, Color Converter, Timestamp Converter, Hash Generator), the blog/content system, SEO sub-pages, cross-tool linking, AdSense integration, service worker, and UX polish. All tool pages already have HTML/CSS scaffolding — tasks focus on wiring up the interactive JavaScript logic in each page's `<script>` section.

## Tasks

- [ ] 1. URL Encoder/Decoder Tool Engine
  - [x] 1.1 Implement URL encode/decode logic in `src/pages/url-encoder-decoder.astro`
    - Add pure functions: `urlEncode(input, mode)`, `urlDecode(input)`, `parseQueryString(url)`, `rebuildUrl(base, params)`, `buildUtmUrl(params)`
    - Wire Encode button to encode input using `encodeURIComponent` (Component mode) or `encodeURI` (URI mode)
    - Wire Decode button to decode percent-encoded input using `decodeURIComponent`
    - Display error message for invalid percent-encoded sequences without clearing input
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.2 Implement batch encode/decode and query string parser in `src/pages/url-encoder-decoder.astro`
    - Implement batch processing: split input by newlines, encode/decode each line independently, preserve empty lines
    - Implement query string parser: extract key-value pairs into editable table with add/delete rows
    - Implement Rebuild URL: combine base path with table parameters, omit empty-key rows
    - _Requirements: 1.4, 1.5, 1.6_

  - [ ] 1.3 Implement UTM Builder in `src/pages/url-encoder-decoder.astro`
    - Wire Generate button to produce UTM campaign URL from required fields (Website URL, Source, Medium, Campaign)
    - Append optional utm_term and utm_content only when non-empty
    - Display validation alert for missing required fields and block URL generation
    - _Requirements: 1.7, 1.8_

  - [ ]* 1.4 Write property tests for URL Encoder
    - **Property 1: URL Encode/Decode Round-Trip**
    - **Property 2: Batch Encode Equals Individual Encode**
    - **Property 3: Query String Parse/Rebuild Round-Trip**
    - **Property 4: UTM Builder Output Validity**
    - **Property 5: UTM Validation Rejects Incomplete Parameters**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8**

- [ ] 2. JWT Decoder Tool Engine
  - [x] 2.1 Implement JWT decode and display logic in `src/pages/jwt-decoder.astro`
    - Add pure functions: `decodeJwt(token)`, `checkExpiry(exp)`
    - Decode and pretty-print header/payload JSON with 2-space indentation
    - Display expiry status (Active/Expired) with countdown from `exp` claim
    - Validate 3-segment structure; show error for invalid format or Base64URL decoding failure
    - _Requirements: 2.1, 2.2, 2.6, 2.7_

  - [ ] 2.2 Implement JWT signature verification and token generation in `src/pages/jwt-decoder.astro`
    - Add pure functions: `verifyHmacSha256(token, secret)`, `generateJwt(header, payload, secret)`
    - Wire Verify button to compute HMAC-SHA256 via Web Crypto API and compare signatures
    - Wire Generate Token to produce HS256-signed JWT from header/payload/secret inputs
    - Show JSON parse errors for invalid header/payload; block generation
    - Wire Share URL button to copy `?token=<jwt>` URL to clipboard with 2-second confirmation
    - _Requirements: 2.3, 2.4, 2.5, 2.8_

  - [ ]* 2.3 Write property tests for JWT Decoder
    - **Property 6: JWT Encode/Decode Round-Trip**
    - **Property 7: JWT Expiry Detection**
    - **Property 8: JWT Signature Verification Correctness**
    - **Property 9: JWT Structure Validation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6**

- [ ] 3. Code Minifier/Beautifier Tool Engine
  - [x] 3.1 Implement CSS and JavaScript minify/beautify in `src/pages/code-minifier-beautifier.astro`
    - Add pure functions: `minifyCss(input)`, `beautifyCss(input)`, `minifyJs(input)`, `beautifyJs(input)`
    - CSS minify: remove block comments, collapse whitespace, remove whitespace around delimiters, remove trailing semicolons before `}`
    - CSS beautify: 2-space indent per nesting, line break after `;` and `}`, opening brace on same line, space after colons
    - JS minify: remove block/line comments, collapse whitespace, remove whitespace around operators/delimiters
    - JS beautify: 2-space indent per brace nesting, line break after `;` and `}`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.2 Implement HTML minify/beautify and statistics in `src/pages/code-minifier-beautifier.astro`
    - Add pure functions: `minifyHtml(input)`, `beautifyHtml(input)`, `calcStats(original, output)`
    - HTML minify: remove comments, collapse whitespace, remove whitespace between `><`
    - HTML beautify: 2-space indent per tag nesting, each tag on own line, self-closing tags as leaf nodes
    - Display stats: original bytes, output bytes, percentage savings rounded to 1 decimal
    - Handle empty input: show 0 B / 0 B / 0% stats
    - _Requirements: 3.5, 3.6, 3.7, 3.9_

  - [ ] 3.3 Implement batch file processing in `src/pages/code-minifier-beautifier.astro`
    - Wire file drop zone to accept .css, .js, .html files (max 5 MB each)
    - Auto-detect language from extension, minify each file, display per-file results
    - Reject unsupported extensions with error message
    - _Requirements: 3.8, 3.10_

  - [ ]* 3.4 Write property tests for Code Minifier
    - **Property 10: Code Minification Idempotence**
    - **Property 11: Beautify-then-Minify Equivalence**
    - **Property 12: Compression Statistics Formula Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

- [ ] 4. Markdown Editor Tool Engine
  - [x] 4.1 Implement Markdown rendering and toolbar in `src/pages/markdown-editor.astro`
    - Add pure functions: `renderMarkdown(input)`, `insertSyntax(text, selStart, selEnd, type)`
    - Implement live preview rendering within 100ms of keystroke (CommonMark: headings, bold, italic, links, images, code blocks, blockquotes, lists, hr, tables)
    - Show placeholder message when input is empty
    - Wire toolbar buttons (bold, italic, heading, link, code, blockquote) to wrap selected text or insert at cursor
    - _Requirements: 4.1, 4.2, 4.3, 4.8_

  - [ ] 4.2 Implement templates, table generator, and export in `src/pages/markdown-editor.astro`
    - Add pure function: `generateTable(rows, cols)`
    - Wire template dropdown to load Minimal Project README, Professional Project README, Developer Profile README
    - Wire Table Generator dialog: accept rows (1–10) and columns (1–10), insert Markdown table at cursor
    - Wire Export HTML to generate downloadable HTML file with embedded styles
    - Wire Export MD to generate downloadable .md file
    - _Requirements: 4.4, 4.5, 4.6, 4.7_

  - [ ]* 4.3 Write property tests for Markdown Editor
    - **Property 13: Markdown Rendering Produces Correct HTML Elements**
    - **Property 14: Markdown Toolbar Syntax Wrapping**
    - **Property 15: Markdown Table Generation Structure**
    - **Validates: Requirements 4.1, 4.3, 4.7, 4.8**

- [ ] 5. Color Converter Tool Engine
  - [x] 5.1 Implement color conversion logic in `src/components/tools/ColorConverterTool.astro`
    - Add pure functions: `hexToRgb(hex)`, `rgbToHex(r,g,b)`, `rgbToHsl(r,g,b)`, `hslToRgb(h,s,l)`, `rgbToCmyk(r,g,b)`, `cmykToRgb(c,m,y,k)`
    - Wire all format input fields to convert and update all other fields within 200ms
    - Retain last valid color state on invalid input
    - Wire visual color picker to update all outputs within 100ms
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 5.2 Implement palette generation and contrast checker in `src/components/tools/ColorConverterTool.astro`
    - Add pure functions: `calculateContrast(fg, bg)`, `generatePalettes(hsl)`
    - Generate 4 palette types on color change: complementary (180°), analogous (±30°), triadic (120°), monochromatic (5 lightness variations)
    - Wire contrast checker: calculate ratio, show pass/fail for AA normal (4.5:1), AA large (3:1), AAA normal (7:1), AAA large (4.5:1)
    - _Requirements: 5.4, 5.5_

  - [ ] 5.3 Implement gradient builder and image color extractor in `src/components/tools/ColorConverterTool.astro`
    - Wire gradient builder: two color stops + angle slider, live preview, copyable CSS linear-gradient with fallback
    - Wire image upload (JPEG, PNG, GIF, SVG, WebP, max 10 MB): render on canvas, click pixel to select color
    - Reject invalid file types or oversized files with error message
    - _Requirements: 5.6, 5.7, 5.8_

  - [ ]* 5.4 Write property tests for Color Converter
    - **Property 16: Color Format Conversion Round-Trip**
    - **Property 17: Palette Generation Geometric Correctness**
    - **Property 18: WCAG Contrast Ratio Calculation**
    - **Property 19: CSS Gradient Code Validity**
    - **Validates: Requirements 5.1, 5.4, 5.5, 5.6**

- [ ] 6. Checkpoint - Tool engines 1–5
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Timestamp Converter Tool Engine
  - [x] 7.1 Implement timestamp conversion and live clock in `src/pages/timestamp.astro`
    - Add pure functions: `timestampToDate(ts)`, `dateToTimestamp(dateStr)`, `detectTimestampFormat(input)`
    - Wire timestamp→date: display UTC (RFC 2822), local timezone, ISO 8601, day of week, day of year
    - Wire date→timestamp: convert human-readable date string to Unix seconds and milliseconds
    - Auto-detect seconds vs milliseconds based on digit count (≤10 digits = seconds, >10 = milliseconds)
    - Wire live clock: update every 1s showing current Unix timestamp, UTC, and local time
    - Handle non-numeric and unparseable inputs with error messages
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7, 6.8_

  - [ ] 7.2 Implement timezone comparison and cron parser in `src/pages/timestamp.astro`
    - Add pure functions: `parseCron(expr)`, `getNextCronRuns(parsed, n)`, `convertTimezones(date, zones)`
    - Display converted time for 6+ predefined timezones (UTC, US Eastern, US Pacific, CET, India, Japan)
    - Parse 5-field cron expressions into human-readable description + next 5 execution times
    - Show error for invalid cron expressions (wrong field count or out-of-range values)
    - _Requirements: 6.4, 6.5, 6.9_

  - [ ]* 7.3 Write property tests for Timestamp Converter
    - **Property 20: Timestamp/Date Conversion Round-Trip**
    - **Property 21: Timezone Offset Correctness**
    - **Property 22: Cron Next Runs Are Chronological and Valid**
    - **Property 23: Timestamp Format Auto-Detection**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5, 6.6**

- [ ] 8. Hash Generator Tool Engine
  - [x] 8.1 Implement text hashing and HMAC in `src/pages/hash-generator.astro`
    - Add pure functions: `computeHash(algo, data)`, `computeHmac(algo, data, key)`, `md5(input)`
    - Compute MD5, SHA-1, SHA-256, SHA-512 on every input change (keystroke, paste, cut)
    - Implement inline MD5 (RFC 1321) since Web Crypto API doesn't support it
    - Wire HMAC mode: compute HMAC variants when key ≥ 1 char using Web Crypto API
    - Display all results as lowercase hex strings
    - Clear all outputs and show placeholder when input is empty and HMAC off
    - Wire Clear button to reset all fields
    - _Requirements: 7.1, 7.2, 7.4, 7.7, 7.8_

  - [ ] 8.2 Implement file checksum and copy functionality in `src/pages/hash-generator.astro`
    - Add pure function: `hashFile(arrayBuffer, algo)`
    - Wire file drop/upload: read as ArrayBuffer, compute MD5 + SHA-256, display filename and size
    - Show warning for files >50 MB (don't block, just warn)
    - Wire Copy buttons: copy hash to clipboard, show 2-second confirmation indicator
    - _Requirements: 7.3, 7.5, 7.6_

  - [ ]* 8.3 Write property tests for Hash Generator
    - **Property 24: Hash and HMAC Output Format and Determinism**
    - **Validates: Requirements 7.1, 7.2, 7.4**

- [ ] 9. Checkpoint - All tool engines complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Blog and Content System
  - [ ] 10.1 Set up content collection schema in `src/content/config.ts`
    - Define blog collection with Zod schema: title, description (max 160), author, datePublished, dateModified, topic enum, tools array, excerpt
    - Create `src/content/blog/` directory
    - _Requirements: 8.1, 8.5_

  - [ ] 10.2 Create blog index page at `src/pages/blog/index.astro`
    - List all posts sorted by datePublished descending
    - Display title, excerpt, date, and category for each post
    - Add filter UI for tool category and topic category
    - _Requirements: 8.3_

  - [ ] 10.3 Create dynamic blog post page at `src/pages/blog/[...slug].astro`
    - Render Markdown content as static HTML
    - Include Article schema JSON-LD (author, datePublished, dateModified)
    - Auto-link tool names to corresponding tool pages based on `tools` frontmatter field
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ] 10.4 Write 4 blog articles as Markdown content files
    - `src/content/blog/what-is-jwt.md` — "What is JWT? A Complete Guide"
    - `src/content/blog/jwt-vs-session-tokens.md` — "JWT vs Session Tokens"
    - `src/content/blog/css-minifier-reduce-page-load.md` — "CSS Minifier to Reduce Page Load"
    - `src/content/blog/regex-email-validation.md` — "How to Write Regex for Email Validation"
    - Each with target keyword in H1, unique meta description, correct frontmatter schema
    - _Requirements: 9.5, 8.4, 8.6_

- [ ] 11. SEO Sub-Pages and Regex Pattern Library
  - [ ] 11.1 Create additional Color Converter sub-pages
    - Create `src/pages/color-converter/hsl-to-hex.astro` with unique title, meta description, canonical URL
    - Create `src/pages/color-converter/cmyk-to-rgb.astro` with unique title, meta description, canonical URL
    - Each uses `ColorConverterTool.astro` with appropriate `pageMode` prop
    - Implement `pageMode` highlighting logic: add `.conversion-highlight` class to source/target fields
    - _Requirements: 9.1, 9.3_

  - [ ] 11.2 Create Regex Pattern Library page at `src/pages/regex-patterns/index.astro`
    - Build catalog with 9+ categories (email, phone, URL, date, IP, credit card, password, HTML tags, +1 more)
    - Minimum 2 patterns per category with name, description, example match
    - Add text filter input for searching pattern names/descriptions
    - Add "Test in RegEx Tester" link for each pattern that navigates with pre-loaded pattern
    - _Requirements: 9.2, 9.4, 9.6_

- [ ] 12. Cross-Tool Internal Linking
  - [ ] 12.1 Create `src/components/RelatedTools.astro` component
    - Define TOOL_CATEGORIES mapping (encoding, formatting, security, conversion, development)
    - Accept `currentTool` prop, return 2–4 related tools from same category excluding current
    - Render as linked cards with tool name and brief description
    - _Requirements: 14.1, 14.5_

  - [ ] 12.2 Integrate RelatedTools and inline links across tool pages
    - Add `<RelatedTools>` component to each of the 10 tool pages below tool content area
    - Add 1–3 inline anchor links within SEO FAQ/description sections pointing to related tools
    - Add all 10 tool links to Layout footer navigation
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 12.3 Write property test for Related Tools
    - **Property 25: Related Tools Category Mapping**
    - **Validates: Requirements 14.1**

- [ ] 13. Google AdSense Integration
  - [ ] 13.1 Implement non-blocking AdSense loader in `src/layouts/Layout.astro`
    - Use `requestIdleCallback` with 5-second timeout fallback to load AdSense script
    - Reserve fixed-dimension containers (min-height 90px, max-width 728px) with "Advertisement" placeholder
    - Place 1 ad slot in footer area, up to 2 between SEO content sections on tool pages
    - Implement 10-second timeout: collapse container to zero height on failure (no border, no background)
    - Ensure ad containers are outside interactive tool areas
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 14. Performance Optimisation
  - [ ] 14.1 Optimise critical rendering path in `src/layouts/Layout.astro`
    - Inline critical above-the-fold CSS, defer non-critical stylesheets
    - Verify self-hosted fonts use `font-display: swap` (no external font requests)
    - Confirm `compressHTML: true` is active in astro.config.mjs
    - Verify all tool scripts load as `type="module"` (async, non-blocking)
    - Add explicit width/height on all image elements for CLS < 0.1
    - Target: page weight < 200KB critical path, LCP < 1.5s, FCP < 1.0s
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 15. Service Worker and PWA
  - [ ] 15.1 Create service worker at `public/sw.js`
    - Implement install event: cache app shell (HTML skeleton, CSS, fonts, favicon)
    - Implement fetch strategy: cache-first for static assets, network-first for HTML (3s timeout)
    - Serve cached response within 200ms when offline
    - Implement LRU eviction when cache exceeds 50 MB (retain app shell)
    - _Requirements: 12.1, 12.2, 12.4, 12.6_

  - [ ] 15.2 Implement SW update notification and offline fallback
    - Create offline fallback page at `src/pages/offline.astro` with message and cached tool links
    - Implement update detection: activate new SW on next navigation, show non-blocking toast
    - Register SW from Layout.astro on first page load
    - _Requirements: 12.3, 12.5_

- [ ] 16. Mobile UX and Accessibility Polish
  - [ ] 16.1 Implement mobile sidebar drawer and touch targets
    - Collapse sidebar to hamburger drawer below 768px viewport
    - Close drawer on backdrop tap or Escape key press
    - Ensure all interactive elements have min 44×44px touch targets on mobile
    - Stack tool split-panel layouts vertically (input above output) on mobile
    - _Requirements: 13.1, 13.2, 13.6_

  - [ ] 16.2 Implement focus management and accessibility attributes
    - Add visible 2px focus indicators with 3:1 contrast ratio on all interactive elements
    - Add aria-label / associated label on every interactive element
    - Add role attributes on custom controls
    - Add aria-live="polite" regions for dynamic content updates (tool outputs, status messages)
    - Implement focus trap on drawer open (focus first element), restore focus on close (to hamburger button)
    - Verify colour contrast: 4.5:1 for body text, 3:1 for large text
    - _Requirements: 13.3, 13.4, 13.5, 13.7_

- [ ] 17. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All tool pages already have HTML/CSS scaffolding — only the `<script>` section logic needs implementation
- Pure computation functions should be extractable for testing (defined before DOM glue code)
- The project uses Astro 6.4.4 with pure client-side JavaScript (no React/Vue/Svelte)
- Web Crypto API is used for SHA/HMAC hashing and JWT signing
- MD5 requires a custom inline implementation (not in Web Crypto API)
- Property tests use fast-check with Vitest runner (minimum 100 iterations)
- Blog content uses Astro Content Collections with Zod schema validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "5.1", "7.1", "8.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.2", "4.2", "5.2", "7.2", "8.2"] },
    { "id": 2, "tasks": ["1.3", "3.3", "5.3", "10.1", "11.1"] },
    { "id": 3, "tasks": ["1.4", "2.3", "3.4", "4.3", "5.4", "7.3", "8.3", "10.2", "11.2"] },
    { "id": 4, "tasks": ["10.3", "10.4", "12.1"] },
    { "id": 5, "tasks": ["12.2", "12.3", "13.1"] },
    { "id": 6, "tasks": ["14.1", "15.1"] },
    { "id": 7, "tasks": ["15.2", "16.1"] },
    { "id": 8, "tasks": ["16.2"] }
  ]
}
```
