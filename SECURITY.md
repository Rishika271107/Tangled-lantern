# Security Policy

## Reporting a vulnerability

Please do not report vulnerabilities in a public issue. Use GitHub's **Report a vulnerability** option in the repository's Security tab when private vulnerability reporting is available. If it is not enabled, contact the repository maintainer privately through GitHub and ask for a secure reporting route before sending sensitive details.

Include the affected component, a description of the issue, steps to reproduce it, and any suggested mitigation. Do not include real credentials or other people's private wish text in a report.

## Current security notes

- The wishes API is public and accepts anonymous submissions. Wish text is publicly readable and persists in the configured database.
- There is currently no rate limiting, bot challenge, moderation tool, or wish deletion endpoint.
- `SUPABASE_SECRET_KEY` (or the legacy service-role key) must remain a Vercel server-side environment variable. Never expose it to the browser.
- The publishable/anon key is returned to the browser for Realtime; public table access is governed by the Supabase policies in `supabase/schema.sql`.
- The browser loads the Supabase client from `esm.sh` for Realtime.

These notes describe the current implementation and are not a guarantee that the service is abuse-proof.
