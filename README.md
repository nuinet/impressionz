# 🌿 ImpressioNZ Outdoors — Website

The website for Rod MacKenzie's gardening and landscaping business. Built with Astro 5, deployed to Plesk at [impressionz.co.nz](https://impressionz.co.nz).

---

## 📦 Repositories

| Repo | Purpose | URL |
|------|---------|-----|
| [nuinet/impressionz](https://github.com/nuinet/impressionz) (this repo) | Astro website source | impressionz.co.nz |
| [nuinet/impressionz-admin](https://github.com/nuinet/impressionz-admin) | Keystatic CMS | admin.impressionz.co.nz & https://impressionz-admin.pages.dev/|
| [nuinet/impressionz-worker](https://github.com/nuinet/impressionz-worker) | Cloudflare Worker (contact form emails) | impressionz-worker.jackdaun.workers.dev/ |

---

## 🛠 Developer overview

### Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Astro 5 (SSG) | Fully static output — no server, no runtime Node |
| Styling | Tailwind CSS v4 (Vite plugin) | Config via `@theme` in `global.css`, not `tailwind.config.*` |
| Contact form | React (island) + react-hook-form + Zod | `client:only="react"` — not SSR'd |
| Content | YAML files in `src/content/` | Typed via Zod schemas in `content.config.ts` |
| Blog | Substack RSS → Worker proxy | Fetched at build time via `src/lib/substack.ts`; proxied through the Worker to avoid CI IP blocks |
| Email | Cloudflare Worker → Resend API | Worker repo: `impressionz-worker` |
| CMS | Keystatic Cloud → GitHub commits | Admin repo: `impressionz-admin` |
| Hosting | Plesk (static files) | Served from the `dist` branch, not `main` |
| CI/CD | GitHub Actions | Builds on push to `main` + daily cron at 8am NZST |

### How the pieces connect

```
Rod edits content
  → Keystatic (admin.impressionz.co.nz)
  → commits YAML/images directly to nuinet/impressionz (main branch)
  → triggers GHA workflow
  → npm run build (Astro proxies Substack RSS via Worker, bakes everything to /dist)
  → GHA force-pushes /dist to the dist branch
  → GHA POSTs to Plesk webhook → Plesk pulls dist branch → live

Visitor submits contact form
  → POST JSON to Cloudflare Worker (/contact)
  → Worker validates payload, calls Resend API
  → Email delivered to impressionzoutdoors@gmail.com with reply-to set to the visitor

Astro build fetches blog posts
  → GET Worker (/feed) → Worker fetches mackenzier.substack.com/feed → returns XML
  → Substack RSS parsed in substack.ts, blog pages generated statically

Daily cron (8am NZST via GHA schedule)
  → same build pipeline as above
  → picks up any new Substack posts published since the last build
```

### ⚠️ Key things that aren't obvious

- **Blog posts are static.** `getStaticPaths` in `blog/[slug].astro` calls `getPosts()` at build time. New Substack posts appear after the next build — triggered by a content save or the daily cron. No rebuild = no new posts.
- **Substack RSS is proxied through the Worker.** GitHub Actions' IPs are blocked by Substack. The build fetches `PUBLIC_WORKER_URL/feed` which the Worker forwards to Substack. Direct fetching will silently return an empty list.
- **`PUBLIC_WORKER_URL` is baked in at build time.** It's a GitHub Actions secret. Locally you need a `.env` file with it — without it the contact form and blog both break.
- **The `dist` branch has no history** (`force_orphan: true` in GHA). Don't branch from it.
- **Plesk serves the `dist` branch root directly** — document root is `.`, not `dist/`. The branch root *is* the built files.
- **Keystatic writes to this repo** (`nuinet/impressionz`), not to the admin repo. The admin app is just the UI shell.
- **CORS on the Worker is browser-enforced only.** `ALLOWED_ORIGINS` stops browser requests from other origins — it can't block server-to-server POSTs. The `validate()` function in the worker is the real payload guard.
- **Gallery image paths are absolute.** All `image` fields in `src/content/gallery/*.yaml` store the full public path (e.g. `/images/photo.jpg`). Keystatic handles this automatically on upload. Don't use bare filenames.

---

## ✏️ How content updates work

1. Log in to the CMS at **[admin.impressionz.co.nz](https://admin.impressionz.co.nz)**
2. Make changes and save — Keystatic commits the updated YAML files (and any uploaded images) directly to this repo
3. The commit triggers a GitHub Actions build automatically
4. The built site is pushed to Plesk and goes live within a couple of minutes

Watch build progress in the [Actions tab](../../actions). A green tick means it deployed successfully.

---

## 📁 Content collections

All editable content lives in `src/content/`. Each collection is a folder of YAML files — edit directly or via the CMS.

### Gallery (`src/content/gallery/`)

Each file is one item in the gallery grid.

| Field | Required | Description |
|-------|----------|-------------|
| `image` | Yes | Full public path to the image (e.g. `/images/photo.jpg`). Keystatic sets this automatically on upload. |
| `alt` | Yes | Alt text for accessibility and SEO |
| `caption` | No | Optional caption shown in the lightbox |
| `order` | No | Sort order — lower = earlier. Defaults to 99 |
| `mediaType` | No | `image` or `video`. Defaults to `image` |
| `videoUrl` | No | YouTube or Vimeo URL — only used when `mediaType: video` |

> If `image` is blank the entry is silently skipped — it won't break the build.

### Services (`src/content/services/`)

Each file is one accordion item on the services page.

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Service name |
| `description` | Yes | Short summary |
| `detail` | Yes | Expanded detail shown when the accordion opens |
| `order` | No | Sort order. Defaults to 99 |

### Testimonials (`src/content/testimonials/`)

| Field | Required | Description |
|-------|----------|-------------|
| `quote` | Yes | The testimonial text |
| `name` | Yes | Customer name |
| `suburb` | Yes | Customer suburb |
| `order` | No | Sort order. Defaults to 99 |

### Pages

#### Home — `src/content/pages/home.yaml`

| Field | Description |
|-------|-------------|
| `heroTitle` | Large heading on the homepage |
| `heroSubtitle` | Subheading below the hero title |
| `aboutBody` | Body text in the About section |
| `ctaHeading` | Heading above the call-to-action section |

#### Contact — `src/content/pages/contact.yaml`

| Field | Description |
|-------|-------------|
| `phone` | Rod's phone number — used in the sidebar and WhatsApp link |
| `email` | Rod's email address |
| `facebookUrl` | Full Facebook profile URL |
| `facebookLabel` | Display text for the Facebook link |
| `serviceArea` | Service area blurb shown in the contact sidebar |
| `depositNote` | Deposit note shown above the terms link |

#### Terms — `src/content/pages/terms.yaml`

A list of items, each with a `heading` and `body`. Add, remove, or reorder to update the terms page.

---

## 🔧 Local development

```bash
npm install
npm run dev
```

Dev server runs at `http://localhost:4321`. You'll need a `.env` file:

```
PUBLIC_WORKER_URL=https://impressionz-worker.<account>.workers.dev
```

Without it the contact form will fail and the blog will return no posts.

Type-check:

```bash
npm run astro check
```
