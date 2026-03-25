# Deployment — ImpressioNZ Outdoors

## How the build works

```
npm run build
```

Produces a single `dist/` folder of static HTML, CSS, JS, and images — upload it directly to the server's `httpdocs/`.

No Node server required. The contact form posts to [Web3Forms](https://web3forms.com) (a free third-party service) — no backend needed.

---

## Environment variables

### Local development

Copy `.env.example` to `.env` and fill in your values:

```
PUBLIC_WEB3FORMS_KEY=your-access-key-here
```

### GitHub Secrets (for CI/CD)

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `PUBLIC_WEB3FORMS_KEY` | Web3Forms access key (get from web3forms.com) |
| `FTP_HOST` | Plesk FTP hostname (e.g. `ftp.impressionz.co.nz`) |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |

---

## Getting a Web3Forms key

1. Go to [web3forms.com](https://web3forms.com)
2. Enter Rod's email address
3. Check the email — click the confirmation link
4. Copy the access key shown
5. Add it to `.env` locally, and to the `PUBLIC_WEB3FORMS_KEY` GitHub Secret

Emails from the contact form will go to Rod's inbox. The key is safe to expose in the browser (it's designed for static sites).

---

## First-time Plesk setup

Plesk serves `httpdocs/` as static files — no Node.js configuration needed.

1. Set up FTP credentials in Plesk
2. Add the four GitHub Secrets above
3. Push to `main` — the GitHub Action builds and deploys automatically

---

## Subsequent deploys

Push to `main`. The GitHub Action:
1. Installs dependencies
2. Builds the site
3. FTPs only changed files to `httpdocs/`

---

## Sanity CMS (future)

When Sanity is set up, content changes will trigger a rebuild via webhook:

1. In Sanity: add a webhook pointing to the GitHub `repository_dispatch` API
2. The workflow already handles `repository_dispatch: sanity_publish`
3. Add `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` to GitHub Secrets

---

## Notes

- The contact form requires `PUBLIC_WEB3FORMS_KEY` to be set — test it after every deploy by submitting a test enquiry
- The sitemap is auto-generated at `sitemap-index.xml`
