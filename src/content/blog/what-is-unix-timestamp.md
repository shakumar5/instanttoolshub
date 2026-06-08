---
title: "What is a Unix Timestamp? Epoch Time Explained"
description: "Learn what Unix timestamps are, how epoch time works, why computers use seconds since January 1 1970, and practical conversion examples."
author: "ToolsHub"
datePublished: 2025-02-05
dateModified: 2025-02-05
topic: "tutorial"
tools: ["timestamp"]
excerpt: "Understand Unix timestamps and epoch time — why computers count seconds since 1970, conversion examples in multiple languages, and the Year 2038 problem."
---

# What is a Unix Timestamp? Epoch Time Explained

Every computer, server, and database needs a consistent way to represent time. Unix timestamps provide this universal standard — a single number that means the same thing regardless of timezone, locale, or platform.

## Definition: Unix Timestamp

A Unix timestamp (also called Epoch time, POSIX time, or Unix time) is the number of **seconds that have elapsed since January 1, 1970, 00:00:00 UTC** (the "Unix Epoch"). It does not account for leap seconds.

For example:

- `0` = January 1, 1970 00:00:00 UTC
- `1000000000` = September 9, 2001 01:46:40 UTC
- `1700000000` = November 14, 2023 22:13:20 UTC

## Why January 1, 1970?

The Unix operating system was developed at Bell Labs in the late 1960s. When they needed a time reference point, they chose midnight on January 1, 1970 as a convenient, recent, round date. This decision has since been adopted by virtually every operating system, programming language, and database.

## Seconds vs Milliseconds

| Format | Digits | Used By | Example |
|--------|--------|---------|---------|
| Seconds | 10 digits | Unix/Linux, PHP, Python, MySQL | `1700000000` |
| Milliseconds | 13 digits | JavaScript, Java, Elasticsearch | `1700000000000` |
| Microseconds | 16 digits | PostgreSQL, some APIs | `1700000000000000` |

## Getting the Current Timestamp

### JavaScript

```javascript
// Milliseconds
Date.now();              // 1700000000000

// Seconds
Math.floor(Date.now() / 1000);  // 1700000000
```

### Python

```python
import time
int(time.time())         # 1700000000
```

### PHP

```php
time();                  // 1700000000
```

### Bash/Linux

```bash
date +%s                 # 1700000000
```

## Converting Timestamps to Dates

### JavaScript

```javascript
new Date(1700000000 * 1000).toISOString();
// "2023-11-14T22:13:20.000Z"
```

### Python

```python
from datetime import datetime
datetime.utcfromtimestamp(1700000000)
# datetime(2023, 11, 14, 22, 13, 20)
```

## The Year 2038 Problem

32-bit systems store Unix timestamps as a signed 32-bit integer, which can hold values up to 2,147,483,647. This corresponds to **January 19, 2038, 03:14:07 UTC**. After this moment, 32-bit timestamps will overflow and wrap to negative values (appearing as dates in 1901).

The solution: 64-bit systems use a 64-bit integer for timestamps, which won't overflow for approximately 292 billion years. Most modern systems have already migrated.

## Practical Use Cases

- **Database timestamps:** Store creation/modification times as integers for efficient indexing
- **API rate limiting:** Track request windows using epoch seconds
- **JWT tokens:** The `iat`, `exp`, and `nbf` claims use Unix timestamps
- **Cache invalidation:** Compare timestamps to determine if cached data is stale
- **Log correlation:** Align logs from different services using a common time reference
- **Scheduling:** Cron jobs and task schedulers calculate next execution from epoch time

## Timezone Considerations

Unix timestamps are always in **UTC**. They represent an absolute point in time, independent of timezone. When converting to a human-readable date, you apply the desired timezone offset afterward. This makes timestamps ideal for distributed systems where servers span multiple regions.

**Convert timestamps instantly:** Use our free [Unix Timestamp Converter](/timestamp) to translate epoch times to dates, calculate relative times, and parse cron expressions — all in your browser.
