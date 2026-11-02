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
