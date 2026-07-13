# Rate limiting and trusted proxies

Login and signup rate limits use Redis with peppered SHA-256 identifiers.

## Identifier policy

- Email limits always apply (normalized + hashed).
- IP-prefix and combined limits apply when a client IP can be resolved.
- When IP identity is `unknown`, email/combined limits still protect authentication.

## TRUST_PROXY modes

Set `TRUST_PROXY` to one of:

| Mode | Behavior |
|------|----------|
| `none` (default) | Ignore `X-Forwarded-For` / `X-Real-IP`. IP identity = `unknown`. |
| `vercel` | Trust Vercel platform headers (`x-vercel-forwarded-for`, else leftmost `x-forwarded-for`). Auto-selected when `VERCEL=1` and unset. |
| `single-hop` | Trust `X-Real-IP`, else leftmost `X-Forwarded-For`, only behind a reverse proxy that **overwrites** these headers. |

Malformed IP literals are rejected.

## Deployment requirements

- **Vercel:** leave `TRUST_PROXY` unset (auto `vercel`) or set `TRUST_PROXY=vercel`.
- **Non-Vercel:** terminate TLS at a trusted reverse proxy that overwrites forwarded headers, then set `TRUST_PROXY=single-hop`. Direct exposure without a sanitizing proxy must use `TRUST_PROXY=none` (email limits only for IP-related buckets).
- Missing trusted-proxy configuration for a publicly exposed origin is a **deployment blocker** for IP-prefix enforcement, not an authentication bypass.

Never log full client IP addresses in application logs.
