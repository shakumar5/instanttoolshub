# Requirements Document

## Introduction

This document captures the requirements for completing the remaining gaps in the ToolsHub developer tools project. ToolsHub is an Astro 6.4.4 static site with 10 client-side developer tools. A previous spec (`toolshub-completion`) defined the full build-out but left several items partially implemented or unstarted. This spec targets only the incomplete work: finishing tool engine features (batch/UTM, signature verify, HTML mode, templates/export, palettes/gradient, timezone/cron, file checksum), rewriting the service worker with proper caching strategies, migrating the blog to Astro Content Collections, implementing AdSense lazy loading, completing accessibility and UX polish, activating color sub-page mode behaviour, filling SEO content gaps (regex email validation article, pattern library test links, blog category filter), and performance hardening.

## Glossary

- **Tool_Engine**: The client-side JavaScript logic within a tool page performing core computation (encoding, decoding, parsing, formatting)
- **Service_Worker**: The `public/sw.js` background script enabling offline access, asset caching, and update notifications for PWA functionality
- **Content_Collection**: An Astro content collection using Zod schema validation to manage Markdown blog posts with typed frontmatter
- **AdSense_Loader**: The requestIdleCallback-based script that loads Google AdSense without blocking the main thread
- **Ad_Container**: A pre-reserved fixed-dimension HTML element that holds an AdSense ad unit with zero CLS contribution
- **RelatedTools_Component**: An Astro component (`src/components/RelatedTools.astro`) that renders 2-4 contextual links to related tool pages
- **Color_Sub_Page**: A dedicated page at `/color-converter/{conversion}` that activates a specific source/target format pair on the Color Converter
- **PageMode**: The prop passed to ColorConverterTool that determines which input field is active and which output field is highlighted on a color sub-page
- **LRU_Eviction**: A cache management strategy that removes the least recently used entries when storage exceeds the configured limit
- **Offline_Fallback**: A dedicated `/offline` page served when the requested resource is unavailable and the network is unreachable
- **Update_Toast**: A non-blocking notification informing the user that a new version of the service worker is available
- **Focus_Trap**: A keyboard navigation pattern that confines Tab focus within a modal or drawer until the user dismisses it
- **CLS**: Cumulative Layout Shift — a Core Web Vital metric measuring visual stability during page load
- **TBT**: Total Blocking Time — the sum of all time periods where a long task blocked the main thread beyond 50ms
- **Regex_Pattern_Library**: The curated catalog page at `/regex-patterns` displaying categorized regex patterns with test links

## Requirements

### Requirement 1: URL Encoder Batch Processing and UTM Builder Completion

**User Story:** As a developer, I want to batch encode/decode multiple URLs and build UTM campaign URLs, so that I can handle bulk URL operations and marketing link generation without external tools.

#### Acceptance Criteria

1. WHEN a user enters multiple lines of text in the Batch tab and clicks Batch Encode, THE Tool_Engine SHALL encode each non-empty line independently using encodeURIComponent, display results line-by-line in the output panel, and preserve empty lines (containing no characters or only whitespace) as empty output lines
2. WHEN a user enters multiple lines of percent-encoded text in the Batch tab and clicks Batch Decode, THE Tool_Engine SHALL decode each non-empty line independently using decodeURIComponent and display results line-by-line, prefixing any line that contains invalid percent-encoded sequences with an error indicator text that includes the original input, without halting processing of remaining lines
3. WHEN a user pastes a URL with query parameters and clicks Parse, THE Tool_Engine SHALL extract all key-value pairs into an editable table with per-row delete buttons and an add-row button, displaying a placeholder message stating no query parameters were found when the URL contains no query string
4. IF a user clicks Parse with a malformed URL that cannot be parsed, THEN THE Tool_Engine SHALL display an error notification indicating the URL is invalid and SHALL NOT modify the existing parameter table
5. WHEN a user clicks Rebuild URL after editing the query parameter table, THE Tool_Engine SHALL combine the parsed base path with the current table parameters using standard query-string encoding, omitting any rows where the key field is empty or contains only whitespace, and display the reconstructed URL in the output field
6. WHEN a user fills in the required UTM fields (Website URL, Campaign Source, Campaign Medium, Campaign Name) with non-empty values and clicks Generate, THE Tool_Engine SHALL produce a fully percent-encoded UTM campaign URL appending utm_source, utm_medium, utm_campaign, and any non-empty optional parameters (utm_term, utm_content) in that order
7. IF a user clicks Generate in the UTM Builder without filling all four required fields, THEN THE Tool_Engine SHALL display a validation alert identifying the missing required fields and SHALL NOT generate or update the URL output
8. IF a user clicks Generate in the UTM Builder with an invalid Website URL that cannot be parsed as a URL, THEN THE Tool_Engine SHALL display an error notification indicating the URL structure is invalid and SHALL NOT generate a UTM link

### Requirement 2: JWT Signature Verification and Token Generation Completion

**User Story:** As a developer, I want to verify JWT signatures and generate test tokens locally, so that I can debug authentication without relying on external services.

#### Acceptance Criteria

1. WHEN a user enters a secret key (1-256 characters) and clicks Verify Signature while a token containing exactly three Base64URL segments separated by dots is present in the decoder input, THE Tool_Engine SHALL compute HMAC-SHA256 over the header.payload portion using the Web Crypto API, compare the computed signature against the token's third segment, and display either a "Valid Signature" or "Invalid Signature" status indicator within the signature verification area
2. IF the user clicks Verify Signature and the decoder input is empty or does not contain exactly three dot-separated segments, THEN THE Tool_Engine SHALL display an "Invalid token structure" status indicator in the signature verification area and SHALL NOT attempt signature computation
3. WHEN a user provides valid JSON in the header field, valid JSON in the payload field, and a secret key of 1-256 characters, and clicks Generate Token, THE Tool_Engine SHALL produce a three-segment HS256-signed JWT string in the format Base64URL(header).Base64URL(payload).Base64URL(signature) and display it in the generated token output area
4. IF the user clicks Generate Token and the header field or payload field contains text that cannot be parsed as JSON, THEN THE Tool_Engine SHALL display an error message indicating which field contains the parse error and SHALL NOT produce a token in the output area
5. IF the user clicks Generate Token and the secret key field is empty, THEN THE Tool_Engine SHALL display an error message indicating that a secret key is required and SHALL NOT produce a token
6. WHEN a user clicks Share URL and the decoder input contains a string with exactly three Base64URL segments separated by dots, THE Tool_Engine SHALL construct a URL consisting of the current page address with the token appended as a "token" query parameter, copy it to the system clipboard, and display a confirmation message for 2 seconds
7. IF the user clicks Share URL and the clipboard write operation fails, THEN THE Tool_Engine SHALL display an error message indicating the clipboard copy failed

### Requirement 3: Code Minifier HTML Mode and Batch File Processing Completion

**User Story:** As a web developer, I want to minify and beautify HTML alongside CSS and JavaScript, and process multiple files at once, so that I can optimise entire projects efficiently.

#### Acceptance Criteria

1. WHEN a user selects HTML mode and clicks Minify, THE Tool_Engine SHALL remove HTML comments (<!-- ... -->), collapse consecutive whitespace characters into a single space, remove whitespace between adjacent closing and opening tags (producing "><" with no space), and display the compressed output in the output panel
2. WHEN a user selects HTML mode and clicks Beautify, THE Tool_Engine SHALL reformat the input with 2-space indentation per tag nesting level, each opening and closing tag on its own line, and void elements (img, input, br, hr, meta, link) and tags ending with "/>" treated as leaf nodes that do not increase indent depth
3. WHEN minification or beautification completes for any mode, THE Tool_Engine SHALL display compression statistics showing original size in bytes, output size in bytes, and percentage difference calculated as ((original minus output) divided by original multiplied by 100) rounded to one decimal place; IF the original size is 0 bytes, THEN THE Tool_Engine SHALL display 0% as the percentage difference
4. WHEN a user drops or selects files via the batch file zone, THE Tool_Engine SHALL accept files with extensions .css, .js, or .html (each no larger than 5 MB and up to 50 files per batch), auto-detect language from the file extension, minify each file, and display per-file results showing filename, original size in bytes, minified size in bytes, percentage savings rounded to one decimal place, and a download link for the minified file
5. IF a user uploads a file with an unsupported extension or exceeding 5 MB, THEN THE Tool_Engine SHALL reject that file with an error message indicating the specific constraint violated and SHALL continue processing any remaining valid files in the same batch
6. IF a user clicks Minify or Beautify with an empty input (no text in the active mode's input panel), THEN THE Tool_Engine SHALL leave the output panel empty and display statistics of 0 bytes for both original and output sizes

### Requirement 4: Markdown Editor Templates and Export Completion

**User Story:** As a developer, I want to use README templates, generate tables, and export my Markdown as HTML or raw .md files, so that I can quickly create documentation.

#### Acceptance Criteria

1. WHEN a user selects a template from the dropdown menu, THE Tool_Engine SHALL replace the entire input panel content with the selected template text, where available templates include at minimum Minimal Project README, Professional Project README, and Developer Profile README
2. WHEN a user clicks the Table Generator button and specifies rows (1 to 10) and columns (1 to 10), THE Tool_Engine SHALL insert a formatted Markdown table with the specified dimensions at the current cursor position, where the table includes a header row with placeholder text, a separator row, and the remaining data rows with placeholder text
3. WHEN a user clicks Export HTML, THE Tool_Engine SHALL generate and trigger download of an HTML file with the default filename "exported-markdown.html" containing a complete HTML document with the rendered Markdown content and a style block embedded in the document head
4. WHEN a user clicks Export MD, THE Tool_Engine SHALL generate and trigger download of a .md file with the default filename "README.md" containing the raw Markdown text from the input panel
5. IF the input panel is empty when a user clicks Export HTML or Export MD, THEN THE Tool_Engine SHALL still generate and trigger download of the file containing empty or minimal content without displaying an error

### Requirement 5: Color Converter Palettes, Gradient Builder, and Image Extractor Completion

**User Story:** As a designer, I want to generate color palettes, build CSS gradients, and extract colors from images, so that I can make informed color decisions directly within the tool.

#### Acceptance Criteria

1. WHEN the base color changes, THE Tool_Engine SHALL generate and display four palette types: complementary (180-degree hue rotation), analogous (plus and minus 30-degree hue rotation), triadic (120 degrees apart), and monochromatic (5 lightness variations of the same hue), where each palette swatch displays its hex value on hover and loads that color into the main converter fields when clicked
2. WHEN a user enters foreground and background colors in the contrast checker, THE Tool_Engine SHALL calculate the WCAG contrast ratio and display pass/fail indicators for AA normal text (4.5:1 minimum), AA large text (3:1 minimum), AAA normal text (7:1 minimum), and AAA large text (4.5:1 minimum), along with a preview card showing sample text rendered with the selected foreground color on the selected background color
3. WHEN a user selects two color stops and adjusts the angle slider (0 to 360 degrees) in the gradient builder, THE Tool_Engine SHALL display a live gradient preview rectangle and output CSS code in a read-only text field containing a solid fallback background-color declaration followed by a linear-gradient declaration, with a copy button that writes the CSS code to the clipboard
4. WHEN a user uploads a supported image file (JPEG, PNG, GIF, SVG, or WebP, maximum 10 MB) via file browse dialog or drag-and-drop, THE Tool_Engine SHALL render the image on a canvas element, display the pixel color under the cursor as the user hovers over the canvas, and upon clicking any pixel load its color value into the main converter fields (HEX, RGB, HSL, and CMYK)
5. IF an uploaded image file exceeds 10 MB or is in an unsupported format, THEN THE Tool_Engine SHALL reject the upload and display an error message indicating the specific constraint violated
6. IF the canvas fails to render an uploaded image, THEN THE Tool_Engine SHALL display an error message indicating the image could not be processed and retain the previous tool state

### Requirement 6: Timestamp Converter Timezone Comparison and Cron Parser Completion

**User Story:** As a developer, I want to compare times across timezones and parse cron expressions, so that I can debug scheduled tasks and coordinate across global teams.

#### Acceptance Criteria

1. WHEN a valid Unix timestamp (numeric digits only, up to 13 digits) or a parseable date string is entered, THE Tool_Engine SHALL display the converted time for exactly 6 predefined timezones: UTC, US Eastern (America/New_York), US Pacific (America/Los_Angeles), Central European Time (Europe/Paris), India Standard Time (Asia/Kolkata), and Japan Standard Time (Asia/Tokyo), each showing both the date and time formatted as medium date and short time
2. WHEN a numeric timestamp of 10 or fewer digits is entered, THE Tool_Engine SHALL interpret it as seconds since Unix epoch, and WHEN a numeric timestamp of more than 10 digits is entered, THE Tool_Engine SHALL interpret it as milliseconds since Unix epoch
3. IF a user enters a non-numeric value in the timestamp input field or an unparseable string in the date input field, THEN THE Tool_Engine SHALL display an error message indicating the input format is invalid and SHALL NOT update the timezone grid or date breakdown
4. WHEN a user enters a valid 5-field cron expression (minute, hour, day-of-month, month, day-of-week) supporting wildcards (*), step values (*/n), comma-separated lists, and hyphenated ranges, THE Tool_Engine SHALL parse it into a human-readable English description and display the next 5 scheduled execution times in the user's local timezone, computed by simulating up to 30,000 one-minute increments from the current moment
5. IF a user enters a cron expression with fewer or more than 5 space-separated fields, THEN THE Tool_Engine SHALL display an error message indicating the field count is invalid and SHALL NOT display execution times
6. IF a user enters a cron expression containing values outside allowed ranges (minute 0-59, hour 0-23, day 1-31, month 1-12, weekday 0-6), THEN THE Tool_Engine SHALL display an error message indicating which field contains out-of-range values
7. IF the cron simulation completes 30,000 iterations without finding 5 matching execution times, THEN THE Tool_Engine SHALL display a message indicating that no future schedules were found within the simulation window

### Requirement 7: Hash Generator File Checksum and Copy Functionality Completion

**User Story:** As a developer, I want to compute file checksums locally and copy hash results to my clipboard, so that I can verify file integrity without uploading to external services.

#### Acceptance Criteria

1. WHEN a user drops or selects a file in the File Checksum tab, THE Tool_Engine SHALL read the file as an ArrayBuffer, compute MD5 and SHA-256 checksums locally, display the resulting hashes as lowercase hexadecimal strings, and display the filename and file size in kilobytes rounded to 2 decimal places
2. WHILE the Tool_Engine is computing file checksums, THE Tool_Engine SHALL display a status indicator showing that hash calculation is in progress, and SHALL update the status to indicate completion once both checksums are computed
3. IF a file exceeds 50 MB, THEN THE Tool_Engine SHALL display a warning message indicating that processing may cause browser unresponsiveness, without blocking the computation
4. WHEN a user clicks a Copy button adjacent to a hash output field containing a non-empty value, THE Tool_Engine SHALL copy the hash string to the system clipboard, change the Copy button text to a confirmation label for 2 seconds, and then restore the original button text
5. IF a user clicks a Copy button adjacent to a hash output field that is empty, THEN THE Tool_Engine SHALL not perform a clipboard write operation and SHALL not display a confirmation indicator
6. IF the clipboard write operation fails, THEN THE Tool_Engine SHALL leave the Copy button text unchanged

### Requirement 8: Cross-Tool Internal Linking Completion

**User Story:** As a user, I want contextual links to related tools and complete footer navigation, so that I can discover relevant utilities without returning to the homepage.

#### Acceptance Criteria

1. WHEN a tool page renders, THE RelatedTools_Component SHALL display 2 to 4 related tool cards below the tool content area and above the SEOContent section, where each card includes the tool name as a clickable link navigating to that tool's page, and related tools are determined by the following category membership: encoding (Base64, URL Encoder/Decoder), formatting (JSON Formatter, Code Minifier, Markdown Editor), security (JWT Decoder, Hash Generator), conversion (Color Converter, Timestamp Converter), development (RegEx Tester)
2. IF the current tool's category contains fewer than 2 other tools, THEN THE RelatedTools_Component SHALL supplement suggestions with tools from other categories until a minimum of 2 related tool cards are displayed
3. WHEN the SEO content or FAQ section renders on a tool page, THE section SHALL include 1 to 3 inline anchor links (HTML `<a>` elements) pointing to other ToolsHub tool pages within the descriptive or answer text, where each linked tool belongs to a functionally related category to the current tool
4. THE Layout footer navigation SHALL include links to all 10 tool pages in a single navigable group: JSON Formatter (/json-formatter), Base64 (/base64), URL Encoder/Decoder (/url-encoder-decoder), RegEx Tester (/regex-tester), JWT Decoder (/jwt-decoder), Code Minifier (/code-minifier-beautifier), Markdown Editor (/markdown-editor), Color Converter (/color-converter), Timestamp Converter (/timestamp), and Hash Generator (/hash-generator)
5. THE RelatedTools_Component SHALL never include the current page tool in the suggested links, verified by comparing the current page path against the href of each rendered related tool card

### Requirement 9: Service Worker Rewrite

**User Story:** As a developer, I want ToolsHub to work offline with intelligent caching, proper eviction, a dedicated offline page, and update notifications, so that I can rely on it regardless of connectivity.

#### Acceptance Criteria

1. THE Service_Worker SHALL use a cache-first strategy for static assets (fonts, images, CSS, JavaScript) and return cached responses without network requests when the asset is available in cache
2. THE Service_Worker SHALL use a network-first strategy for HTML pages with a 3-second network timeout, falling back to the cached version when the network request exceeds the timeout or fails
3. IF a requested HTML page is not in the cache and the network is unavailable, THEN THE Service_Worker SHALL serve the Offline_Fallback page at /offline that displays an offline message and lists navigation links to all 10 tool pages that were precached during service worker installation
4. IF the total cache storage exceeds 50 MB, THEN THE Service_Worker SHALL perform LRU_Eviction by removing cached entries in order of least-recent access time until total storage falls below 50 MB, while retaining app shell assets (HTML skeleton, critical CSS, fonts, favicon) which are exempt from eviction
5. WHEN a new service worker version is detected during a navigation request, THE Service_Worker SHALL activate the new version on the next navigation and display an Update_Toast notification for 8 seconds in a fixed position at the bottom-center of the viewport, informing the user that the app has been updated, with a visible dismiss button to close the toast before the 8-second auto-dismiss
6. THE Offline_Fallback page SHALL be a dedicated Astro page at `src/pages/offline.astro` that renders without JavaScript dependencies and provides links to all 10 tool pages

### Requirement 10: Blog System Migration to Content Collections

**User Story:** As a site owner, I want to migrate blog posts from hardcoded .astro pages to Astro Content Collections with typed schemas, so that I can enable category filtering, automatic tool linking, and dateModified tracking.

#### Acceptance Criteria

1. THE Content_Collection SHALL define a blog collection with a Zod schema enforcing: title (string, maximum 100 characters), description (string, maximum 160 characters), author (string), datePublished (date), dateModified (date), topic (enum: tutorial, comparison, reference), tools (array of tool identifier strings where valid identifiers are: "json-formatter", "base64", "regex-tester", "jwt-decoder", "hash-generator", "url-encoder-decoder", "timestamp", "markdown-editor", "color-converter", "code-minifier-beautifier"), and excerpt (string, maximum 200 characters)
2. THE blog index page SHALL list all posts sorted by datePublished descending, displaying title, excerpt, datePublished formatted as YYYY-MM-DD, topic label, and tool category tags for each post
3. WHEN the blog index page loads, THE blog index page SHALL display all posts with no filters active by default and provide a category filter UI allowing users to filter posts by tool category and by topic, updating the displayed list client-side without a full page reload
4. WHEN a blog post frontmatter contains a tools array with valid tool identifiers, THE Blog_System SHALL auto-link the first occurrence of each matching tool name within the rendered post body to the corresponding tool page path (e.g., "RegEx Tester" links to /regex-tester)
5. IF a blog post frontmatter contains a tools array entry that does not match any valid tool identifier, THEN THE Blog_System SHALL ignore the invalid entry and process the remaining valid tool identifiers without error
6. WHEN a blog post is rendered, THE Blog_System SHALL include Article schema JSON-LD containing author (matching frontmatter author), datePublished (matching frontmatter datePublished in ISO 8601 format), and dateModified (matching frontmatter dateModified in ISO 8601 format)
7. THE Blog_System SHALL include an article titled "How to Write Regex for Email Validation" with the phrase "regex for email validation" in the H1, a meta description of maximum 160 characters unique from all other blog posts, frontmatter conforming to the blog collection schema with topic set to "tutorial" and tools containing "regex-tester", and at least one hyperlink to the /regex-tester page within the post body

### Requirement 11: AdSense Lazy Loading Implementation

**User Story:** As a site owner, I want to load AdSense advertisements without degrading performance, so that I can monetise while maintaining PageSpeed scores above 98.

#### Acceptance Criteria

1. WHEN the browser becomes idle after first contentful paint, THE AdSense_Loader SHALL load the AdSense script using requestIdleCallback, with a setTimeout fallback that fires no later than 5 seconds after the page load event
2. THE Ad_Container SHALL occupy a pre-reserved element with a fixed height of 90px and a width of 100% up to a maximum of 728px, so that Cumulative Layout Shift contribution from ad loading is zero regardless of viewport width
3. IF the AdSense script fails to load or no ad fills within 10 seconds of initiation, THEN THE Ad_Container SHALL instantly collapse to zero height with no transition animation, no visible border, no background, and no error message
4. THE AdSense_Loader SHALL not increase Total Blocking Time by more than 50 milliseconds in aggregate across all ad containers on a single page, as measured by Lighthouse mobile simulation
5. THE Layout SHALL place ad containers in DOM positions that do not overlap or sit between interactive tool inputs, outputs, and controls, so that all tool elements remain fully operable regardless of ad state
6. THE Layout SHALL render no more than 3 Ad_Container elements per page

### Requirement 12: Accessibility and UX Polish

**User Story:** As a user with assistive technology or on a mobile device, I want fully accessible tool interfaces with proper focus management and error messaging, so that I can use ToolsHub effectively regardless of ability or device.

#### Acceptance Criteria

1. THE Layout SHALL provide visible focus indicators with a minimum 2px outline at a contrast ratio of at least 3:1 against adjacent background colours on all focusable elements
2. THE Layout SHALL add aria-live="polite" regions around all dynamic tool output areas (sections where content changes in response to user actions without a full page reload) so that screen readers announce content updates within 1 second of the update occurring
3. WHEN the mobile sidebar drawer opens (viewports below 768px), THE Layout SHALL set role="dialog" and aria-modal="true" on the drawer container, move keyboard focus to the close button inside the drawer, and trap Tab and Shift+Tab focus within the drawer until it is closed
4. WHEN the mobile sidebar drawer closes, THE Layout SHALL return keyboard focus to the hamburger menu button that triggered the drawer
5. WHEN the user presses the Escape key while the mobile drawer is open, THE Layout SHALL close the drawer and return focus to the hamburger menu button
6. THE Layout SHALL ensure all interactive elements (buttons, inputs, links, tabs) have a minimum touch target size of 44 by 44 CSS pixels on viewports below 768px
7. WHEN a validation error occurs on a tool input, THE Tool_Engine pages SHALL display an inline error message adjacent to the relevant input field, associate the error message with the input using aria-describedby, and remove the error message when the input value changes to a valid state as defined by that field's validation rules
8. THE Tool_Engine pages SHALL NOT use alert() calls for error messaging; all error notifications SHALL be presented as inline styled messages within the page

### Requirement 13: Color Sub-Page PageMode Activation

**User Story:** As a user arriving from search on a specific conversion query, I want the color converter to automatically activate the relevant input and highlight the target output, so that I can immediately use the conversion I searched for.

#### Acceptance Criteria

1. WHEN a user visits a color sub-page (e.g., /color-converter/hex-to-rgb), THE Color_Sub_Page SHALL pass a pageMode prop to the ColorConverterTool component specifying the source format and target format
2. WHEN the ColorConverterTool receives a pageMode prop, THE Tool_Engine SHALL set focus on the source format input field and apply a visual highlight (CSS class .conversion-highlight) to the target format output field
3. WHEN the ColorConverterTool receives a pageMode prop, THE Tool_Engine SHALL pre-select the source format tab or section so the user does not need to manually switch
4. IF no pageMode prop is provided (main /color-converter page), THEN THE Tool_Engine SHALL default to HEX input active with all outputs equally displayed without highlight

### Requirement 14: SEO Content Completion

**User Story:** As a site owner, I want to fill remaining SEO content gaps (missing blog article, pattern library test links, blog category filter), so that I can maximise organic search coverage.

#### Acceptance Criteria

1. THE Blog_System SHALL include an article at /blog/regex-email-validation titled "How to Write Regex for Email Validation" containing the target keyword in the H1, a unique meta description between 50 and 160 characters, at least one link to the RegEx Tester page, and Content Collection frontmatter including title, description, date, and category fields
2. WHEN a user views the Regex_Pattern_Library page, each pattern entry SHALL include a "Test in RegEx Tester" link that navigates to /regex-tester with the pattern pre-loaded via a query parameter (e.g., ?pattern=encoded_regex) where the regex value is URI-encoded
3. WHEN the RegEx Tester page loads with a pattern query parameter, THE Tool_Engine SHALL URI-decode the parameter value and populate the regex input field so the user can test the pattern without additional input
4. IF the RegEx Tester page loads with a pattern query parameter that is empty or cannot be URI-decoded into a valid string, THEN THE Tool_Engine SHALL leave the regex input field blank and display the default empty-state tester view
5. THE blog index page SHALL include a category filter UI that displays filter options derived from the category values present in the listed articles, and WHEN a visitor selects a category, THE Blog_System SHALL show only articles matching that category without a full page reload, with an option to clear the filter and display all articles

### Requirement 15: Performance Hardening

**User Story:** As a site owner, I want to verify and lock in performance best practices so that every page achieves a Lighthouse performance score of 98 or above.

#### Acceptance Criteria

1. THE Layout SHALL include all self-hosted font files from @fontsource packages with font-display: swap declared in their @font-face rules, so that text remains visible using a fallback font during the font loading period
2. THE Layout SHALL set explicit width and height attributes on all img elements rendered in the final HTML output, maintaining a Cumulative Layout Shift score below 0.1 as measured by Lighthouse
3. WHEN the Astro build is executed, THE Layout SHALL produce minified HTML output with no HTML comments (except conditional comments) and no sequences of more than one consecutive whitespace character between tags, confirming that the compressHTML: true configuration in astro.config.mjs is active
4. THE Layout SHALL load all inline scripts on tool pages (pages under /json-formatter, /base64, /url-encoder-decoder, /regex-tester, /jwt-decoder, /hash-generator, /timestamp, /markdown-editor, /code-minifier-beautifier, /color-converter, and /regex-patterns) with type="module" so that they are deferred and parsed asynchronously, contributing no more than 50 milliseconds to Total Blocking Time
5. WHEN audited with Google Lighthouse in mobile mode (Moto G Power simulation, slow 4G throttling), THE Layout SHALL achieve a performance score of 98 or above on every page of the site, with Largest Contentful Paint below 1.5 seconds, First Contentful Paint below 1.0 second, and Total Blocking Time below 150 milliseconds
6. IF any img element in the rendered HTML output is missing an explicit width or height attribute, THEN THE Layout SHALL fail the build-time or lint-time check, preventing deployment until the attributes are added
