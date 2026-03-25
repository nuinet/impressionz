# Deployment — ImpressioNZ Outdoors

## How it works

Plesk is connected directly to the GitHub repo. When code is pushed, Plesk pulls and runs the build. The built `dist/` folder is served as static files.

```
Push to GitHub → Plesk pulls → npm install + npm run build → serves dist/
Sanity publishes → Sanity webhook → same Plesk endpoint → rebuild
```

---

## Plesk setup

### Git settings
- **Repository:** github.com/your-org/rod
- **Branch:** main
- **Deployment script:**
  ```
  npm install
  npm run build
  ```

### Document root
Point to `dist/` — this also prevents Phusion Passenger from trying to boot a Node.js app.

### Environment variables
Create a `.env` file in the repo directory on the server (never commit this):
```
PUBLIC_WEB3FORMS_KEY=your-access-key-here
```

---

## Web3Forms key

1. Go to [web3forms.com](https://web3forms.com)
2. Enter Rod's email address and confirm it
3. Copy the access key
4. Add it to the `.env` file on the server

Emails from the contact form go straight to Rod's inbox.

---

## Sanity CMS (future)

When Sanity is set up, copy the Plesk Git webhook URL and add it as a webhook in Sanity (on publish). This will trigger a pull and rebuild automatically when Rod publishes content changes.

---

## Notes

- `PUBLIC_WEB3FORMS_KEY` must be set or the contact form silently fails — test after every deploy
- The sitemap is auto-generated at `sitemap-index.xml`
