# Deploying to GitHub Pages

1. Create a GitHub repository and push this project to the `main` branch.
2. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab). `.github/workflows/deploy.yml` will:
   `npm ci` → `npm test` → `npm run build` → `npm run check:static` → publish `dist/`.
4. The site is served at `https://<user>.github.io/<repo>/`.

## Why it works on a sub-path
- `vite.config.ts` uses `base: './'`, so assets load relative to wherever the site is hosted.
- Routing uses the URL hash (`#/shopping`), so refreshing or opening a route directly never returns a Pages 404.

## Verifying zero network use
- `npm run check:static` fails the build if source contains `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, axios, `watchPosition`, or if `dist/index.html` references an external URL.
- Manual check: open DevTools → Network, reload, and confirm only the site's own files load. Then go offline and reload.

## Offline note
The app works offline after its files have loaded once, within normal browser caching. No service worker is included in V1.

## Privacy
No analytics, ads or telemetry. Location is requested only after the user presses **Use My Location**, uses `getCurrentPosition` once (never `watchPosition`), is not transmitted, and is saved only if the user opts in (rounded to ~1 km).
