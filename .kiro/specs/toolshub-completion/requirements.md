# Requirements Document

## Introduction

This document captures the requirements for completing the ToolsHub developer tools website. ToolsHub is an Astro 6.4.4 static site providing 10 free, 100% client-side developer utilities. Currently 3 tools (JSON Formatter, Base64 Encoder/Decoder, RegEx Tester) are fully implemented, while 7 tools have scaffolded UI but incomplete interactive logic. Additionally, the project needs a blog/content system, expanded SEO sub-pages, monetisation integration (AdSense), service worker for PWA offline support, and UX polish to achieve PageSpeed scores above 98.

## Glossary

- **Tool_Engine**: The client-side JavaScript logic within a tool page that performs the tool's core computation (encoding, decoding, parsing, formatting, etc.)
- **SEO_Content_Section**: The below-fold informational section on each tool page containing how-to guides, FAQs, and structured data markup
- **Blog_System**: A collection-based content system for long-form guides and articles, rendered as static pages for SEO
- **Ad_Slot**: A designated non-render-blocking container for Google AdSense advertisement units
- **Service_Worker**: A background script enabling offline access and asset caching for PWA functionality
- **PageSpeed_Score**: Google Lighthouse performance metric measuring page load speed (target > 98)
- **Color_Converter_Tool**: The color conversion utility supporting HEX, RGB, HSL, and CMYK formats with visual picker
- **Timestamp_Tool**: The Unix epoch timestamp converter with timezone support and cron parser
- **Hash_Generator_Tool**: The cryptographic hash and HMAC generator using Web Crypto API
- **JWT_Decoder_Tool**: The JSON Web Token decoder, verifier, and test token generator
- **Code_Minifier_Tool**: The CSS/JS/HTML minification and beautification engine
- **Markdown_Editor_Tool**: The Markdown editor with live preview, templates, and export functionality
- **URL_Encoder_Tool**: The URL percent-encoding tool with batch processing, query parser, and UTM builder
- **Regex_Pattern_Library**: A curated collection of 500+ categorized regular expression patterns
- **WCAG_Contrast_Checker**: A component that evaluates foreground/background color combinations against WCAG 2.1 AA/AAA standards

## Requirements

### Requirement 1: URL Encoder/Decoder Tool Engine Completion

**User Story:** As a developer, I want to encode and decode URLs with full batch processing and query parsing, so that I can quickly manipulate URL strings without leaving my browser.

#### Acceptance Criteria

1. WHEN a user pastes text into the input field and clicks Encode, THE URL_Encoder_Tool SHALL percent-encode the input using the selected mode (encodeURIComponent when "Encode All (Component)" is selected, or encodeURI when "Keep Delimiters (URI)" is selected) and display the encoded result in the output panel.
2. WHEN a user pastes percent-encoded text into the input field and clicks Decode, THE URL_Encoder_Tool SHALL decode percent-encoded characters using decodeURIComponent and display the original text in the output panel.
3. IF the input contains invalid percent-encoded sequences that cannot be decoded (e.g., "%ZZ", truncated sequences), THEN THE URL_Encoder_Tool SHALL display an error message indicating the decoding failure in the output panel without clearing the input.
4. WHEN a user enters multiple URLs (one per line) in the Batch tab and clicks Batch Encode or Batch Decode, THE URL_Encoder_Tool SHALL process each line independently using encodeURIComponent for encoding or decodeURIComponent for decoding, and display the corresponding results line-by-line in the output panel, preserving empty lines as empty.
5. WHEN a user pastes a URL with query parameters into the Query String Parser input and clicks Parse, THE URL_Encoder_Tool SHALL extract all key-value pairs into an editable table with delete and add-row capabilities; IF the URL contains no query parameters, THEN THE URL_Encoder_Tool SHALL display the empty table with a placeholder message indicating no parameters were found.
6. WHEN a user clicks Rebuild URL after editing parameters in the query table, THE URL_Encoder_Tool SHALL construct a valid URL by combining the parsed base path (origin + pathname) with the current table parameters, omitting any rows with an empty key.
7. WHEN a user fills in the required UTM fields (Website URL, Campaign Source, Campaign Medium, Campaign Name) and clicks Generate, THE URL_Encoder_Tool SHALL produce a properly encoded UTM campaign URL appending utm_source, utm_medium, utm_campaign, and any non-empty optional parameters (utm_term, utm_content) as query parameters.
8. IF a user clicks Generate in the UTM Builder without filling all required fields (Website URL, Campaign Source, Campaign Medium, Campaign Name), THEN THE URL_Encoder_Tool SHALL display a validation alert identifying the missing required fields and SHALL NOT generate a URL.

### Requirement 2: JWT Decoder Tool Engine Completion

**User Story:** As a developer, I want to decode, verify, and generate JWT tokens locally, so that I can debug authentication flows without exposing tokens to third-party services.

#### Acceptance Criteria

1. WHEN a user pastes a valid JWT (three dot-separated Base64URL segments), THE JWT_Decoder_Tool SHALL decode and display the header JSON and payload JSON as pretty-printed JSON with 2-space indentation in separate output panels
2. WHEN the decoded payload contains an "exp" claim, THE JWT_Decoder_Tool SHALL display an expiry status indicator showing whether the token is "Active" or "Expired" along with the expiration date-time and a relative countdown in days, hours, minutes, or seconds
3. WHEN a user enters a secret key and clicks Verify Signature, THE JWT_Decoder_Tool SHALL compute HMAC-SHA256 over header.payload using the Web Crypto API and compare the result against the token signature, displaying a "Valid" or "Invalid" status indicator
4. WHEN a user clicks Generate Token after configuring header JSON, payload JSON, and a secret key in the Generate tab, THE JWT_Decoder_Tool SHALL produce a valid HS256-signed JWT token and display it in the output area
5. WHEN a user clicks Share URL and a token is present in the input, THE JWT_Decoder_Tool SHALL construct a URL with the token as a query parameter and copy it to the system clipboard, displaying a confirmation message for 2 seconds
6. IF the pasted string does not contain exactly three dot-separated segments, THEN THE JWT_Decoder_Tool SHALL display an error message indicating that a valid JWT requires exactly three segments separated by dots
7. IF a three-segment token is pasted but any segment fails Base64URL decoding or the decoded header/payload is not valid JSON, THEN THE JWT_Decoder_Tool SHALL display an error message indicating the parsing failure and clear the decoded output panels
8. IF the user clicks Generate Token and the header or payload fields contain invalid JSON, THEN THE JWT_Decoder_Tool SHALL display an error message indicating the JSON parsing failure and not produce a token

### Requirement 3: Code Minifier and Beautifier Tool Engine

**User Story:** As a web developer, I want to minify and beautify CSS, JavaScript, and HTML code locally, so that I can optimise production assets and read obfuscated code.

#### Acceptance Criteria

1. WHEN a user selects CSS mode and clicks Minify, THE Code_Minifier_Tool SHALL remove block comments (/* ... */), collapse consecutive whitespace characters into a single space, remove whitespace around delimiters ({, }, :, ;), remove trailing semicolons before closing braces, and display the compressed output in the output panel.
2. WHEN a user selects CSS mode and clicks Beautify, THE Code_Minifier_Tool SHALL reformat the input CSS with 2-space indentation per nesting level, a line break after each semicolon, a line break after each closing brace, opening braces on the same line as the selector, and a space after colons in property declarations.
3. WHEN a user selects JavaScript mode and clicks Minify, THE Code_Minifier_Tool SHALL remove block comments (/* ... */), remove single-line comments (// ...), collapse consecutive whitespace into a single space, and remove whitespace around operators and delimiters ({, }, (, ), =, +, -, *, /, ,, ;, :, <, >), then display the compressed output.
4. WHEN a user selects JavaScript mode and clicks Beautify, THE Code_Minifier_Tool SHALL reformat the input JavaScript with 2-space indentation per brace nesting level and a line break after each semicolon and each closing brace.
5. WHEN a user selects HTML mode and clicks Minify, THE Code_Minifier_Tool SHALL remove HTML comments (<!-- ... -->), collapse consecutive whitespace into a single space, and remove all whitespace between closing and opening tags (><), then display the compressed output.
6. WHEN a user selects HTML mode and clicks Beautify, THE Code_Minifier_Tool SHALL reformat the input HTML with 2-space indentation per tag nesting level, each opening and closing tag on its own line, and self-closing tags (img, input, br, hr, meta, link) treated as leaf nodes that do not increase indent depth.
7. WHEN minification or beautification completes, THE Code_Minifier_Tool SHALL display compression statistics showing original size in bytes, output size in bytes, and percentage difference calculated as ((original − output) / original × 100) rounded to one decimal place.
8. WHEN a user uploads files via the batch file drop zone, THE Code_Minifier_Tool SHALL accept only files with extensions .css, .js, or .html, each no larger than 5 MB, minify each file using the corresponding language algorithm, and display per-file results showing the file name, original size, minified size, and percentage savings.
9. IF a user clicks Minify or Beautify and the input textarea for the active mode is empty, THEN THE Code_Minifier_Tool SHALL leave the output textarea empty and display statistics as 0 B original, 0 B optimized, and 0% savings.
10. IF a user uploads a file via the batch drop zone with an extension other than .css, .js, or .html, THEN THE Code_Minifier_Tool SHALL reject that file and display an error message indicating only .css, .js, and .html files are supported.

### Requirement 4: Markdown Editor Tool Engine

**User Story:** As a developer, I want to write Markdown with live preview, use README templates, and export documents, so that I can create documentation efficiently.

#### Acceptance Criteria

1. WHILE a user types in the Markdown input panel, THE Markdown_Editor_Tool SHALL render a live HTML preview in the adjacent panel within 100ms of each keystroke
2. IF the Markdown input panel is empty, THEN THE Markdown_Editor_Tool SHALL display a placeholder message in the preview panel instead of rendered output
3. WHEN a user clicks a toolbar button (bold, italic, heading, link, code, blockquote), THE Markdown_Editor_Tool SHALL wrap the currently selected text with the corresponding Markdown syntax, or insert the syntax at the cursor position if no text is selected
4. WHEN a user selects a README template from the dropdown, THE Markdown_Editor_Tool SHALL replace the entire content of the input panel with the selected template content, where available templates include Minimal Project README, Professional Project README, and Developer Profile README
5. WHEN a user clicks Export HTML, THE Markdown_Editor_Tool SHALL generate a downloadable HTML file containing the rendered output with embedded styles
6. WHEN a user clicks Export MD, THE Markdown_Editor_Tool SHALL generate a downloadable .md file containing the raw Markdown text
7. WHEN a user clicks the Table Generator button, THE Markdown_Editor_Tool SHALL display a dialog for specifying rows (1 to 10) and columns (1 to 10) and insert a formatted Markdown table at the cursor position upon confirmation
8. THE Markdown_Editor_Tool SHALL parse standard CommonMark syntax including headings, bold, italic, links, images, code blocks, blockquotes, ordered lists, unordered lists, horizontal rules, and tables

### Requirement 5: Color Converter Tool Engine

**User Story:** As a designer or developer, I want to convert colors between formats, generate palettes, and check accessibility contrast, so that I can make informed color decisions for my projects.

#### Acceptance Criteria

1. WHEN a user enters a valid color value in any supported format (HEX 3 or 6 digit, RGB with values 0-255, HSL with hue 0-360 and saturation/lightness 0-100%, or CMYK with percentages 0-100%), THE Color_Converter_Tool SHALL convert and display the equivalent value in all other supported formats within 200 milliseconds
2. IF a user enters a color value that does not match any supported format's syntax or exceeds valid ranges, THEN THE Color_Converter_Tool SHALL retain the last valid color state and not update the conversion outputs until a valid value is entered
3. WHEN a user interacts with the visual color picker, THE Color_Converter_Tool SHALL update all format output fields within 100 milliseconds of the picker position changing
4. WHEN the base color changes, THE Color_Converter_Tool SHALL generate and display four palette types: complementary (180° hue rotation), analogous (±30° hue rotation), triadic (120° apart), and monochromatic (5 lightness variations of the same hue)
5. WHEN a user enters foreground and background colors in the contrast checker, THE WCAG_Contrast_Checker SHALL calculate the contrast ratio and display pass/fail indicators for: WCAG 2.1 AA normal text (minimum 4.5:1), AA large text (minimum 3:1), AAA normal text (minimum 7:1), and AAA large text (minimum 4.5:1)
6. WHEN a user selects two color stops and adjusts the angle (0-360 degrees) in the gradient builder, THE Color_Converter_Tool SHALL display a live gradient preview and provide copyable CSS linear-gradient code including a fallback background color
7. WHEN a user uploads an image (accepted formats: JPEG, PNG, GIF, SVG, WebP) to the color extractor, THE Color_Converter_Tool SHALL render the image on a canvas and allow the user to click any pixel to select its color value and load it into the main converter
8. IF an uploaded image file exceeds 10 MB or is not in a supported image format, THEN THE Color_Converter_Tool SHALL reject the upload and display an error message indicating the file type or size constraint that was violated

### Requirement 6: Timestamp Converter Tool Engine

**User Story:** As a developer, I want to convert between Unix timestamps and human-readable dates, compare timezones, and parse cron expressions, so that I can debug time-related code quickly.

#### Acceptance Criteria

1. WHEN a user enters a Unix timestamp (seconds or milliseconds), THE Timestamp_Tool SHALL display the corresponding human-readable date in UTC (RFC 2822 format) and the user's local timezone, along with the ISO 8601 representation, day of week, and day of year
2. WHEN a user enters a human-readable date string, THE Timestamp_Tool SHALL convert it to a Unix timestamp in both seconds and milliseconds and populate the date breakdown details
3. WHEN a user clicks Current Time, THE Timestamp_Tool SHALL display a live-updating clock that refreshes every 1 second, showing the current Unix timestamp in seconds, UTC time, and local time
4. WHEN a user selects or views the timezone comparison, THE Timestamp_Tool SHALL display the converted time for at least 6 predefined timezones (including UTC, US Eastern, US Pacific, Central European, India, and Japan) alongside the base date/time
5. WHEN a user enters a valid cron expression (standard 5-field format: minute, hour, day-of-month, month, day-of-week), THE Timestamp_Tool SHALL parse it into a human-readable English description and display the next 5 scheduled execution times relative to the current time
6. THE Timestamp_Tool SHALL automatically detect whether a numeric input is seconds (10 or fewer digits) or milliseconds (more than 10 digits) based on string length
7. IF a user enters a non-numeric value in the timestamp field, THEN THE Timestamp_Tool SHALL display an error indication stating the input is not a valid numeric timestamp and SHALL NOT update the date breakdown
8. IF a user enters an unparseable date string, THEN THE Timestamp_Tool SHALL display an error indication stating the date format is not recognized and SHALL NOT update the timestamp field
9. IF a user enters an invalid cron expression (fewer than 5 fields or containing values outside allowed ranges), THEN THE Timestamp_Tool SHALL display an error indication that the cron pattern is invalid and SHALL NOT display execution times

### Requirement 7: Hash Generator Tool Engine Completion

**User Story:** As a developer, I want to generate cryptographic hashes and verify file checksums locally, so that I can validate data integrity without uploading files to external services.

#### Acceptance Criteria

1. WHEN a user modifies the text in the input field (keystroke, paste, or cut), THE Hash_Generator_Tool SHALL compute and display MD5, SHA-1, SHA-256, and SHA-512 hashes before the next user input event occurs
2. WHILE HMAC mode is enabled and a secret key of at least 1 character is provided, WHEN the user modifies the text input or the secret key field, THE Hash_Generator_Tool SHALL compute HMAC variants (HMAC-MD5, HMAC-SHA1, HMAC-SHA256, HMAC-SHA512) using the Web Crypto API for SHA variants and display the results in the corresponding output fields
3. WHEN a user uploads or drops a file in the File Checksum tab, THE Hash_Generator_Tool SHALL read the file as an ArrayBuffer and compute MD5 and SHA-256 checksums locally, displaying the file name and file size alongside the results
4. WHEN a hash computation completes, THE Hash_Generator_Tool SHALL display the result as a lowercase hexadecimal string
5. WHEN a user clicks Copy on any hash output field that contains a non-empty value, THE Hash_Generator_Tool SHALL copy the hash value to the system clipboard and display a confirmation indicator for 2 seconds before reverting to the default state
6. IF a file exceeds 50MB, THEN THE Hash_Generator_Tool SHALL display a warning message indicating that processing may cause the browser tab to become unresponsive during computation
7. WHEN the text input field is empty and HMAC mode is disabled, THE Hash_Generator_Tool SHALL clear all hash output fields and display placeholder text in each output
8. WHEN the user clicks the Clear button, THE Hash_Generator_Tool SHALL reset the text input, HMAC key field, all hash output fields, and any uploaded file state to their default empty values

### Requirement 8: Blog and Guide Content System

**User Story:** As a site owner, I want to publish SEO-optimised blog articles and guides for each tool, so that I can attract organic search traffic through informational queries.

#### Acceptance Criteria

1. THE Blog_System SHALL render blog posts as static HTML pages from Markdown content files using Astro content collections
2. WHEN a blog post is rendered, THE Blog_System SHALL include structured data markup (Article schema) with author, datePublished, and dateModified fields
3. THE Blog_System SHALL provide a blog index page listing all published articles sorted by datePublished descending, displaying title, excerpt (maximum 160 characters), date, and category, with filters for tool category and topic category
4. WHEN a blog post frontmatter contains a tool field matching a supported tool identifier (json, base64, url, regex, jwt, css-js-html, markdown, color, timestamp, hash), THE Blog_System SHALL include at least one internal link to the corresponding tool page within the post content area
5. THE Blog_System SHALL support categorisation by tool (JSON, Base64, URL, RegEx, JWT, CSS/JS/HTML, Markdown, Color, Timestamp, Hash) and by topic (tutorial, comparison, reference), where each post must have exactly one topic and at least one tool category
6. WHEN a blog post is published, THE Blog_System SHALL automatically include the post URL in the generated sitemap.xml
7. IF a blog post frontmatter contains a tool field value that does not match any supported tool identifier, THEN THE Blog_System SHALL render the post without a tool page link and omit the post from tool-specific filtered views

### Requirement 9: SEO Sub-Pages and Keyword Targeting

**User Story:** As a site owner, I want dedicated landing pages targeting specific long-tail keywords, so that individual conversion queries rank in search engines.

#### Acceptance Criteria

1. THE Color_Converter_Tool SHALL have dedicated sub-pages for each conversion direction (HEX-to-RGB, RGB-to-HEX, HEX-to-HSL, RGB-to-CMYK, HSL-to-HEX, CMYK-to-RGB), where each sub-page contains a `<title>` element, a `<meta name="description">` tag, and a `<link rel="canonical">` URL that are each distinct from every other sub-page and include the specific conversion direction keywords
2. THE Regex_Pattern_Library SHALL provide a dedicated catalog page containing regex patterns organised into at least 9 categories (email, phone, URL, date, IP address, credit card, password, HTML tags, and at least one additional category) with a minimum of 2 patterns per category, and a text filter input that matches against pattern names and descriptions to narrow visible results
3. WHEN a user visits a color sub-page, THE Color_Converter_Tool SHALL set the source format input field as active and display the target format output field corresponding to that sub-page's conversion direction (e.g., visiting HEX-to-RGB activates the HEX input and displays the RGB output)
4. WHEN a user browses the regex pattern library, THE Regex_Pattern_Library SHALL display each pattern with its name, a text description of its purpose, at least 1 example match string, and a "Test in RegEx Tester" link that navigates to the RegEx Tester page with the selected pattern pre-loaded into the regex input field
5. THE Blog_System SHALL include at least 4 articles, one per each listed keyword topic ("What is JWT", "JWT vs Session tokens", "CSS minifier to reduce page load", "How to write regex for email validation"), where each article's H1 heading contains the target keyword phrase and each article has a unique `<meta name="description">` tag
6. WHEN a user clicks a "Test in RegEx Tester" link from the regex pattern library, THE Regex_Pattern_Library SHALL navigate to the RegEx Tester page and automatically populate the regex input field with the selected pattern so that the user can immediately test it against sample text

### Requirement 10: Google AdSense Monetisation Integration

**User Story:** As a site owner, I want to display advertisements on the site without degrading performance, so that I can generate revenue while maintaining PageSpeed scores above 98.

#### Acceptance Criteria

1. WHEN the main content has completed its first contentful paint and the browser is idle, THE Ad_Slot SHALL load the AdSense script asynchronously using requestIdleCallback (with a fallback to a load event listener), initiating script loading no later than 5 seconds after the page load event fires
2. THE Ad_Slot SHALL occupy a fixed-dimension container with a minimum height of 90px and a width of 100% of its parent column (up to a maximum of 728px), so that Cumulative Layout Shift contribution from ad loading is zero
3. WHILE the ad unit has not loaded, THE Ad_Slot SHALL display a placeholder element containing only a text label reading "Advertisement", styled to match the container's reserved dimensions
4. THE Layout SHALL include one ad slot position in the footer area and no more than 2 ad slots between SEO content sections, with each ad slot placed outside of any interactive tool component so that tool inputs, outputs, and controls remain fully operable
5. IF the AdSense script fails to load within 10 seconds of initiation (due to ad blocker, network error, or timeout), THEN THE Ad_Slot SHALL collapse the container to zero height with no visible border, background, or error message rendered to the user
6. THE Ad_Slot SHALL not increase the total page blocking time by more than 50ms, ensuring the PageSpeed Performance score remains at or above 98 as measured by Lighthouse in mobile mode

### Requirement 11: Performance and PageSpeed Optimisation

**User Story:** As a site owner, I want every page to score above 98 on Google Lighthouse, so that users experience instant load times and the site ranks favourably in Core Web Vitals.

#### Acceptance Criteria

1. THE Layout SHALL inline critical CSS (above-the-fold styles required for first viewport render) and defer non-critical stylesheets to achieve a First Contentful Paint below 1.0 seconds on Lighthouse mobile simulation (Moto G Power, 4× CPU throttling, slow 4G network)
2. THE Layout SHALL self-host all font files (Inter, Outfit, Fira Code) using local @fontsource packages and apply font-display: swap to eliminate render-blocking external requests and prevent invisible text during font load
3. THE Layout SHALL compress all HTML output using Astro compressHTML configuration, removing unnecessary whitespace and comments from the final HTML
4. THE Tool_Engine scripts SHALL load with type="module" attributes so that they are parsed asynchronously and do not increase Total Blocking Time above 150 milliseconds during initial render
5. THE Layout SHALL set explicit width and height attributes on all image elements to maintain a Cumulative Layout Shift score below 0.1 as measured by Lighthouse
6. WHEN a page is built, THE Layout SHALL produce a transferred page weight below 200KB for the initial critical rendering path (HTML, inlined CSS, fonts, and synchronous scripts), excluding third-party ad scripts loaded asynchronously
7. WHEN a page is audited using Google Lighthouse in mobile mode with default throttling, THE Layout SHALL achieve a Largest Contentful Paint below 1.5 seconds

### Requirement 12: Service Worker and PWA Offline Support

**User Story:** As a developer, I want ToolsHub to work offline after the first visit, so that I can use the tools without an internet connection.

#### Acceptance Criteria

1. WHEN a user first visits any page, THE Service_Worker SHALL install and cache the application shell (HTML, CSS, fonts, and JavaScript assets) within 10 seconds of page load on a standard broadband connection
2. WHILE the user is offline, THE Service_Worker SHALL serve cached pages and tool interfaces for all previously visited tool pages, returning the cached response within 200 milliseconds
3. WHEN a new version of the site is deployed and the Service_Worker detects updated assets during a background check, THE Service_Worker SHALL activate the new version on the next navigation and display a non-blocking notification informing the user that the app has been updated
4. THE Service_Worker SHALL use a cache-first strategy for static assets (fonts, images, CSS) and a network-first strategy for HTML pages with a network timeout of 3 seconds before falling back to the cached version
5. IF a requested page is not in the cache and the network is unavailable, THEN THE Service_Worker SHALL serve a custom offline fallback page that displays a message indicating the user is offline and lists navigation links to cached tool pages
6. IF the browser's cache storage exceeds 50 MB, THEN THE Service_Worker SHALL evict the least recently used cached pages while retaining the application shell assets

### Requirement 13: Mobile UX and Accessibility Polish

**User Story:** As a mobile user, I want the tools to be fully functional and accessible on small screens, so that I can use ToolsHub on any device.

#### Acceptance Criteria

1. WHILE the viewport width is below 768px, THE Layout SHALL collapse the sidebar into a drawer that opens via a hamburger menu button and closes when the user taps the backdrop overlay or presses the Escape key
2. WHILE the viewport width is below 768px, THE Layout SHALL ensure all interactive elements (buttons, inputs, textareas, tabs) have a minimum touch target size of 44x44 CSS pixels
3. THE Layout SHALL provide visible focus indicators with a minimum 2px outline at a contrast ratio of at least 3:1 against adjacent background colours on all interactive elements for keyboard navigation
4. WHEN a screen reader encounters a tool interface, THE Layout SHALL provide a non-empty accessible name (via aria-label or associated label) on every interactive element, role attributes on custom controls, and aria-live="polite" regions that announce dynamic content updates within 1 second of the update occurring
5. THE Layout SHALL maintain a colour contrast ratio of at least 4.5:1 for body text (below 18pt regular or 14pt bold) and at least 3:1 for large text (18pt regular or 14pt bold and above) against background colours
6. WHILE the viewport is below 768px, THE Tool_Engine split-panel layouts SHALL stack vertically with input above output
7. WHEN the sidebar drawer opens on viewports below 768px, THE Layout SHALL move keyboard focus to the first focusable element inside the drawer, and WHEN the drawer closes, THE Layout SHALL return focus to the hamburger menu button

### Requirement 14: Cross-Tool Internal Linking

**User Story:** As a user, I want contextual suggestions linking to related tools, so that I can discover relevant utilities without returning to the homepage.

#### Acceptance Criteria

1. WHEN a tool page renders, THE Layout SHALL display a "Related Tools" section below the tool content area suggesting 2-4 other tools that share the same functional category (e.g., encoding tools link to other encoding tools, formatting tools link to other formatting tools)
2. WHEN the SEO_Content_Section renders on a tool page, THE SEO_Content_Section SHALL include at least 1 and at most 3 inline anchor links to other tool pages within the FAQ answers or descriptive text
3. WHEN a blog post contains the exact name of a tool as listed in the sidebar navigation, THE Blog_System SHALL render that tool name as a hyperlink navigating to the corresponding tool page
4. THE Layout footer navigation SHALL include links to all 10 tool pages: JSON Formatter, Base64, URL Encoder/Decoder, RegEx Tester, JWT Decoder, Code Minifier, Markdown Editor, Color Converter, Timestamp Converter, and Hash Generator
5. WHEN a user activates a link in the "Related Tools" section, THE Layout SHALL navigate the user to the selected tool page within the same browser tab
