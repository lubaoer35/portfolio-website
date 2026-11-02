# Secure administrator backend

GitHub Pages hosts the public static website. It cannot execute the login API, SQLite database, private server-side GitHub credential or content publication operations. Those run in the separate Node backend provided in `server/`.

## What is implemented and tested

- Administrator password verified server-side with salted scrypt.
- Random sessions stored by token hash in SQLite; HttpOnly, SameSite=Strict cookies; Secure cookies required with production HTTPS origins.
- Exact-origin and CSRF checks on mutations, throttled login, logout and session expiration.
- SQLite draft and checkpoint persistence, with optimistic revision matching so one browser cannot silently overwrite another browser's newer edits.
- Uploads are validated image data, retained in persistent drafts, and materialized into hashed static assets when publishing.
- Publishing uses the backend credential to create a non-forced commit of content and images on the existing main branch. It never changes repository visibility.
- A successful commit is only `queued`. Verification checks the exact Actions run, Pages metadata, HTTPS application assets and exact deployed content bytes against the requested commit before returning `success`.
- Anonymous visitors cannot read drafts or call write/publish APIs. The public application never receives the GitHub credential.

Unit tests exercise database restart recovery, authentication/CSRF/conflicts/logout, safe commit generation and stale-content rejection. Browser tests use an isolated test account and mock GitHub publisher to prove cross-browser persistence and honest status reporting. These tests are **not evidence of a production backend deployment or a real GitHub publication**.

## Hosting prerequisites still required

Use Node.js 24.5+ with a real persistent filesystem volume, HTTPS reverse proxy and a backend domain. Ephemeral filesystem hosting is insufficient for SQLite durability. No hosting platform/account or backend domain has been supplied in this task.

Provide server environment values securely, never through public `VITE_*` variables or chat:

- `NODE_ENV=production`
- `CMS_PUBLIC_ORIGIN`: exact HTTPS origin of the backend, without trailing slash or path.
- `CMS_ADMIN_USERNAME`: administrator name.
- `CMS_ADMIN_PASSWORD_HASH`: scrypt hash generated locally by `npm run cms:password`, reading a password of at least 14 characters from standard input. Do not put the plaintext password in shell history or version control.
- `CMS_DATA_DIR`: mounted persistent directory, writable by the service account.
- `CMS_GITHUB_TOKEN`: fine-grained server-side credential limited to this repository, with Contents write, Actions read and Pages read access. An already injected usable `GH_TOKEN` is reused if present; do not create duplicate credentials before checking existing bindings.
- `CMS_GITHUB_REPOSITORY=lubaoer35/portfolio-website`
- `CMS_BIND_HOST=0.0.0.0`, `PORT=8787` when the hosting proxy requires it.

The current cloud instance has an injected GH_TOKEN name, but GitHub API requests are blocked by the environment proxy. Its API permissions have therefore not been validated. No administrator hash, hosting credentials or backend origin is configured.

## Build and run

```sh
npm ci
npm run build:admin
npm run cms:start
```

Set the environment before starting. The production command preserves environment proxy configuration with Node's `--use-env-proxy` and never disables TLS verification. Serve the backend behind HTTPS with the configured origin. `server/Dockerfile` is supplied for container hosts; mount `/data` as a persistent volume and inject secrets through hosting settings. The Docker configuration has not been built or deployed in this task; the actual Node application has been exercised by tests.

To link the public site's gear button, set non-secret `VITE_CMS_URL` to the verified backend HTTPS origin when building the public website. Until configured, that button explicitly explains the missing connection. No fake login or online synchronization is presented.

## Publication and private repositories

Before publishing, check repository visibility and Pages eligibility with the authenticated GitHub API. Private-repository Pages eligibility depends on the owner's plan and organization policy; never make the repository public to work around a restriction. The existing repository must have Pages Source set to GitHub Actions.

The current proxy blocks `api.github.com` and `lubaoer35.github.io`, so visibility, Pages eligibility, the real deployment result and public HTTPS availability remain unverified. The normal anonymous GitHub repository page also returned 404 while authenticated Git reads work; that is not sufficient evidence to assert a Private flag or Pages entitlement. These destinations are already saved in the environment draft but have not been applied to the running instance.

## Backups and operations

Back up the persistent SQLite directory, including WAL state using SQLite-aware backups or a stopped service. The backend is single-instance; multiple replicas require a shared transactional database rather than independent SQLite volumes. Password hashes and GitHub credentials remain backend-only. Enable normal platform access logging without logging request bodies, cookies, Authorization or passwords.
