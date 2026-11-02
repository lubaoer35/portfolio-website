import test from "node:test";
import assert from "node:assert/strict";
import { defaultContent } from "../src/content/defaults.js";
import { validateContent, setPath } from "../src/content/schema.js";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
test("default website preserves eight projects, 47 source pages and PDF integrity", () => {
  validateContent(defaultContent);
  assert.equal(defaultContent.projects.length, 8);
  assert.equal(
    defaultContent.projects.reduce((n, p) => n + p.pages.length, 0),
    47,
  );
  const manifest = JSON.parse(
    readFileSync(new URL("../public/projects/manifest.json", import.meta.url)),
  );
  assert.equal(manifest.pages.length, 54);
  const pdf = readFileSync(
    new URL("../public/projects/lv-bao-er-portfolio.pdf", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(pdf).digest("hex"),
    manifest.sourceSha256,
  );
  for (const page of manifest.pages)
    for (const path of [
      page.image,
      page.thumbnail,
      ...page.embeddedImages.map((x) => x.file),
    ])
      assert.ok(existsSync(new URL("../public" + path, import.meta.url)), path);
});
test("release validation rejects foreign image URLs, duplicate slugs and arbitrary styles", () => {
  for (const mutate of [
    (c) => (c.projects[0].cover = "https://example.invalid/image.png"),
    (c) => (c.projects[0].slug = "../escape"),
    (c) => (c.projects[1].slug = c.projects[0].slug),
    (c) => (c.theme.accent = "url(javascript:alert(1))"),
    (c) => (c.elementStyles.x = { position: "fixed" }),
  ]) {
    const c = structuredClone(defaultContent);
    mutate(c);
    assert.throws(() => validateContent(c));
  }
  assert.throws(() => setPath(defaultContent, "__proto__.polluted", "yes"));
  assert.equal({}.polluted, undefined);
});
