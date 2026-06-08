---
title: "How to Write Regex for Email Validation"
description: "Learn how to build and test regex patterns for email validation with practical examples and common pitfalls to avoid."
author: "ToolsHub"
datePublished: 2024-01-15
dateModified: 2024-03-20
topic: "tutorial"
tools: ["regex-tester"]
excerpt: "A step-by-step guide to creating robust email validation regex patterns, from simple to RFC-compliant approaches."
---

# How to Write Regex for Email Validation

Email validation is one of the most common tasks developers face, and getting it right with regex for email validation requires understanding both the pattern syntax and the rules that govern valid email addresses. In this guide, we'll build email validation patterns from scratch, starting simple and progressing to production-ready solutions.

## Why Use Regex for Email Validation?

Before sending data to a server or triggering an API call, client-side validation catches obvious formatting errors instantly. A well-crafted regex pattern can verify that an email address follows the expected structure — a local part, an `@` symbol, and a domain — without any network round-trip.

That said, regex alone cannot confirm that an email address actually exists. It only confirms structural validity. For true deliverability, you still need server-side verification or an email confirmation flow.

## Understanding Email Address Structure

According to RFC 5322, a valid email address has two main parts separated by `@`:

```
local-part@domain
```

- **Local part**: Can contain letters, digits, dots, hyphens, underscores, and certain special characters
- **Domain**: Must be a valid hostname with at least one dot separating labels

## A Basic Email Regex Pattern

The simplest useful pattern checks for characters before and after `@`, with a dot in the domain:

```regex
^[^\s@]+@[^\s@]+\.[^\s@]+$
```

**Breakdown:**
- `^` — Start of string
- `[^\s@]+` — One or more characters that aren't whitespace or `@` (local part)
- `@` — Literal at sign
- `[^\s@]+` — One or more characters that aren't whitespace or `@` (domain name)
- `\.` — Literal dot
- `[^\s@]+` — One or more characters that aren't whitespace or `@` (top-level domain)
- `$` — End of string

This catches the most common formatting errors but is permissive — it allows some technically invalid characters through.

## A More Restrictive Pattern

For stricter validation that limits the local part to common characters:

```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

**Breakdown:**
- `[a-zA-Z0-9._%+-]+` — Local part: letters, digits, dots, underscores, percent, plus, hyphen
- `@` — Separator
- `[a-zA-Z0-9.-]+` — Domain: letters, digits, dots, hyphens
- `\.` — Dot before TLD
- `[a-zA-Z]{2,}` — TLD: at least 2 letters

This is the pattern most developers reach for in production. It rejects clearly invalid inputs while accepting the vast majority of real-world email addresses.

## Adding Length Constraints

Real email addresses have length limits. The total address cannot exceed 254 characters, the local part maxes out at 64 characters, and each domain label is limited to 63 characters:

```regex
^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$
```

This pattern enforces:
- Local part between 1 and 64 characters
- Each domain label starts and ends with alphanumeric characters
- Domain labels are 1 to 63 characters
- TLD is 2 to 63 characters

## Handling Edge Cases

### Consecutive Dots

Valid emails cannot have consecutive dots in the local part. Add a negative lookahead:

```regex
^(?!.*\.\.)[[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

The `(?!.*\.\.)` assertion fails the match if two consecutive dots appear anywhere in the string.

### Leading or Trailing Dots

The local part cannot start or end with a dot:

```regex
^[a-zA-Z0-9_%+-][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

By requiring the first character to be from a set that excludes the dot, we prevent leading dots. Trailing dots in the local part are handled by requiring at least one character after any dot before the `@`.

## A Production-Ready Pattern

Combining the constraints above into one comprehensive pattern:

```regex
^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$
```

This pattern:
- Allows RFC 5322 special characters in the local part
- Requires domain labels to start and end with alphanumeric characters
- Supports subdomains of arbitrary depth
- Requires a TLD of at least 2 characters

## Testing Your Patterns

Writing a regex is only half the work — you need to verify it against both valid and invalid inputs. Try this pattern in our [RegEx Tester](/regex-tester) to see real-time matching with highlighting and detailed match breakdowns.

Here are test cases to validate your email regex:

**Should match (valid):**
- `user@example.com`
- `firstname.lastname@company.co.uk`
- `user+tag@domain.org`
- `user123@sub.domain.com`

**Should not match (invalid):**
- `@example.com` (no local part)
- `user@` (no domain)
- `user@.com` (domain starts with dot)
- `user..name@domain.com` (consecutive dots)
- `user @domain.com` (space in local part)

## Common Mistakes to Avoid

1. **Over-restricting the local part** — Characters like `+`, `.`, and `_` are valid and widely used. Gmail users rely on `+` for filtering.

2. **Hardcoding TLD length** — Patterns like `\.[a-zA-Z]{2,4}` reject valid TLDs like `.museum`, `.technology`, or `.photography`. Use `{2,}` instead.

3. **Forgetting anchors** — Without `^` and `$`, a pattern can match a valid substring within an otherwise invalid string.

4. **Trying to be RFC-complete** — A fully RFC 5322 compliant regex is over 6,000 characters long. For practical purposes, the production-ready pattern above covers 99.9% of real addresses.

5. **Not testing internationally** — Internationalized domain names (IDN) and internationalized email addresses exist. Consider whether your use case needs to support them.

## JavaScript Implementation

Here's how to use the pattern in JavaScript:

```javascript
function isValidEmail(email) {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
}

// Usage
console.log(isValidEmail('user@example.com'));     // true
console.log(isValidEmail('invalid@'));             // false
console.log(isValidEmail('no-at-sign.com'));       // false
```

For form validation with user feedback:

```javascript
function validateEmailField(input) {
  const email = input.value.trim();
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }
  if (!pattern.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true, message: '' };
}
```

## Beyond Regex: Layered Validation

For a robust email validation strategy, combine multiple layers:

1. **Regex check** — Catches formatting errors instantly on the client
2. **MX record lookup** — Verifies the domain can receive email (server-side)
3. **Confirmation email** — The only way to truly verify an address exists and is accessible

Regex handles layer one effectively. Use our [RegEx Tester](/regex-tester) to experiment with patterns, test edge cases, and refine your email validation logic before deploying it to production.

## Summary

Writing regex for email validation is a balance between strictness and practicality. Start with `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` for most use cases, add constraints as your requirements demand, and always test against real-world addresses. Remember that regex validates format, not existence — pair it with server-side checks for complete validation.
