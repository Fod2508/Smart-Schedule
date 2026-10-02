---
inclusion: always
---

# Skill: Security and Hardening

Treat every external input as hostile, every secret as sacred, and every authorization check as mandatory.

## Always Do (No Exceptions)

- **Validate all external input** at system boundaries (API routes, form handlers)
- **Parameterize all database queries** — never concatenate user input into SQL
- **Encode output** to prevent XSS
- **Use HTTPS** for all external communication
- **Hash passwords** with bcrypt/scrypt/argon2 (never store plaintext)
- **Set security headers** (CSP, HSTS, X-Frame-Options)
- **Use httpOnly, secure, sameSite cookies** for sessions

## Never Do

- **Never commit secrets** to version control (API keys, passwords, tokens)
- **Never log sensitive data** (passwords, tokens)
- **Never trust client-side validation** as a security boundary
- **Never use `eval()` or `innerHTML`** with user-provided data
- **Never expose stack traces** or internal error details to users
- **Never store sessions in localStorage** for auth tokens

## Ask First (Requires Approval)

- Adding new authentication flows
- Storing new categories of sensitive data (PII, payment info)
- Adding new external service integrations
- Changing CORS configuration
- Adding file upload handlers

## Injection & XSS

- Parameterize every query — no string concatenation in SQL
- Encode output through framework's auto-escaping
- Check authorization on EVERY request — authenticated user must own the resource

## Authentication & Sessions

- Hash passwords with bcrypt (≥12 rounds) or argon2
- Session cookies: `httpOnly`, `secure`, `sameSite: 'lax'`
- Session secret from environment, never from code

## LLM / AI Features

- **Model output is untrusted input** — never pass to `eval`, SQL, shell, `innerHTML`
- **Prompts can be hijacked** — enforce permissions in code, not system prompt
- **Keep secrets and PII out of the context window**

## Red Flags

- User input passed directly to database queries or HTML rendering
- Secrets in source code or commit history
- API endpoints without authentication/authorization checks
- Stack traces exposed to users
- LLM output passed into a query, DOM, or shell command

## Verification Checklist

- [ ] No secrets in source code or git history
- [ ] All user input validated at system boundaries
- [ ] Authentication and authorization on every protected endpoint
- [ ] Security headers present in response
- [ ] Error responses don't expose internal details
- [ ] LLM output validated and encoded before use
