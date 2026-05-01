# PRD — Daniel Díaz Sánchez · Director of Photography Portfolio

## Original Problem Statement
Build a high-end, minimalist cinematic portfolio website for Director of Photography Daniel Díaz Sánchez. References: edugrau.com, eliasmfelix.com, neusolle.com. Editorial, image-driven, minimal. Sections: Home (showreel), Selected Works (Fiction/Documentary/Commercials/Music Videos), Project Detail (cover, stills, BTS, external link), About, Contact (ddfilming@gmail.com + Instagram/Vimeo/LinkedIn/IMDb). Hidden /admin with CRUD + reorder + JSON import/export. Single JSON as source of truth. Bilingual ES/EN. Static frontend deployable on Vercel/Netlify.

## User Personas
- Daniel Díaz Sánchez (owner): edits projects via /admin, exports JSON.
- Visitors (directors, agencies, producers): browse work, watch showreel, view project details, contact.

## Architecture
- React (CRA + craco) frontend only. No backend dependency for content.
- Content source: `/app/frontend/src/data/content.json`. Admin edits saved to `localStorage` (key `ddp_content_v1`); export/import JSON for portability.
- React Router v7 client-side routes.
- i18n: `T` map + `tr()` helper (`/app/frontend/src/lib/i18n.js`). Lang persisted in `localStorage` (`ddp_lang`).
- Admin: simple password (default `ddfilming2026`, override via `REACT_APP_ADMIN_PASSWORD`). Session via `sessionStorage` (`ddp_admin_auth`).
- Vimeo embeds via `VimeoEmbed` component (also supports YouTube).

## Implemented (2026-02-01)
- Home: hero with Vimeo background showreel, name, title, tagline, scroll indicator, Selected Works preview (asymmetric), Categories strip.
- Work: filter tabs (All / 4 categories) with route `/work/:category`, asymmetric grid.
- Project Detail: hero media (image or video), meta sidebar, synopsis, stills grid, BTS toggle, next-project link, external link button.
- About: editorial bio (ES/EN, multi-paragraph).
- Contact: large mailto + social links.
- Admin (`/admin`): password gate, full site editor (name, title, tagline, showreel, social, about ES/EN), project CRUD form (title, slug, category, year, type ES/EN, director, format, cover, stills[], bts[], synopsis ES/EN, external link), reorder up/down, JSON export/import, reset to default, logout.
- Bilingual ES/EN toggle in nav (default ES).
- Editorial typography: Cabinet Grotesk + Satoshi via Fontshare CDN.
- Footer with email + socials + admin entry.
- All interactive elements tagged with `data-testid` (kebab-case).

## Test Results
Iteration 1: 37/37 frontend assertions passed.

## Backlog (P0 → P2)
- P1: Vimeo privacy — current showreel URL renders a Cloudflare Turnstile overlay inside Vimeo's player. User must enable embedding for that video at vimeo.com/manage/videos/1054144154 → Privacy → "Where can this be embedded?" → Anywhere.
- P1: Add real project covers/stills (replace placeholder Unsplash via /admin).
- P2: SEO meta per project page.
- P2: Image lightbox for stills.
- P2: Static export script for Vercel/Netlify (`yarn build` already produces it).

## Deployment Notes
- Fully frontend-only. `yarn build` in `/app/frontend` produces a static `build/` deployable to Vercel/Netlify.
- Set `REACT_APP_ADMIN_PASSWORD` env var on the host to override the admin password.
