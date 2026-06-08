---
title: "URL Encoding: The Complete Guide to Percent-Encoding"
description: "Master URL encoding: learn which characters must be encoded, the difference between encodeURI and encodeURIComponent, and common pitfalls."
author: "ToolsHub"
datePublished: 2025-03-20
dateModified: 2025-03-20
topic: "tutorial"
tools: ["url-encoder-decoder"]
excerpt: "A complete guide to URL percent-encoding — which characters need encoding, encodeURI vs encodeURIComponent, Unicode handling, and common pitfalls to avoid."
---

# URL Encoding: The Complete Guide to Percent-Encoding

Every time you submit a form, click a link with special characters, or call a REST API with query parameters, URL encoding is working behind the scenes. Understanding percent-encoding is essential for building reliable web applications that handle international text, special characters, and complex query strings without breaking.

## What Is URL Encoding (Percent-Encoding)?

URL encoding, officially called percent-encoding, is a mechanism for representing characters in a URI that are not allowed or have special meaning. It replaces unsafe characters with a `%` sign followed by two hexadecimal digits representing the character's byte value.

```
Input:  Hello World!
Encoded: Hello%20World%21

Input:  price=€50&qty=2
Encoded: price%3D%E2%82%AC50%26qty%3D2
```

The standard is defined in RFC 3986, which specifies the syntax of Uniform Resource Identifiers.

## Reserved vs. Unreserved Characters

RFC 3986 divides ASCII characters into three categories for URL purposes:

### Unreserved Characters (Never Encoded)

These characters can appear anywhere in a URL without encoding:

```
A-Z  a-z  0-9  -  _  .  ~
```

### Reserved Characters (Context-Dependent)

These have special meaning in URL structure. They must be encoded when used as data rather than delimiters:

| Character | Encoded | Purpose in URLs |
|-----------|---------|-----------------|
| `:` | %3A | Scheme/port separator |
| `/` | %2F | Path segment separator |
| `?` | %3F | Query string start |
| `#` | %23 | Fragment identifier |
| `&` | %26 | Query parameter separator |
| `=` | %3D | Key-value pair separator |
| `@` | %40 | User info separator |
| `+` | %2B | Space (in form data only) |
| `%` | %25 | Escape character itself |

### Unsafe Characters (Always Encoded)

Characters like spaces, quotes, angle brackets, and non-ASCII characters must always be percent-encoded in URLs.

## encodeURI vs. encodeURIComponent

JavaScript provides two functions for URL encoding, and choosing the wrong one is a common source of bugs:

| Function | Use Case | Does NOT Encode |
|----------|----------|-----------------|
| `encodeURI()` | Encoding a complete URL | `: / ? # [ ] @ ! $ & ' ( ) * + , ; = - . _ ~` |
| `encodeURIComponent()` | Encoding a URL component (query param value) | `- _ . ! ~ * ' ( )` |

### Practical Examples

```javascript
// Encoding a full URL — preserves structure characters
encodeURI("https://example.com/path?name=John Doe&city=New York")
// "https://example.com/path?name=John%20Doe&city=New%20York"

// Encoding a query parameter VALUE — encodes everything unsafe
const query = encodeURIComponent("price=10&discount=20%")
// "price%3D10%26discount%3D20%25"

// Building a safe URL with dynamic values
const baseUrl = "https://api.example.com/search";
const term = "C++ programming & algorithms";
const url = `${baseUrl}?q=${encodeURIComponent(term)}`;
// "https://api.example.com/search?q=C%2B%2B%20programming%20%26%20algorithms"
```

> Rule of thumb: Use `encodeURIComponent()` for individual query parameter keys and values. Use `encodeURI()` only when you have a complete URL string with spaces or non-ASCII characters.

## How Percent-Encoding Works for Unicode

Non-ASCII characters (like emoji or accented letters) are first converted to their UTF-8 byte sequence, then each byte is percent-encoded:

```
Character: é
UTF-8 bytes: 0xC3 0xA9
Encoded: %C3%A9

Character: 🚀
UTF-8 bytes: 0xF0 0x9F 0x9A 0x80
Encoded: %F0%9F%9A%80
```

## Common Pitfalls and How to Avoid Them

### 1. Double Encoding

Encoding an already-encoded string produces broken URLs:

```javascript
// Wrong: encoding twice
const encoded = encodeURIComponent("hello%20world");
// "hello%2520world" — the % itself gets encoded!

// Fix: only encode raw values, never encoded strings
```

### 2. Using encodeURI for Query Values

```javascript
// Wrong: encodeURI won't encode & and =
const bad = encodeURI("key=value&other=data");
// "key=value&other=data" — structure preserved, data broken

// Right: use encodeURIComponent for values
const good = encodeURIComponent("key=value&other=data");
// "key%3Dvalue%26other%3Ddata"
```

### 3. Space Encoding: %20 vs. +

There are two ways to encode spaces:

- `%20` — Standard percent-encoding (RFC 3986)
- `+` — Used only in `application/x-www-form-urlencoded` (HTML form submissions)

JavaScript's `encodeURIComponent` always produces `%20`. The `URLSearchParams` API produces `+` for spaces in form data.

### 4. Forgetting to Encode Path Segments

```javascript
// If a filename contains special characters
const file = "my report (final).pdf";
const path = `/files/${encodeURIComponent(file)}`;
// "/files/my%20report%20(final).pdf"
```

## URL Encoding in Different Languages

| Language | Encode Function | Decode Function |
|----------|-----------------|-----------------|
| JavaScript | `encodeURIComponent()` | `decodeURIComponent()` |
| Python | `urllib.parse.quote()` | `urllib.parse.unquote()` |
| PHP | `urlencode()` | `urldecode()` |
| Java | `URLEncoder.encode()` | `URLDecoder.decode()` |
| C# | `Uri.EscapeDataString()` | `Uri.UnescapeDataString()` |
| Go | `url.QueryEscape()` | `url.QueryUnescape()` |

## The Modern URLSearchParams API

For building query strings, the `URLSearchParams` API handles encoding automatically:

```javascript
const params = new URLSearchParams();
params.set("search", "C++ & Java");
params.set("page", "1");
params.set("filter", "price>100");

console.log(params.toString());
// "search=C%2B%2B+%26+Java&page=1&filter=price%3E100"
```

**Try it yourself:** Encode and decode URLs instantly with our free [URL Encoder & Decoder](/url-encoder-decoder) — see exactly how your strings will be transformed for safe use in URLs.
