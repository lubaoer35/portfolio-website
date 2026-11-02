// Emit physical Pages routes so direct project visits/refreshes return HTTP 200.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { validateContent } from "../src/content/schema.js";
const html = readFileSync("dist/index.html", "utf8");
const content = validateContent(
  JSON.parse(readFileSync("public/content.json", "utf8")),
);
const routes = [
  "work",
  "about",
  ...content.projects.map((p) => `work/${p.slug}`),
];
if (content.projects.some((p) => p.slug === "other-works"))
  for (const id of [
    "illustration-posters",
    "commerce",
    "motion-3d",
    "aigc-film",
  ])
    routes.push(`work/other-works/${id}`);
for (const route of routes) {
  mkdirSync(`dist/${route}`, { recursive: true });
  writeFileSync(`dist/${route}/index.html`, html);
}
copyFileSync("dist/index.html", "dist/404.html");
console.log(
  `Created ${routes.length} physical routes and a fallback for GitHub Pages.`,
);
