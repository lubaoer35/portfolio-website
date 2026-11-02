import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCmsServer, hashPassword } from "../server/cms.mjs";
import { defaultContent } from "../src/content/defaults.js";
import { githubPublisher } from "../server/publisher.mjs";

test("server enforces login, CSRF, version checks, durable drafts and logout", async () => {
  const dir = mkdtempSync(join(tmpdir(), "portfolio-cms-test-"));
  const config = {
    dataDir: dir,
    passwordHash: hashPassword("test-password-only-123"),
    origin: "http://127.0.0.1:0",
    secureCookies: false,
    publisher: {
      publish: async () => ({ commit: "a".repeat(40), status: "queued" }),
      status: async () => ({ status: "running" }),
    },
  };
  let server = createCmsServer(config);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  let base = `http://127.0.0.1:${server.address().port}`;
  const request = (
    path,
    {
      method = "GET",
      body,
      cookie,
      csrf,
      version,
      origin = config.origin,
    } = {},
  ) =>
    fetch(base + path, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        ...(version !== undefined ? { "If-Match": String(version) } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    assert.equal((await request("/api/draft")).status, 401);
    assert.equal(
      (
        await request("/api/login", {
          method: "POST",
          origin: "https://attacker.invalid",
          body: { username: "admin", password: "test-password-only-123" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request("/api/login", {
          method: "POST",
          body: { username: "admin", password: "wrong" },
        })
      ).status,
      401,
    );
    const login = await request("/api/login", {
      method: "POST",
      body: { username: "admin", password: "test-password-only-123" },
    });
    assert.equal(login.status, 200);
    assert.match(login.headers.get("set-cookie"), /HttpOnly/);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const { csrfToken } = await login.json();
    assert.equal(
      (
        await request("/api/draft", {
          method: "PUT",
          cookie,
          version: 0,
          body: { content: defaultContent, checkpoint: defaultContent },
        })
      ).status,
      403,
    );
    const saved = await request("/api/draft", {
      method: "PUT",
      cookie,
      csrf: csrfToken,
      version: 0,
      body: { content: defaultContent, checkpoint: defaultContent },
    });
    assert.equal(saved.status, 200);
    assert.equal((await saved.json()).revision, 1);
    assert.equal(
      (
        await request("/api/draft", {
          method: "PUT",
          cookie,
          csrf: csrfToken,
          version: 0,
          body: { content: defaultContent, checkpoint: defaultContent },
        })
      ).status,
      409,
    );
    await new Promise((r) => server.close(r));
    server = createCmsServer(config);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
    const restored = await request("/api/draft", { cookie });
    assert.equal(restored.status, 200);
    const draft = await restored.json();
    assert.equal(draft.revision, 1);
    assert.equal(draft.content.profile.name, "吕宝儿");
    const published = await request("/api/publish", {
      method: "POST",
      cookie,
      csrf: csrfToken,
      version: 1,
      body: {},
    });
    assert.equal(published.status, 202);
    assert.equal((await published.json()).status, "queued");
    assert.equal(
      (
        await request("/api/logout", {
          method: "POST",
          cookie,
          csrf: csrfToken,
          body: {},
        })
      ).status,
      200,
    );
    assert.equal((await request("/api/draft", { cookie })).status, 401);
  } finally {
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true });
  }
});

test("GitHub publisher creates a non-forced content commit and does not claim it is live", async () => {
  const refs = [
    defaultContent.hero.image,
    defaultContent.profile.portrait,
    ...defaultContent.projects.flatMap((p) => [
      p.cover,
      p.coverSmall,
      ...p.pages.flatMap((x) => [x.src, x.small]),
    ]),
  ];
  const calls = [];
  const mock = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ path, method: options.method, body });
    let data;
    if (path.endsWith("/git/ref/heads/main"))
      data = { object: { sha: "a".repeat(40) } };
    else if (path.endsWith("/git/commits/" + "a".repeat(40)))
      data = { tree: { sha: "b".repeat(40) } };
    else if (options.method === "GET" && path.includes("/git/trees/"))
      data = {
        truncated: false,
        tree: refs.map((path) => ({ path: "public" + path })),
      };
    else if (path.endsWith("/git/blobs")) data = { sha: "c".repeat(40) };
    else if (path.endsWith("/git/trees")) data = { sha: "d".repeat(40) };
    else if (path.endsWith("/git/commits")) data = { sha: "e".repeat(40) };
    else if (path.endsWith("/git/refs/heads/main")) data = {};
    else throw new Error("Unexpected GitHub request " + path);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const publisher = githubPublisher({
    token: "test-placeholder-not-a-real-token",
    fetchImpl: mock,
  });
  const result = await publisher.publish(defaultContent);
  assert.equal(result.status, "queued");
  assert.equal(result.commit, "e".repeat(40));
  assert.equal(result.url, undefined);
  assert.equal(calls.at(-1).body.force, false);
  assert.ok(
    calls.some((x) =>
      x.body?.tree?.some((f) => f.path === "public/content.json"),
    ),
  );
});

test("publication verification rejects stale HTTPS content even when Actions reports success", async () => {
  const bytes = JSON.stringify(defaultContent);
  let stale = true;
  const fake = async (url, options = {}) => {
    const u = new URL(url);
    let value;
    if (u.host === "api.github.com") {
      if (u.pathname.endsWith("/actions/runs"))
        value = {
          workflow_runs: [
            {
              path: ".github/workflows/deploy.yml",
              status: "completed",
              conclusion: "success",
              html_url: "https://github.com/example/actions/1",
            },
          ],
        };
      else if (u.pathname.endsWith("/pages"))
        value = { html_url: "https://lubaoer35.github.io/portfolio-website/" };
      else if (u.pathname.endsWith("/contents/public/content.json"))
        value = {
          encoding: "base64",
          content: Buffer.from(bytes).toString("base64"),
        };
      else throw new Error("Unexpected API");
      return new Response(JSON.stringify(value), { status: 200 });
    }
    assert.equal(
      options.headers,
      undefined,
      "No GitHub credential may be forwarded to the public site",
    );
    if (u.pathname.endsWith("content.json"))
      return new Response(
        stale
          ? JSON.stringify({
              ...defaultContent,
              profile: { ...defaultContent.profile, name: "stale" },
            })
          : bytes,
      );
    if (u.pathname.endsWith(".js"))
      return new Response("/* verified application asset */");
    return new Response(
      '<script src="/portfolio-website/assets/app.js"></script>',
    );
  };
  const p = githubPublisher({ token: "test-only", fetchImpl: fake });
  assert.equal((await p.status("a".repeat(40))).status, "unverified");
  stale = false;
  assert.equal((await p.status("a".repeat(40))).status, "success");
});
