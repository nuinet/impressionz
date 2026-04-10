# ImpressioNZ Outdoors — Website

The website for Rod MacKenzie's gardening and landscaping business. Built with Astro 5, deployed to Plesk at [impressionz.co.nz](https://impressionz.co.nz).

---

## Repositories

| Repo | Purpose | URL |
|------|---------|-----|
| [nuinet/impressionz](https://github.com/nuinet/impressionz) (this repo) | Astro website source | impressionz.co.nz |
| [nuinet/impressionz-admin](https://github.com/nuinet/impressionz-admin) | Keystatic CMS | admin.impressionz.co.nz |
| [nuinet/impressionz-worker](https://github.com/nuinet/impressionz-worker) | Cloudflare Worker (contact form emails) | — |

---

## How content updates work

1. Log in to the CMS at **[admin.impressionz.co.nz](https://admin.impressionz.co.nz)**
2. Make changes and save — Keystatic commits the updated YAML files (and any uploaded images) directly to this GitHub repo
3. The commit triggers a GitHub Actions build automatically
4. The built site is pushed to Plesk and goes live within a couple of minutes

You can watch the build progress in the [Actions tab](../../actions) of this repo. A green tick means it deployed successfully.

---

## Content collections

All editable content lives in `src/content/`. Each collection is a folder of YAML files.

### Gallery (`src/content/gallery/`)

Each file is one photo in the gallery grid.

| Field | Required | Description |
|-------|----------|-------------|
| `image` | Yes | Filename of the image in `public/images/` (e.g. `stairs.jpg`) |
| `alt` | Yes | Alt text for accessibility and SEO |
| `caption` | No | Optional caption shown in the lightbox |
| `order` | No | Sort order (lower = earlier). Defaults to 99 |
| `mediaType` | No | `image` or `video`. Defaults to `image` |
| `videoUrl` | No | YouTube or Vimeo URL (only used when `mediaType: video`) |

> **Note:** If `image` is left blank the entry will be silently skipped — it won't break the build, but the photo won't appear on the site.

Images must be uploaded to `public/images/` and the filename must match exactly (case-sensitive).

### Services (`src/content/services/`)

Each file is one service card on the services page.

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Service name |
| `description` | Yes | Short summary shown in the card |
| `detail` | Yes | Expanded detail shown when the accordion opens |
| `order` | No | Sort order. Defaults to 99 |

### Testimonials (`src/content/testimonials/`)

| Field | Required | Description |
|-------|----------|-------------|
| `quote` | Yes | The testimonial text |
| `name` | Yes | Customer name (e.g. `Sarah M.`) |
| `suburb` | Yes | Customer suburb |
| `order` | No | Sort order. Defaults to 99 |

### Pages

#### Home (`src/content/pages/home.yaml`)

| Field | Description |
|-------|-------------|
| `heroTitle` | Large heading on the homepage |
| `heroSubtitle` | Subheading below the hero title |
| `aboutBody` | Body text in the About section |
| `ctaHeading` | Heading above the call-to-action section |

#### Contact (`src/content/pages/contact.yaml`)

| Field | Description |
|-------|-------------|
| `phone` | Rod's phone number (shown in sidebar and used for WhatsApp link) |
| `email` | Rod's email address |
| `facebookUrl` | Full Facebook profile URL |
| `facebookLabel` | Display text for the Facebook link |
| `serviceArea` | Short service area blurb shown in the contact sidebar |
| `depositNote` | Deposit note shown above the terms link |

#### Terms (`src/content/pages/terms.yaml`)

A list of items, each with a `heading` and `body` field. Add, remove, or reorder items to update the terms page.

---

## Services overview

### Contact form emails — Cloudflare Worker
Form submissions on the contact page are handled by a Cloudflare Worker (`impressionz-worker`). It receives the form data, formats it, and sends an email via [Resend](https://resend.com) to `impressionzoutdoors@gmail.com`. The worker URL is stored as a GitHub Actions secret (`PUBLIC_WORKER_URL`) and baked into the site at build time.

### CMS — Keystatic on Cloudflare Pages
The admin UI at [admin.impressionz.co.nz](https://admin.impressionz.co.nz) is a separate Cloudflare Pages deployment (`impressionz-admin`). It connects to GitHub and commits content changes directly to this repo.

### Hosting — Plesk
The site is a fully static build (HTML/CSS/JS files). GitHub Actions builds it and triggers a Plesk webhook to pull the latest build. No Node.js server is running.

---

## Local development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:4321`. You'll need a `.env` file with:

```
PUBLIC_WORKER_URL=https://impressionz-worker.<account>.workers.dev
```

Without it the contact form will fail locally (it'll try to post to a relative URL).

To type-check the project:

```bash
npm run astro check
```
