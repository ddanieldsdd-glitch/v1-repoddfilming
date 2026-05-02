# Dani Díaz — Director of Photography Portfolio

A high-end, minimalist cinematic portfolio website built with React. Static
JSON-driven, bilingual (ES / EN), with a hidden admin panel for editing the
content via the browser and exporting/importing the JSON.

**Live**: _your-domain-here_

---

## Stack

- **React 19** (Create React App + Craco)
- **Tailwind CSS 3** (with `darkMode: 'class'`)
- **react-router-dom v7** for client-side routing
- **lucide-react** for icons
- **sonner** for toasts (admin panel only)
- **Vimeo / YouTube** embeds (no SDK, plain `<iframe>` + `postMessage`)
- **Cloudinary** for hosting images and video posters
- **Fontshare CDN** for the typefaces (Cabinet Grotesk + Satoshi)

No backend, no database, no analytics. The whole site is one `JSON` file +
React shell, deployable as a static bundle on Vercel, Netlify, GitHub Pages,
Cloudflare Pages, S3, etc.

---

## Project structure

```
frontend/
├── public/
│   ├── _redirects          # Netlify SPA fallback
│   └── index.html
├── scripts/
│   └── check-videos.js     # Validates Vimeo/YouTube URLs are embeddable
├── src/
│   ├── components/
│   │   ├── Footer.jsx
│   │   ├── Nav.jsx
│   │   ├── ProjectCard.jsx
│   │   └── VimeoEmbed.jsx
│   ├── data/
│   │   └── content.json    # ★ SINGLE SOURCE OF TRUTH for all content ★
│   ├── lib/
│   │   ├── contentStore.js # Reads JSON + LocalStorage overrides
│   │   ├── i18n.js         # ES/EN dictionary
│   │   ├── useContent.js
│   │   └── useTheme.js     # Dark/light mode + Shift+D shortcut
│   ├── pages/
│   │   ├── About.jsx
│   │   ├── Admin.jsx       # Hidden CMS at /admin
│   │   ├── Contact.jsx
│   │   ├── Home.jsx
│   │   ├── ProjectDetail.jsx
│   │   └── Work.jsx
│   ├── App.css
│   ├── App.js
│   ├── index.css
│   └── index.js
├── .gitignore
├── package.json
├── tailwind.config.js
└── vercel.json             # SPA rewrites + buildCommand: yarn predeploy
```

---

## Local development

```bash
cd frontend
yarn install
yarn start      # http://localhost:3000
```

Hot reload is enabled for both `.jsx` and `content.json`.

---

## Editing content

You have **two options**:

### Option 1 — through the admin UI (recommended)

1. Run the site locally or open the deployed URL.
2. Go to `/admin`.
3. Sign in with the password (default `ddfilming2026`, configurable via
   `REACT_APP_ADMIN_PASSWORD`).
4. Edit the site info, About text, photo, social links, and project list.
5. Reorder projects with the ↑ / ↓ buttons.
6. Click **Export JSON** to download the updated `content.json`.
7. Replace `src/data/content.json` with the downloaded file.
8. Commit and push — the new content goes live on the next deploy.

> Until you replace the source JSON, your edits live only in the
> `localStorage` of the browser you used to edit them.

### Option 2 — direct edit

Edit `src/data/content.json` in any editor. Schema:

```json
{
  "site": {
    "name": "Dani Díaz",
    "title": { "es": "...", "en": "..." },
    "tagline": { "es": "...", "en": "..." },
    "showreel_url": "https://vimeo.com/<id>",
    "about_image": "https://...",
    "logo_white": "https://...",
    "social": {
      "email": "...",
      "instagram": "...",
      "vimeo": "...",
      "linkedin": "...",
      "imdb": "..."
    }
  },
  "about": { "es": "...", "en": "..." },
  "projects": [
    {
      "id": "p-...",
      "slug": "kebab-slug",
      "category": "fiction | documentary | commercial | music-video",
      "title": "...",
      "year": 2025,
      "type": { "es": "...", "en": "..." },
      "director": "...",
      "format": "Camera · Lenses",
      "synopsis": { "es": "...", "en": "..." },
      "cover": "https://...image.jpg",
      "poster": "https://...optional.jpg",
      "preview_url": "https://vimeo.com/<id>",
      "stills": ["...", "..."],
      "bts": ["...", "..."],
      "external_link": "https://imdb.com/..."
    }
  ]
}
```

> When you change the JSON shape in a breaking way, bump
> `STORAGE_KEY` in `src/lib/contentStore.js` (e.g. `ddp_content_v6` → `v7`)
> so visitors with stale `localStorage` get the new content automatically.

---

## Validating Vimeo / YouTube URLs

Before deploying, run:

```bash
yarn check:videos
```

It hits Vimeo's and YouTube's official `oEmbed` endpoints and confirms each
video is **publicly embeddable**. Failure usually means:

- the Vimeo video is set to *Unlisted* / *Private link*, or
- the *Where can this be embedded?* setting is *Nowhere* or restricted to
  domains you don't own.

Fix at `https://vimeo.com/manage/videos/<id>/privacy` →
**Privacy: Public** + **Embed: Anywhere** → Save.

`yarn predeploy` runs the validator and only builds if every video passes —
that command is wired to Vercel's build via `vercel.json`.

---

## Deploy

### Vercel

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. **Root Directory**: `frontend` (if you push the monorepo) or `.` (if you
   only push the `frontend/` folder).
4. Vercel auto-detects Create React App. Build settings come from
   `vercel.json`:
   - Build command: `yarn predeploy` (validates videos + builds)
   - Output directory: `build`
5. Deploy.

### Netlify

1. Push this repo to GitHub.
2. New site → import → pick the repo.
3. **Build command**: `yarn predeploy`
4. **Publish directory**: `build`
5. The `public/_redirects` file already handles SPA routing.

### Manual / static host

```bash
yarn predeploy
# Upload the contents of `build/` to any static host.
```

---

## Keyboard shortcuts

| Shortcut    | Action               |
| ----------- | -------------------- |
| `Shift + D` | Toggle dark / light  |

---

## License

All visual content (images, videos, posters) © Dani Díaz / respective rights
holders. Code released under MIT.
