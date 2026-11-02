# Interaction design and preview

## Local preview

```sh
npm ci
npm run dev
```

Open the development server shown by Vite in your local browser. For the GitHub Pages base path:

```sh
npm run build -- --base=/portfolio-website/
npm run preview -- --base=/portfolio-website/ --port 4174
```

## What to review

1. Reload Home: the original blue lettering slowly resolves from a slight offset, with a brief echo; the paper and source image colors are unchanged.
2. Use a mouse: the dot cursor becomes a “View Project” circle over project images; captions fade in as the image gently enlarges inside its unchanged frame.
3. Scroll through Home and Works: alternating reveals and opposing image/caption parallax add depth to the asymmetric grid. Artwork is contain-fitted with a safety inset, preserving composition.
4. Open a project: supported browsers use native View Transitions with unique shared visual names. Other browsers use a brief blue veil and a single shared-image overlay. Both wait for the actual React Router DOM commit before measuring the destination.
5. Use Back to Top in the footer: the progress ring tracks the page; the arrow scrolls back to the beginning.
6. Test touch and reduced-motion modes: touch has no custom cursor, desktop parallax is disabled on narrow/coarse-pointer devices, and reduced motion removes the title displacement/echo, reveals, parallax, shared animations and smooth scrolling. All navigation and content remain available.

No PDF image assets or project copy were changed. Navigation is never blocked on a slow cover image for more than 450ms of preloading; modifier-click, downloads and external links retain their native behavior. Rapid navigation and browser history cancel stale transitions. The cursor uses Motion values and springs; scroll values update transforms without rendering React on every frame. There is no scroll hijacking.

## Validation in this instance

- Root and GitHub Pages production builds passed.
- Existing 8-project/47-page source-content browser regression passed, including 48 viewport/route checks.
- Motion checks passed: title, cursor modes, fixed hover frame dimensions, caption fade, opposing parallax, native and fallback shared visuals, history, Back to Top, reduced motion and touch navigation.
- 90-frame desktop scroll sample in system Chromium: mean 16.68ms/frame, p95 17.8ms. This is an instance-specific measurement, not a guarantee for every device.
- Actual-browser screencast and desktop/mobile screenshots are provided separately for visual review.

GitHub submission and redeployment follow the user's current task authorization. A local build, exported release or preview does not itself publish changes.
