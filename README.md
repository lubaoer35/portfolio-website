# 吕宝儿 LV BAO ER — 2027 设计作品集

React 19 + Vite 7. Built from the supplied **54-page portfolio**, with eight authentic project groups, 47 project pages, and original cover lettering. See [the page-by-page audit](docs/pdf-content-audit.md).

## Run locally

Node.js ^20.19.0 or >=22.12.0 (validated with Node 24).

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

## Content

- `/`: original blue lettering, paper texture, six featured projects
- `/work`: All / Brand Visual / UI / Illustration / IP / Motion filtering
- `/work/:slug`: eight case studies with source-page galleries and accessible zoom viewer
- `/about`: original portrait, education, skills and awards from PDF page 2

`src/data.js` holds the source-backed content. `public/projects/` contains original extracted images, full-page WebP renders, responsive thumbnails, the PDF and provenance manifest. No stock images, fabricated commissions, made-up metrics or fake video players are used. Brand names describe portfolio themes, not verified client relationships. Unknown dates are explicitly left unspecified.

The PDF provides video stills and QR codes, not playable video assets. To add playback later, provide original licensed video files or verified URLs.

## Asset import

The generated assets are committed; Python is not required to build the website. To regenerate them, install PyMuPDF and Pillow in a local virtual environment and run:

```sh
python3 scripts/import_portfolio.py /path/to/作品集.pdf
```

See `docs/pdf-content-audit.md` for reviewed transcription and known source ambiguities.

## GitHub Pages deployment

`.github/workflows/deploy.yml` builds on pushes to `main` and deploys through GitHub Actions. Repository Settings → Pages → Source must be **GitHub Actions** before the first deployment. The workflow requests only contents-read, pages-write and id-token-write permissions. No additional secret is required for this workflow.

```sh
npm run build -- --base=/portfolio-website/
```

The application and assets honor Vite's base path. The postbuild step creates `dist/404.html` so GitHub Pages can render client-side deep links. GitHub Pages returns HTTP 404 on direct deep links while displaying the application; hosts that support SPA rewrites should route these paths to `index.html` with HTTP 200.

The expected GitHub Pages address is `https://lubaoer35.github.io/portfolio-website/`; this is a deployment target, **not a claim of publication**. Verify the Actions deployment and public HTTPS response before sharing it.

For other static hosts, upload `dist/` after `npm run build` and configure an SPA fallback to `index.html`.
