# Current validation evidence

Validated in the actual cloud instance with Node 24, Vite 7 and system Chromium.

- `npm install`: completed using the existing repository and lockfile.
- Root production build and GitHub Pages `/portfolio-website/` production build: passed. Postbuild generated `404.html`.
- Dedicated editor build: passed; the public build contains no EditorPanel module or admin entry.
- Content suite: 2 tests passed. Checks 8 projects, 47 project source pages, all 54 PDF pages, existing asset paths, PDF SHA-256 and rejection of malformed release data.
- Maintained Playwright suite: 3 tests passed. Covers public filters/lightbox and editor isolation, mobile/reduced-motion navigation, plus administrator save/reload/cancel/export behavior.
- Extended production browser run: 8 projects, 47 gallery pages, all 7 category filters, Other sub-details, previous/next projects, lightbox, biography/awards/timeline, filtered catalogue scroll restoration and 30 route/viewport combinations passed without runtime errors or failed HTTP requests.
- Viewports: 1920, 1440, 768, 390, 375 and 320px; no horizontal overflow.
- Extended editor browser run: inline text editing, IndexedDB autosave, reload recovery, SAVE checkpoint, CANCEL, cover upload, image sorting/removal, project creation/removal, visual changes, PREVIEW, PUBLISH export and default restoration passed.
- Release import exercised in an isolated directory: uploaded image bytes materialized into hashed assets, content JSON updated, originals untouched; arbitrary external image URLs, path traversal and unsupported CSS rejected.
- Direct comparison against the previous Git commit confirms the original `src/data.js` project text and PDF resource references are unchanged. `public/projects/` has no Git modifications.
- `git diff --check`: passed.

Known nonblocking build output: client-only Motion and React Router modules emit `use client` directive warnings in Vite.

Editor limits are explicit: it is a loopback-only administrator build, not a remote authentication service. Local draft storage and release export are not online synchronization or deployment. Uploaded content becomes public only after import, review, commit and a successful hosting deployment.

These local checks do not establish GitHub Actions success or public HTTPS availability; those must be verified separately.

## Exhibition and secure backend update

- New first-visit skip-able intro, specified first two projects, cream ending, six filters, right scroll index, snapped module dragging and undo are implemented.
- Node backend adds server-side login, SQLite persistence and server-only GitHub publishing. Five Node tests and six Playwright tests exercise authentication, CSRF, restart persistence, conflicts, local and remote editing, cross-browser drafts, snap/undo and truthful queued/running status. GitHub calls in publisher tests are mocks, not real deployments.
- The admin build compiles separately and is gated by the backend session API. A real hosting platform, HTTPS backend origin, administrator hash and persistent volume are not yet provided.
- The public gear explicitly explains missing backend configuration until a real `VITE_CMS_URL` is supplied.
- A server-side deployment is only considered successful after Actions success, HTTPS assets and exact deployed content matching the requested commit. Stale-content rejection is tested.
- Production backend/container deployment, actual GitHub API permissions, repository visibility/Pages eligibility and public HTTPS remain unverified due to missing hosting configuration and the live proxy policy.

- A plain static HTTP server with no SPA rewrite verified all 14 generated physical routes and reloads return HTTP 200; 24 responsive route checks passed.
- The collapsing sticky header was explicitly tested around its threshold; reserving flow height removes scroll-anchor oscillation on desktop, 390px and 320px.
