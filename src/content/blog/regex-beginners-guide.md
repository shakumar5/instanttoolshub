---
title: "Regular Expressions: A Beginner's Complete Guide"
description: "Master regex from scratch — learn character classes, quantifiers, groups, anchors, lookaheads, and real-world pattern examples."
author: "ToolsHub"
datePublished: 2025-03-01
dateModified: 2025-03-01
topic: "tutorial"
tools: ["regex-tester"]
excerpt: "Learn regular expressions from the ground up — character classes, quantifiers, groups, anchors, lookaheads, and practical patterns for email, URL, and password validation."
---

# Regular Expressions: A Beginner's Complete Guide

Regular expressions (regex) are one of the most powerful tools in a developer's toolkit. They let you search, match, validate, and transform text using patterns — everything from validating email addresses to parsing log files.

## What is a Regular Expression?

A regular expression is a sequence of characters that defines a search pattern. When applied to text, the regex engine scans through looking for substrings that match the defined pattern.

```
/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
```

This pattern matches email addresses. Let's break down how it works.

## Character Classes

Character classes match any one character from a set:

| Pattern | Matches | Example Match |
|---------|---------|---------------|
| `[abc]` | Any single character: a, b, or c | "a" in "cat" |
| `[a-z]` | Any lowercase letter | "h" in "hello" |
| `[0-9]` | Any digit | "5" in "port 5432" |
| `\d` | Any digit (shortcut for [0-9]) | "7" in "7 items" |
| `\w` | Word character (letters, digits, underscore) | "a" in "a_var" |
| `\s` | Whitespace (space, tab, newline) | " " in "hello world" |
| `.` | Any character except newline | "x" in "xyz" |
| `[^abc]` | Any character NOT a, b, or c | "d" in "dog" |

## Quantifiers

Quantifiers specify how many times a pattern should repeat:

| Pattern | Meaning | Example |
|---------|---------|---------|
| `*` | 0 or more times | `a*` matches "", "a", "aaa" |
| `+` | 1 or more times | `a+` matches "a", "aaa" (not "") |
| `?` | 0 or 1 time (optional) | `colou?r` matches "color" and "colour" |
| `{3}` | Exactly 3 times | `\d{3}` matches "123" |
| `{2,5}` | Between 2 and 5 times | `\d{2,5}` matches "12" to "12345" |
| `{3,}` | 3 or more times | `a{3,}` matches "aaa", "aaaa"... |

## Anchors

Anchors don't match characters — they match positions:

- `^` — Start of string (or line with `m` flag)
- `$` — End of string (or line with `m` flag)
- `\b` — Word boundary (between a word character and a non-word character)

```
^\d{4}-\d{2}-\d{2}$    // Matches full date format: "2025-01-15"
\bcat\b                // Matches "cat" but not "scatter" or "category"
```

## Groups and Capturing

### Capturing Groups `( )`

Parentheses create groups that capture matched text for later use:

```
(\d{3})-(\d{3})-(\d{4})
// Input: "555-123-4567"
// Group 1: "555", Group 2: "123", Group 3: "4567"
```

### Non-Capturing Groups `(?: )`

Group without capturing (useful for applying quantifiers to a group):

```
(?:http|https)://\S+    // Matches URLs without capturing the protocol
```

## Lookaheads and Lookbehinds

Zero-width assertions that check what's ahead or behind without including it in the match:

- `(?=pattern)` — Positive lookahead: match if followed by pattern
- `(?!pattern)` — Negative lookahead: match if NOT followed by pattern
- `(?<=pattern)` — Positive lookbehind: match if preceded by pattern
- `(?<!pattern)` — Negative lookbehind: match if NOT preceded by pattern

```
\d+(?=px)       // Matches digits followed by "px": "12" in "12px"
(?<=\$)\d+      // Matches digits preceded by "$": "99" in "$99"
```

## Flags

- `g` (global) — Find all matches, not just the first
- `i` (case-insensitive) — Ignore uppercase vs lowercase
- `m` (multiline) — `^` and `$` match line boundaries
- `s` (dotAll) — `.` matches newline characters too

## Practical Examples

### Email Validation

```
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

### URL Matching

```
https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z]{2,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)
```

### Strong Password (8+ chars, uppercase, lowercase, digit, special)

```
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
```

### IPv4 Address

```
\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b
```

## Common Mistakes

- **Greedy by default:** `.*` matches as much as possible. Use `.*?` for lazy (minimal) matching.
- **Forgetting to escape special characters:** Characters like `. * + ? ^ $ { } [ ] | ( ) \` must be escaped with backslash when matching literally.
- **Catastrophic backtracking:** Nested quantifiers like `(a+)+` can cause exponential time complexity on non-matching input.
- **Using regex for HTML parsing:** Regex cannot properly parse nested structures — use a DOM parser instead.

**Practice regex live:** Test patterns with real-time highlighting, explore 500+ common patterns, and generate expressions from English using our free [RegEx Tester & AI Generator](/regex-tester).
