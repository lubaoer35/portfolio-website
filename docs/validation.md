# Validation

Validated in the current cloud instance using Node 24, Vite 7 and system Chromium.

- Production build at `/`: passed.
- Production build at `/portfolio-website/`: passed, including generated `404.html`.
- Production browser checks: 8 project routes, 47 source-page gallery entries, all six filters, PDF download, profile/awards/skills, mobile navigation and lightbox open/next/previous/zoom/Escape: passed.
- Responsive checks: 12 routes at 320, 390, 768 and 1440px; no horizontal overflow.
- No browser runtime errors or failed HTTP requests during production checks.
- Source validation: all 54 pages and 108 page image variants exist; 185 extracted embedded assets retain original dimensions; PDF SHA-256 matches the manifest.
- `git diff --check`: passed.

React Router emits non-blocking `use client` directive warnings in this client-only Vite build.

These local results do not establish remote publication, GitHub Actions success or public HTTPS availability. Deployment must be checked independently.
