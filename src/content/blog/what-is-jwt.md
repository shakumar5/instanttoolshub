---
title: "What is JWT? A Complete Guide to JSON Web Tokens"
description: "Learn how JSON Web Tokens work, their structure (header, payload, signature), use cases in authentication, and security best practices."
author: "ToolsHub"
datePublished: 2025-01-15
dateModified: 2025-01-15
topic: "tutorial"
tools: ["jwt-decoder"]
excerpt: "Understand JSON Web Tokens from the ground up — JWT structure, how authentication flows work, common use cases, and security best practices for production systems."
---

# What is JWT? A Complete Guide to JSON Web Tokens

JSON Web Tokens (JWT) have become the standard for authentication and information exchange in modern web applications. Whether you're building a REST API, a single-page application, or a microservices architecture, understanding JWT is essential.

## What is a JSON Web Token?

A JWT (pronounced "jot") is an open standard (RFC 7519) that defines a compact, self-contained way to securely transmit information between parties as a JSON object. The information can be verified and trusted because it is digitally signed using a secret (HMAC algorithm) or a public/private key pair (RSA or ECDSA).

## JWT Structure: Three Parts

Every JWT consists of three parts separated by dots (`.`):

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
```

### 1. Header

The header typically contains two pieces of information: the signing algorithm (e.g., HS256, RS256) and the token type (JWT).

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### 2. Payload (Claims)

The payload contains the claims — statements about the user and additional metadata. There are three types of claims:

- **Registered claims:** Predefined like `iss` (issuer), `exp` (expiration), `sub` (subject), `aud` (audience)
- **Public claims:** Defined at will by those using JWTs (should use collision-resistant names)
- **Private claims:** Custom claims created to share information between parties that agree on using them

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "role": "admin",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### 3. Signature

The signature is created by encoding the header and payload with Base64Url, then signing the result with the specified algorithm and a secret key:

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

## How JWT Authentication Works

1. User sends credentials (username/password) to the server
2. Server verifies credentials and generates a JWT signed with a secret key
3. Server returns the JWT to the client
4. Client stores the token (localStorage, httpOnly cookie, or memory)
5. Client sends the JWT in the `Authorization: Bearer <token>` header with each request
6. Server verifies the signature and extracts user information from the payload

## When to Use JWT

- **Authorization:** The most common use case. Once logged in, each subsequent request includes the JWT.
- **Information Exchange:** JWTs are a secure way to transmit information between parties since the signature verifies sender identity and data integrity.
- **Single Sign-On (SSO):** JWT works well across domains because of its small overhead and self-contained nature.
- **Microservices:** Services can verify tokens independently without calling an auth service on every request.

## JWT Security Best Practices

- Always set short expiration times (`exp` claim) — 15 minutes for access tokens
- Use refresh tokens for long-lived sessions
- Never store sensitive information in the payload (it's Base64 encoded, not encrypted)
- Use strong secrets (256+ bits) for HMAC signing
- Validate the `iss`, `aud`, and `exp` claims on every request
- Prefer httpOnly cookies over localStorage for token storage to prevent XSS attacks
- Implement token rotation and revocation strategies

## Common JWT Pitfalls

- **Storing tokens in localStorage:** Vulnerable to XSS attacks
- **Not validating signatures:** Always verify the token server-side
- **Using "none" algorithm:** Some libraries accept unsigned tokens — always reject alg:none
- **Oversized tokens:** Every HTTP request carries the token — keep payloads minimal

**Try it yourself:** Decode, verify, and inspect JWT tokens instantly with our free [JWT Decoder & Debugger](/jwt-decoder) — no data leaves your browser.
