import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  renameSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateContent } from "../src/content/schema.js";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2];
if (!file) {
  console.error(
    "Usage: npm run content:import -- /path/to/lv-bao-er-release.json",
  );
  process.exit(1);
}
try {
  const raw = readFileSync(resolve(file));
  if (raw.length > 65 * 1024 * 1024) throw new Error("发布包超过 65MB");
  const content = validateContent(JSON.parse(raw.toString("utf8")));
  const images = new Map();
  function materialize(value) {
    if (typeof value === "string" && value.startsWith("data:image/")) {
      const match = value.match(
        /^data:image\/(png|jpeg|webp|avif);base64,(.+)$/,
      );
      if (!match) throw new Error("图片编码不受支持");
      const bytes = Buffer.from(match[2], "base64");
      if (bytes.length > 8 * 1024 * 1024) throw new Error("单图超过 8MB");
      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      const hash = createHash("sha256").update(bytes).digest("hex");
      const path = `/editor-assets/${hash}.${ext}`;
      images.set(path, bytes);
      return path;
    }
    if (Array.isArray(value)) return value.map(materialize);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, materialize(v)]),
      );
    return value;
  }
  const published = validateContent(materialize(content));
  // Validate every image reference before writing files or replacing published content.
  const refs = [
    published.hero.image,
    published.profile.portrait,
    ...published.projects.flatMap((p) => [
      p.cover,
      p.coverSmall,
      ...p.pages.flatMap((x) => [x.src, x.small]),
    ]),
  ];
  for (const path of refs) {
    if (!images.has(path) && !existsSync(resolve(root, "public", "." + path)))
      throw new Error(`图片文件不存在：${path}`);
  }
  mkdirSync(resolve(root, "public/editor-assets"), { recursive: true });
  for (const [path, bytes] of images)
    writeFileSync(resolve(root, "public", "." + path), bytes);
  const target = resolve(root, "public/content.json");
  if (existsSync(target)) {
    const backups = resolve(root, ".content-backups");
    mkdirSync(backups, { recursive: true });
    copyFileSync(target, resolve(backups, `content-${Date.now()}.json`));
  }
  writeFileSync(target + ".tmp", JSON.stringify(published, null, 2) + "\n");
  renameSync(target + ".tmp", target);
  console.log(
    `Imported ${published.projects.length} projects and ${images.size} uploaded assets. Original PDF assets are untouched. Build, commit and deploy are still required; this command does not publish.`,
  );
} catch (error) {
  console.error("Import failed:", error.message);
  process.exit(1);
}
