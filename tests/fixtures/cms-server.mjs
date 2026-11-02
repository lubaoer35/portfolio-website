// Isolated loopback fixture only. This is not a production account or secret.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createCmsServer, hashPassword } from "../../server/cms.mjs";
const dir = mkdtempSync(join(tmpdir(), "portfolio-browser-cms-"));
const server = createCmsServer({
  dataDir: dir,
  passwordHash: hashPassword("browser-test-password-only"),
  username: "test-admin",
  origin: "http://127.0.0.1:5182",
  secureCookies: false,
  staticDir: resolve("dist-admin"),
  publisher: {
    publish: async () => ({
      commit: "a".repeat(40),
      status: "queued",
      message: "Test deployment queued; not a real publication",
    }),
    status: async () => ({ status: "running" }),
  },
});
server.listen(5182, "127.0.0.1");
const close = () =>
  server.close(() => {
    rmSync(dir, { recursive: true, force: true });
    process.exit(0);
  });
process.on("SIGTERM", close);
process.on("SIGINT", close);
