# Contributing

Thanks for helping improve Lantern Wishes. Changes should preserve the existing night-sky experience and shared-wish workflow unless a proposal explicitly changes them.

## Set up locally

1. Fork [the repository](https://github.com/Rishika271107/Tangled-lantern) and clone your fork.
2. Install the locked dependencies with `npm ci`.
3. Start a temporary local preview with `npm run dev`; no Vercel login is required.
4. For persistent local tests, copy `.env.example` to `.env.local`, configure a development Supabase project, and run `supabase/schema.sql` in that project's SQL Editor.
5. If you specifically need Vercel's local function emulator, authenticate and link this checkout, then use `npm run vercel:dev`.

Use a development Supabase project for testing. Wish submissions are public and permanent; do not send test wishes to the production project.

## Contribution guidelines

- Keep changes focused and preserve the existing accessible, mobile-friendly wish experience.
- For bug reports, include the browser, device size, steps to reproduce, and expected versus actual behavior. Remove wish text or other personal information from screenshots.
- For feature requests, explain the user problem and the intended behavior.
- For code changes, describe the behavior change, list any setup or database migration steps, and report the checks you ran.
- Never commit `.env.local`, credentials, database exports, or private user data.
- Be respectful and constructive. Project participation follows the [Code of Conduct](CODE_OF_CONDUCT.md).

GitHub issue forms are available for [bug reports](https://github.com/Rishika271107/Tangled-lantern/issues/new?template=bug_report.yml) and [feature requests](https://github.com/Rishika271107/Tangled-lantern/issues/new?template=feature_request.yml). Pull requests should use the repository's pull request template.

## Propose a change

- Open an issue first for larger changes so the scope can be discussed.
- Create a focused branch and keep changes small.
- Describe user-visible changes and any Supabase or Vercel configuration changes in the pull request.
- Include the checks you ran. This repository currently has no automated test, lint, type-check, or production-build scripts.
- Do not include secrets, `.env.local`, production wish data, or screenshots containing private information.

## Pull requests

Use the pull request template. Confirm that existing wish creation, saved-wish loading, and live updates remain intact when your change touches those flows. If you change the database schema, update `supabase/schema.sql` and document any migration steps.
