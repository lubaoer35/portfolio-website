// GitHub Pages returns this same application shell for direct SPA deep links.
import { copyFileSync } from "node:fs";
copyFileSync("dist/index.html", "dist/404.html");
