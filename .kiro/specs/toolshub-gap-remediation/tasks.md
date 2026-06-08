# Implementation Plan: ToolsHub Gap Remediation

## Overview

This plan implements 15 feature gaps across tool engine enhancements, infrastructure/content improvements, and quality/performance hardening for the ToolsHub Astro static site. Tasks are organized into logical phases: shared infrastructure first, then tool engines in parallel groups, followed by content migration, and finally quality/performance polish. All tool logic is client-side JavaScript within inline `<script type="module">` blocks in `.astro` pages.

## Tasks

- [x] 1. Shared Infrastructure and Components
  - [x] 1.1 Create the RelatedTools component
    - Create `src/components/RelatedTools.astro` with a `currentTool` prop
    - Implement category map: encoding, formatting, security, conversion, development
    - Logic: find current tool's category → select 2–4 other tools → supplement from adjacent categories if fewer than 2 available
    - Render cards with tool name, link, and icon; never include the current tool
    - _Requirements: 8.1, 8.2, 8.5_

  - [x] 1.2 Add footer navigation with all 10 tool links
    - Update `src/layouts/Layout.astro` footer section to include links to all 10 tool pages in a single navigable group
    - Links: JSON Formatter, Base64, URL Encoder/Decoder, RegEx Tester, JWT Decoder, Code Minifier, Markdown Editor, Color Converter, Timestamp Converter, Hash Generator
    - _Requirements: 8.4_

  - [x] 1.3 Integrate RelatedTools component into all tool pages
    - Add `<RelatedTools currentTool="..." />` to each of the 10 tool pages, positioned below tool content and above SEOContent section
    - _Requirements: 8.1, 8.3_

  - [x] 1.4 Add inline cross-links to SEO/FAQ sections
    - Update SEOContent sections on each tool page to include 1–3 inline anchor links pointing to functionally related ToolsHub tool pages
    - _Requirements: 8.3_

  - [ ]* 1.5 Write property test for RelatedTools category correctness
    - **Property 17: Related Tools Category Correctness**
    - **Validates: Requirements 8.1, 8.5**

- [x] 2. URL Encoder Batch Processing and UTM Builder
  - [x] 2.1 Implement batch encode/decode functionality
    - Add Batch tab UI to `src/pages/url-encoder-decoder.astro`
    - Implement `batchEncode()`: encode each non-empty line with `encodeURIComponent`, preserve empty lines as empty output
    - Implement `batchDecode()`: decode each line, prefix invalid percent-encoded lines with error indicator, continue processing remaining lines
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Implement URL query parameter parsing and rebuilding
    - Implement `parseQueryParams()`: extract key-value pairs into editable table with per-row delete and add-row buttons
    - Handle malformed URL case: display error, do not modify table
    - Display placeholder message when no query params found
    - Implement `rebuildUrl()`: combine base path with table params, omit empty-key rows, display in output
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 2.3 Implement UTM Builder UI and generation logic
    - Add UTM Builder section with fields: Website URL, Source, Medium, Campaign, Term (optional), Content (optional)
    - Implement `generateUtm()`: validate all 4 required fields non-empty, validate URL structure, produce percent-encoded UTM URL with params in order
    - Display validation alerts for missing required fields or invalid URL
    - _Requirements: 1.6, 1.7, 1.8_

  - [ ]* 2.4 Write property tests for URL batch and UTM
    - **Property 1: Batch Encode Preserves Line Structure**
    - **Property 2: Batch Decode Round-Trip with Error Recovery**
    - **Property 3: URL Query String Parse/Rebuild Round-Trip**
    - **Property 4: UTM URL Generation Correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.6**

- [x] 3. JWT Signature Verification and Token Generation
  - [x] 3.1 Implement JWT signature verification
    - Add secret key input and Verify Signature button to `src/pages/jwt-decoder.astro`
    - Implement `verifySignature()`: validate 3-segment structure, compute HMAC-SHA256 via Web Crypto API, compare with token signature segment
    - Display "Valid Signature", "Invalid Signature", or "Invalid token structure" status
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Implement JWT token generation
    - Add header/payload JSON fields, secret key input, and Generate Token button
    - Implement `generateToken()`: validate JSON fields, validate non-empty secret, produce Base64URL(header).Base64URL(payload).Base64URL(signature)
    - Display appropriate error messages for invalid JSON or empty secret
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 3.3 Implement Share URL functionality
    - Implement `shareUrl()`: construct URL with token as query param, copy to clipboard, show 2-second confirmation
    - Handle clipboard failure with error message
    - _Requirements: 2.6, 2.7_

  - [ ]* 3.4 Write property test for JWT sign/verify round-trip
    - **Property 5: JWT Sign/Verify Round-Trip**
    - **Validates: Requirements 2.1, 2.3**

- [x] 4. Code Minifier HTML Mode and Batch Processing
  - [x] 4.1 Implement HTML minify and beautify engines
    - Add HTML mode option to `src/pages/code-minifier-beautifier.astro`
    - Implement `minifyHtml()`: remove comments, collapse whitespace, remove whitespace between tags
    - Implement `beautifyHtml()`: 2-space indent per nesting level, each tag on own line, void elements as leaf nodes
    - Display compression statistics (original bytes, output bytes, percentage) with 0% for empty input
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [x] 4.2 Implement batch file processing
    - Add batch file drop zone UI accepting .css, .js, .html files (max 5 MB each, max 50 files)
    - Implement `processBatchFiles()`: auto-detect language from extension, minify each file, display per-file results with filename, sizes, savings %, download link
    - Reject unsupported extensions or oversized files with specific error messages, continue processing valid files
    - _Requirements: 3.4, 3.5_

  - [ ]* 4.3 Write property tests for HTML minification
    - **Property 6: HTML Minification Invariants**
    - **Property 7: HTML Beautify Indentation Consistency**
    - **Property 8: Batch File Minification Per-File Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [~] 5. Checkpoint - Core tool engines
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Markdown Editor Templates and Export
  - [x] 6.1 Implement template system
    - Add template dropdown to `src/pages/markdown-editor.astro` with: Minimal Project README, Professional Project README, Developer Profile README
    - Implement `loadTemplate()`: replace entire input panel content with selected template text
    - _Requirements: 4.1_

  - [x] 6.2 Implement table generator
    - Add Table Generator button with rows (1–10) and columns (1–10) inputs
    - Implement `generateTable()`: insert formatted Markdown table at cursor position with header row, separator row, and data rows
    - _Requirements: 4.2_

  - [x] 6.3 Implement HTML and Markdown export
    - Implement `exportHtml()`: generate complete HTML document with rendered Markdown, style block, trigger download as "exported-markdown.html"
    - Implement `exportMd()`: trigger download of raw Markdown as "README.md"
    - Handle empty input: still generate and download files without error
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ]* 6.4 Write property tests for Markdown features
    - **Property 9: Markdown Table Generator Structure**
    - **Property 10: Markdown Export HTML Document Integrity**
    - **Validates: Requirements 4.2, 4.3**

- [x] 7. Color Converter Palettes, Gradient, and Image Extractor
  - [x] 7.1 Implement palette generation
    - Add palette display section to `src/pages/color-converter.astro` and `src/components/tools/ColorConverterTool.astro`
    - Implement `generatePalettes()`: complementary (180°), analogous (±30°), triadic (120° intervals), monochromatic (5 lightness variations)
    - Each swatch shows hex on hover and loads color into main converter on click
    - _Requirements: 5.1_

  - [x] 7.2 Implement WCAG contrast checker
    - Add foreground/background color inputs and contrast display section
    - Implement `checkContrast()`: compute relative luminance, calculate ratio, display pass/fail for AA normal (4.5:1), AA large (3:1), AAA normal (7:1), AAA large (4.5:1)
    - Include preview card with sample text
    - _Requirements: 5.2_

  - [x] 7.3 Implement gradient builder
    - Add two color stop inputs and angle slider (0–360°)
    - Implement `buildGradient()`: live gradient preview, output CSS with background-color fallback + linear-gradient declaration, copy button
    - _Requirements: 5.3_

  - [x] 7.4 Implement image color extraction
    - Add file upload (browse + drag-and-drop) for JPEG, PNG, GIF, SVG, WebP (max 10 MB)
    - Implement `extractFromImage()`: render on canvas, show pixel color on hover, click loads color into converter fields
    - Handle oversize/unsupported files and canvas render failures with error messages
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ]* 7.5 Write property tests for color features
    - **Property 11: Color Palette Generation Mathematical Correctness**
    - **Property 12: WCAG Contrast Ratio Calculation**
    - **Property 13: Gradient CSS Output Format**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 8. Timestamp Timezone Comparison and Cron Parser
  - [x] 8.1 Implement timezone comparison grid
    - Add timezone grid to `src/pages/timestamp.astro` displaying 6 predefined timezones: UTC, America/New_York, America/Los_Angeles, Europe/Paris, Asia/Kolkata, Asia/Tokyo
    - Implement `convertTimezones()`: interpret ≤10 digits as seconds, >10 digits as milliseconds, format each as medium date + short time using Intl.DateTimeFormat
    - Handle non-numeric/unparseable input with error messages
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Implement cron expression parser
    - Add cron input field and results display
    - Implement `parseCron()`: validate 5-field format, validate field ranges (min 0–59, hour 0–23, dom 1–31, month 1–12, dow 0–6)
    - Support wildcards, step values (*/n), comma lists, hyphenated ranges
    - Implement `getNextCronRuns()`: simulate up to 30,000 minute increments, display next 5 execution times in local timezone
    - Display human-readable English description
    - Handle invalid field count, out-of-range values, and simulation exhaustion with appropriate messages
    - _Requirements: 6.4, 6.5, 6.6, 6.7_

  - [ ]* 8.3 Write property tests for timestamp and cron
    - **Property 14: Timestamp Timezone Conversion**
    - **Property 15: Cron Expression Parsing and Execution Scheduling**
    - **Validates: Requirements 6.1, 6.2, 6.4**

- [x] 9. Hash Generator File Checksum and Copy
  - [x] 9.1 Implement file checksum computation
    - Add File Checksum tab to `src/pages/hash-generator.astro` with file drop/select zone
    - Implement `computeFileChecksum()`: read as ArrayBuffer, compute MD5 (JS implementation) and SHA-256 (Web Crypto), display as lowercase hex
    - Show filename and file size in KB (2 decimal places)
    - Display progress indicator during computation, completion status after
    - Show warning for files >50 MB without blocking computation
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.2 Implement copy hash functionality
    - Implement `copyHash()`: copy non-empty hash to clipboard, change button text to confirmation for 2 seconds
    - Skip clipboard write if hash field is empty, leave button unchanged on failure
    - _Requirements: 7.4, 7.5, 7.6_

  - [ ]* 9.3 Write property test for file checksum
    - **Property 16: File Checksum Determinism**
    - **Validates: Requirements 7.1**

- [~] 10. Checkpoint - All tool engines complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Service Worker Rewrite
  - [x] 11.1 Implement service worker with caching strategies
    - Rewrite `public/sw.js` with cache-first strategy for static assets (CSS, JS, fonts, images) and network-first (3-second timeout) for HTML navigation
    - Precache all 10 tool pages + /offline + app shell assets on install
    - _Requirements: 9.1, 9.2_

  - [x] 11.2 Implement offline fallback page
    - Create `src/pages/offline.astro` rendering offline message with links to all 10 tool pages
    - No JavaScript dependencies — static HTML only
    - Configure service worker to serve /offline when no cache + no network for HTML requests
    - _Requirements: 9.3, 9.6_

  - [-] 11.3 Implement LRU cache eviction
    - Track cache entry metadata (URL, lastAccessed timestamp, size, isAppShell flag)
    - On each cache write, check total size against 50 MB threshold
    - Evict entries in ascending last-access-time order, exempt app shell assets
    - _Requirements: 9.4_

  - [-] 11.4 Implement update toast notification
    - On `controllerchange` event, inject toast DOM at bottom-center viewport
    - Auto-dismiss after 8 seconds or on dismiss button click
    - _Requirements: 9.5_

  - [ ]* 11.5 Write property test for LRU eviction
    - **Property 18: LRU Cache Eviction Ordering**
    - **Validates: Requirements 9.4**

- [ ] 12. Blog Migration to Content Collections
  - [x] 12.1 Set up Content Collections schema and configuration
    - Create `src/content/config.ts` with blog collection Zod schema (title, description, author, datePublished, dateModified, topic, tools, excerpt)
    - Validate field constraints: title max 100, description max 160, excerpt max 200, topic enum, tools enum array
    - _Requirements: 10.1_

  - [x] 12.2 Migrate existing blog posts to Content Collections
    - Convert existing `.astro` blog pages to Markdown files in `src/content/blog/` with proper frontmatter
    - Ensure all posts include datePublished, dateModified, topic, tools, excerpt fields
    - _Requirements: 10.1, 10.2_

  - [x] 12.3 Rebuild blog index page with sorting and filtering
    - Update `src/pages/blog/index.astro` to query Content Collection, sort by datePublished descending
    - Display title, excerpt, datePublished (YYYY-MM-DD), topic label, tool category tags
    - Implement client-side category and topic filter UI, show all by default, update without page reload
    - _Requirements: 10.2, 10.3, 14.5_

  - [-] 12.4 Implement blog auto-linking and JSON-LD
    - Create utility to auto-link first occurrence of each tool name from frontmatter tools array to correct tool page path
    - Handle invalid tool identifiers gracefully (ignore, process remaining)
    - Add Article schema JSON-LD to blog post layout with author, datePublished, dateModified in ISO 8601
    - _Requirements: 10.4, 10.5, 10.6_

  - [-] 12.5 Create regex email validation blog article
    - Create blog post at `/blog/regex-email-validation` titled "How to Write Regex for Email Validation"
    - Include target keyword in H1, unique meta description (50–160 chars), at least one link to /regex-tester
    - Frontmatter: topic "tutorial", tools ["regex-tester"], all required schema fields
    - _Requirements: 10.7, 14.1_

  - [ ]* 12.6 Write property tests for blog system
    - **Property 19: Blog Post Chronological Ordering**
    - **Property 20: Blog Auto-Link Tool Names**
    - **Property 21: Blog Post JSON-LD Schema Correctness**
    - **Validates: Requirements 10.2, 10.4, 10.6**

- [ ] 13. AdSense Lazy Loading
  - [~] 13.1 Implement AdSense loader with requestIdleCallback
    - Add inline script to `src/layouts/Layout.astro` that loads AdSense via requestIdleCallback after FCP
    - Implement setTimeout 5-second fallback for browsers without requestIdleCallback
    - On script load, initialize ad slots; on failure or no fill after 10s, collapse container to 0px (no transition, border, or background)
    - _Requirements: 11.1, 11.3_

  - [~] 13.2 Add ad container elements with fixed dimensions
    - Add Ad_Container elements (90px height, 100% width, max 728px) in DOM positions below tool content, above footer
    - Ensure containers never overlap or sit between tool inputs/outputs/controls
    - Maximum 3 per page
    - _Requirements: 11.2, 11.4, 11.5, 11.6_

- [ ] 14. Color Sub-Page PageMode Activation
  - [-] 14.1 Implement PageMode activation logic
    - Update `src/components/tools/ColorConverterTool.astro` client script to read `data-page-mode` attribute on mount
    - Parse source/target format from pageMode string (e.g., "hex-to-rgb")
    - Set focus on source input, apply `.conversion-highlight` class to target output
    - Pre-select source format tab/section
    - Default to HEX active with no highlights when no pageMode
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [~] 14.2 Verify pageMode prop passing on all color sub-pages
    - Confirm all 12 color sub-pages under `/color-converter/` pass correct pageMode prop to ColorConverterTool
    - _Requirements: 13.1_

  - [ ]* 14.3 Write property test for PageMode activation
    - **Property 22: PageMode Focus and Highlight Activation**
    - **Validates: Requirements 13.2, 13.3**

- [ ] 15. SEO Content - Regex Pattern Library Links
  - [~] 15.1 Add "Test in RegEx Tester" links to pattern library
    - Update `src/pages/regex-patterns.astro` to include a "Test in RegEx Tester" link for each pattern
    - Link href: `/regex-tester?pattern={URI-encoded pattern}`
    - _Requirements: 14.2_

  - [~] 15.2 Implement query parameter loading on RegEx Tester page
    - Update `src/pages/regex-tester.astro` to read `pattern` query parameter on load
    - URI-decode value and populate regex input field
    - Handle empty or undecodable parameter: leave field blank, show default empty-state
    - _Requirements: 14.3, 14.4_

  - [ ]* 15.3 Write property test for regex pattern link round-trip
    - **Property 23: Regex Pattern Library Link Round-Trip**
    - **Validates: Requirements 14.2, 14.3**

- [~] 16. Checkpoint - Infrastructure and content complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Accessibility and UX Polish
  - [~] 17.1 Implement focus indicators and ARIA live regions
    - Add CSS for visible focus indicators (min 2px outline, ≥3:1 contrast) on all focusable elements in `src/styles/global.css`
    - Add `aria-live="polite"` to all dynamic tool output areas across tool pages
    - _Requirements: 12.1, 12.2_

  - [~] 17.2 Implement mobile drawer focus management
    - Update `src/components/Sidebar.astro` to add `role="dialog"` and `aria-modal="true"` on drawer container (viewports <768px)
    - Move focus to close button on open, trap Tab/Shift+Tab within drawer
    - Return focus to hamburger button on close
    - Close drawer on Escape key press and return focus
    - _Requirements: 12.3, 12.4, 12.5_

  - [~] 17.3 Implement touch targets and inline validation errors
    - Ensure all interactive elements have min 44×44px touch targets on viewports <768px
    - Implement inline error message pattern: adjacent to input, associated via `aria-describedby`, removed when input becomes valid
    - Remove all `alert()` calls from tool scripts
    - _Requirements: 12.6, 12.7, 12.8_

  - [ ]* 17.4 Write property test for inline validation error association
    - **Property 24: Inline Validation Error Association**
    - **Validates: Requirements 12.7**

- [ ] 18. Performance Hardening
  - [~] 18.1 Implement font-display and image dimension attributes
    - Ensure all @fontsource font-face rules include `font-display: swap`
    - Add explicit width and height attributes to all `<img>` elements across pages
    - _Requirements: 15.1, 15.2, 15.6_

  - [~] 18.2 Verify build output and script loading
    - Confirm `compressHTML: true` produces minified HTML (no comments, no excess whitespace)
    - Ensure all inline tool scripts use `type="module"` for deferred parsing
    - _Requirements: 15.3, 15.4_

  - [~] 18.3 Run Lighthouse audit and resolve performance issues
    - Run Lighthouse mobile audit on key pages
    - Target: Performance ≥98, LCP <1.5s, FCP <1.0s, TBT <150ms
    - Fix any issues identified to meet thresholds
    - _Requirements: 15.5_

- [~] 19. Final Checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All tool logic is client-side JavaScript in inline `<script type="module">` blocks
- Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) with minimum 100 iterations per property
- Checkpoints ensure incremental validation between logical phases
- The project uses Astro 6.4.4 as a static site generator with no server-side runtime
- Web Crypto API is used for JWT and SHA-256 operations; MD5 requires a JS implementation
- Content Collections require `src/content/config.ts` with Zod schemas

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "12.1"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1", "3.1", "4.1", "6.1", "7.1", "8.1", "11.1", "12.2"] },
    { "id": 2, "tasks": ["1.5", "2.2", "3.2", "4.2", "6.2", "7.2", "7.3", "8.2", "9.1", "11.2", "12.3"] },
    { "id": 3, "tasks": ["2.3", "3.3", "6.3", "7.4", "9.2", "11.3", "11.4", "12.4", "14.1"] },
    { "id": 4, "tasks": ["2.4", "3.4", "4.3", "6.4", "7.5", "8.3", "9.3", "11.5", "12.5", "14.2"] },
    { "id": 5, "tasks": ["12.6", "13.1", "15.1"] },
    { "id": 6, "tasks": ["13.2", "15.2", "14.3"] },
    { "id": 7, "tasks": ["15.3", "17.1", "18.1"] },
    { "id": 8, "tasks": ["17.2", "17.3", "18.2"] },
    { "id": 9, "tasks": ["17.4", "18.3"] }
  ]
}
```
