# Lantern Wishes

A small, responsive night-sky experience where visitors write wishes and release them as glowing lanterns. Wishes are stored in Supabase and shared live with other visitors.

## Features

- A storybook-style landing screen and a dark, scrollable night sky.
- Lantern wishes that rise vertically, settle at scattered positions, and reveal their text when selected or hovered.
- Shared wish storage through Supabase, with live updates and polling as a fallback.
- A Vercel serverless API that keeps the Supabase write key on the server.
- No account or name is requested when a wish is submitted.

## How it works

The frontend is a single `index.html` file with inline CSS and JavaScript. Vercel serves it and runs the handlers in `api/`. `api/wishes.js` reads and writes the `lantern_wishes` table using a server-only Supabase key. `api/realtime-config.js` exposes only the Supabase URL and publishable/anon key needed by the browser for Realtime subscriptions. The database schema and policies are in `supabase/schema.sql`.

Wishes are visible to anyone who opens the configured site and are not deleted by this application. Visitors should not enter private or identifying information. There is currently no account system, moderation interface, rate limit, or bot challenge.

## Requirements

- Node.js 20 or newer and npm.
- A Supabase project with the schema in `supabase/schema.sql` applied for persistent shared wishes.

## Local development

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Start the local preview:

   ```sh
   npm run dev
   ```

   Open `http://127.0.0.1:3000`. No Vercel account or login is needed.

Without `.env.local`, the local preview stores wishes temporarily in memory. They are cleared when the server stops and are not shared with other devices. This mode is safe for UI testing and does not write to Supabase.

To test persistent storage locally, copy `.env.example` to `.env.local`, fill it with credentials for a development Supabase project, and run `supabase/schema.sql` in that project's SQL Editor. Keep the secret key server-side; never use it in browser code or a `NEXT_PUBLIC_` variable. Never point local tests at production unless you intentionally want wishes to be public and permanent there.

Vercel's emulator remains available as an optional alternative:

   ```sh
   npm run vercel:dev
   ```

That alternative requires Vercel authentication and project linking. The standard `npm run dev` path does not.

## Environment variables

| Variable | Required for | Where it is used |
| --- | --- | --- |
| `SUPABASE_URL` | Wish storage and Realtime | Base URL of the Supabase project, for example `https://your-project.supabase.co` |
| `SUPABASE_SECRET_KEY` | Wish storage | Server-side only. A legacy `SUPABASE_SERVICE_ROLE_KEY` is also accepted. |
| `SUPABASE_PUBLISHABLE_KEY` | Live updates | Browser Realtime configuration. A legacy `SUPABASE_ANON_KEY` is also accepted. This key is designed for browser use with the configured database policies. |

Set the same variables in the Vercel project settings for each environment you use. Do not commit `.env.local` or paste a secret key into an issue or pull request.

## Supabase setup

Run `supabase/schema.sql` in the SQL Editor for the Supabase project connected to Vercel. It creates the wishes table, enables row-level security, allows public read access for wishes, grants server-side write access, and adds the table to the Realtime publication.

The API accepts wishes up to 100 characters and validates lantern placement fields. The public read policy is intentional: wish text is shared among visitors. The server key is used only by the Vercel function and must never be exposed to the browser.

## Deployment

1. Import the repository into Vercel.
2. Add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SUPABASE_PUBLISHABLE_KEY` to the Vercel project environment settings.
3. Run `supabase/schema.sql` against the Supabase project that matches those credentials.
4. Deploy the project. Vercel serves `index.html` and discovers the functions under `api/`.

There is no separate production build command in this repository. Run `npm run dev` for local testing; it does not deploy or publish anything.

## Checks

There is no automated test, lint, or type-check script yet. For a local smoke check, run `npm run dev` and open the landing page. The in-memory mode is temporary; when configured with Supabase, use a development database because submitted wishes are public and permanent.

## Project links

- Maintainer: [Rishika Paleti](https://www.linkedin.com/in/rishika-jasper-paleti11)
- GitHub repository: [Rishika271107/Tangled-lantern](https://github.com/Rishika271107/Tangled-lantern)

## Search indexing

The public site includes page metadata, `robots.txt`, and `sitemap.xml` for search crawlers. To request indexing, verify `https://tangled-lantern.vercel.app/` as a property in [Google Search Console](https://search.google.com/search-console), submit `https://tangled-lantern.vercel.app/sitemap.xml`, and use URL Inspection to request indexing. Google decides whether and when to index a site; these files do not guarantee search placement. Keep the canonical URLs in `index.html`, `robots.txt`, and `sitemap.xml` aligned if the production domain changes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and pull request guidance. Use the issue forms under `.github/ISSUE_TEMPLATE/` for bugs and feature ideas.

## Security

Please report suspected vulnerabilities privately. See [SECURITY.md](SECURITY.md). Do not post credentials or private wish content in public issues.

## License

The project is intended to use the MIT License, as selected for this repository. The `LICENSE` file is pending confirmation of the exact copyright holder.
