# Deployment — ImpressioNZ Outdoors

## How the build works

```
npm run build
```

Produces two folders:

| Folder | Contents |
|---|---|
| `dist/client/` | All static HTML, CSS, JS, images — served directly |
| `dist/server/` | Minimal Node.js server — handles `/api/enquiry` (contact form) and Sanity Studio |

The Node server also serves the static files, so running it handles everything.

---

## First-time Plesk setup

### 1. Environment variables

Create `.env` in the project root on the server (never commit this):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

Sanity keys will be added here when Sanity is set up.

### 2. Enable Node.js in Plesk

1. Go to your domain in Plesk → **Node.js**
2. Enable Node.js
3. Set **Application root** to your deployment folder (e.g. `/var/www/vhosts/impressionz.co.nz/`)
4. Set **Application startup file** to `dist/server/entry.mjs`
5. Set environment variables: `RESEND_API_KEY`, and optionally `HOST=0.0.0.0`, `PORT=3000`
6. Click **NPM install** to install production dependencies
7. Click **Restart app**

Plesk's Apache/Nginx will automatically reverse-proxy requests to the Node app. You do **not** need to change the document root — Plesk handles the proxy in front.

### 3. Deploy files

On your local machine, build and copy files to the server:

```bash
npm run build
```

Then upload the entire project (excluding `node_modules/` and `site-backup/`) to the server via FTP or SSH. The server needs:

```
dist/
node_modules/   ← run `npm install --omit=dev` on the server, or upload from local
package.json
.env            ← create this manually on the server
```

### 4. Subsequent deploys

```bash
# Local
npm run build

# Upload dist/ to server via FTP/SCP, then in Plesk:
# Node.js → Restart app
```

---

## Is the document root involved?

Not directly. When the Node.js app is running in Plesk, it handles all requests — static files from `dist/client/` and the API endpoint. Plesk proxies everything through the Node server.

The **document root** (`httpdocs/`) is bypassed for Node.js apps in Plesk. You don't need to put files there.

---

## Notes

- The contact form (`/api/enquiry`) requires the Node server to be running. If the Node app is down, the form will return an error — everything else (all HTML pages) will still load from cache/static.
- When Sanity Studio is added, it will also be served by the Node app at `/studio`.
- `RESEND_API_KEY` must be set or the contact form silently fails — test it after every deploy.
