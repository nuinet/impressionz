# Deployment — ImpressioNZ Outdoors

## How it works

GitHub Actions builds the site on every push to `main`, pushes the built output to a `dist` branch, then triggers Plesk to pull that branch. Plesk serves static files only — no Node.js required on the server.

```
Push to main
  → GitHub Actions: npm ci + npm run build
  → GHA pushes ./dist → dist branch (branch root = built files)
  → GHA POSTs to Plesk webhook URL
  → Plesk pulls dist branch (no build step)
  → Files served from dist branch root
```

---

## GitHub Actions

The workflow is at `.github/workflows/deploy.yml`. It runs automatically on every push to `main` — no manual steps needed.

### Secrets required (repo Settings → Secrets → Actions)

| Secret name | Value |
|---|---|
| `PUBLIC_WEB3FORMS_KEY` | The Web3Forms access key (baked into the static build at CI time) |
| `PLESK_DEPLOY_WEBHOOK` | The Plesk webhook URL (found in Plesk → Git → Webhook) |

---

## Plesk setup

### Git settings
- **Repository:** github.com/your-org/rod
- **Branch:** `dist`
- **Deployment script:** *(leave empty — no build step needed)*

### Document root
Point to the **repo root** (`.`) — the `dist` branch root contains the built files directly (no subdirectory).

> Previously the document root was `dist/` on the `main` branch. With this setup the built files are at the root of the `dist` branch, so the document root should not include a subdirectory.

### Existing GitHub → Plesk webhook
Disable the auto-webhook in GitHub repo Settings → Webhooks. GHA is now the sole trigger — if this webhook is left active, Plesk will try to pull `dist` before GHA has finished building, which will either fail or serve stale files.

---

## Web3Forms key

1. Go to [web3forms.com](https://web3forms.com)
2. Enter Rod's email address and confirm it
3. Copy the access key
4. Add it as a GitHub Actions secret named `PUBLIC_WEB3FORMS_KEY`

Emails from the contact form go straight to Rod's inbox.

---

## Notes

- `PUBLIC_WEB3FORMS_KEY` must be set as a GHA secret or the contact form silently fails — test after initial setup
- `dist/` stays gitignored on `main`; the `dist` branch is managed entirely by GHA
- `force_orphan: true` keeps the `dist` branch as a single commit (no growing history of binary/built files)
- The sitemap is auto-generated at `sitemap-index.xml`
