import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { createReadStream, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { validateContent } from "../src/content/schema.js";
import { githubPublisher } from "./publisher.mjs";
export const hashPassword = (
  password,
  salt = randomBytes(16).toString("hex"),
) => `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const digest = (value) => createHash("sha256").update(value).digest("hex");
const safeEqual = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  a.length === b.length &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
function checkPassword(value, hash) {
  if (
    !/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/.test(hash || "") ||
    typeof value !== "string" ||
    value.length > 1024
  )
    return false;
  return safeEqual(hashPassword(value, hash.split(":")[1]), hash);
}
export function createCmsServer({
  dataDir,
  passwordHash,
  origin,
  username = "admin",
  secureCookies = true,
  staticDir = resolve("dist-admin"),
  publisher,
} = {}) {
  if (!dataDir || !origin)
    throw new Error("CMS_DATA_DIR and CMS_PUBLIC_ORIGIN are required");
  const parsed = new URL(origin);
  if (
    parsed.origin !== origin ||
    (!secureCookies && !["localhost", "127.0.0.1"].includes(parsed.hostname)) ||
    (secureCookies && parsed.protocol !== "https:")
  )
    throw new Error("CMS origin/cookie configuration is unsafe");
  if (passwordHash && !/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/.test(passwordHash))
    throw new Error("CMS_ADMIN_PASSWORD_HASH 格式无效");
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(resolve(dataDir, "portfolio.sqlite"));
  db.exec(
    "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS drafts(id INTEGER PRIMARY KEY,content TEXT,checkpoint TEXT,revision INTEGER); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,csrf TEXT,expires INTEGER); CREATE TABLE IF NOT EXISTS publications(id INTEGER PRIMARY KEY,commit_sha TEXT,created TEXT);",
  );
  const attempts = new Map();
  let publishing = false;
  const send = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(data));
  };
  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
    );
    const url = new URL(req.url, origin);
    const sessionToken = req.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("cms_session="))
      ?.slice(12);
    const session = sessionToken
      ? db
          .prepare("SELECT * FROM sessions WHERE token=? AND expires>?")
          .get(digest(sessionToken), Date.now())
      : null;
    const cookie = (token, age) =>
      `cms_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${age}${secureCookies ? "; Secure" : ""}`;
    try {
      if (url.pathname.startsWith("/api/")) {
        if (req.method !== "GET" && req.headers.origin !== origin) {
          send(res, 403, { error: "Origin 不匹配" });
          return;
        }
        if (url.pathname === "/api/session" && req.method === "GET") {
          send(res, 200, {
            authenticated: !!session,
            csrfToken: session?.csrf,
            configured: !!passwordHash,
          });
          return;
        }
        if (url.pathname === "/api/health") {
          send(res, 200, { ready: !!passwordHash, storage: "sqlite" });
          return;
        }
        if (url.pathname !== "/api/login" && !session) {
          send(res, 401, { error: "请先登录管理员账号" });
          return;
        }
        if (
          session &&
          req.method !== "GET" &&
          !safeEqual(req.headers["x-csrf-token"], session.csrf)
        ) {
          send(res, 403, { error: "CSRF 校验失败" });
          return;
        }
        let body = {};
        if (["POST", "PUT"].includes(req.method)) {
          if (!req.headers["content-type"]?.startsWith("application/json")) {
            send(res, 415, { error: "仅接受 JSON" });
            return;
          }
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (
              size >
              (url.pathname === "/api/login" ? 16 * 1024 : 66 * 1024 * 1024)
            ) {
              send(res, 413, { error: "请求过大" });
              return;
            }
            chunks.push(chunk);
          }
          try {
            body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
          } catch {
            send(res, 400, { error: "JSON 格式错误" });
            return;
          }
        }
        if (url.pathname === "/api/login" && req.method === "POST") {
          if (!passwordHash) {
            send(res, 503, { error: "管理员密码尚未在服务端配置" });
            return;
          }
          const ip = req.socket.remoteAddress;
          let rate = attempts.get(ip);
          if (!rate || rate.until < Date.now()) {
            rate = { count: 0, until: Date.now() + 15 * 60 * 1000 };
            attempts.set(ip, rate);
          }
          if (rate.count >= 5) {
            send(res, 429, { error: "尝试次数过多，请稍后再试" });
            return;
          }
          rate.count++;
          if (
            body.username !== username ||
            !checkPassword(body.password, passwordHash)
          ) {
            send(res, 401, { error: "账号或密码错误" });
            return;
          }
          attempts.delete(ip);
          db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
          const token = randomBytes(32).toString("hex"),
            csrf = randomBytes(24).toString("hex");
          db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
            digest(token),
            csrf,
            Date.now() + 12 * 3600000,
          );
          res.setHeader("Set-Cookie", cookie(token, 43200));
          send(res, 200, { authenticated: true, csrfToken: csrf });
          return;
        }
        if (url.pathname === "/api/logout" && req.method === "POST") {
          db.prepare("DELETE FROM sessions WHERE token=?").run(
            digest(sessionToken),
          );
          res.setHeader("Set-Cookie", cookie("", 0));
          send(res, 200, { authenticated: false });
          return;
        }
        if (url.pathname === "/api/draft" && req.method === "GET") {
          const row = db.prepare("SELECT * FROM drafts WHERE id=1").get();
          send(
            res,
            200,
            row
              ? {
                  content: JSON.parse(row.content),
                  checkpoint: JSON.parse(row.checkpoint),
                  revision: row.revision,
                }
              : { content: null, checkpoint: null, revision: 0 },
          );
          return;
        }
        if (url.pathname === "/api/draft" && req.method === "PUT") {
          validateContent(body.content);
          validateContent(body.checkpoint);
          const row = db
            .prepare("SELECT revision FROM drafts WHERE id=1")
            .get();
          const revision = row?.revision || 0;
          if (req.headers["if-match"] !== String(revision)) {
            send(res, 409, {
              error: "草稿已在其他设备修改，请重新载入后合并，未覆盖服务器草稿",
            });
            return;
          }
          const next = revision + 1;
          db.prepare(
            "INSERT INTO drafts VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET content=excluded.content,checkpoint=excluded.checkpoint,revision=excluded.revision",
          ).run(
            JSON.stringify(body.content),
            JSON.stringify(body.checkpoint),
            next,
          );
          send(res, 200, { revision: next, savedAt: new Date().toISOString() });
          return;
        }
        if (url.pathname === "/api/publish" && req.method === "POST") {
          if (!publisher) {
            send(res, 503, { error: "服务端 GitHub 发布凭证或连接未配置" });
            return;
          }
          if (publishing) {
            send(res, 409, { error: "已有发布任务正在进行" });
            return;
          }
          const row = db.prepare("SELECT * FROM drafts WHERE id=1").get();
          if (!row) {
            send(res, 400, { error: "请先保存后台草稿" });
            return;
          }
          if (req.headers["if-match"] !== String(row.revision)) {
            send(res, 409, { error: "草稿版本已变化，请重新载入" });
            return;
          }
          publishing = true;
          try {
            const result = await publisher.publish(JSON.parse(row.content));
            db.prepare(
              "INSERT INTO publications(commit_sha,created) VALUES(?,?)",
            ).run(result.commit, new Date().toISOString());
            send(res, 202, result);
          } finally {
            publishing = false;
          }
          return;
        }
        if (url.pathname === "/api/publish/status" && req.method === "GET") {
          const sha = url.searchParams.get("sha");
          if (
            !publisher ||
            !db
              .prepare("SELECT id FROM publications WHERE commit_sha=?")
              .get(sha)
          ) {
            send(res, 404, { error: "发布记录不存在" });
            return;
          }
          send(res, 200, await publisher.status(sha));
          return;
        }
        send(res, 404, { error: "接口不存在" });
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        send(res, 405, { error: "Method not allowed" });
        return;
      }
      const relative = decodeURIComponent(url.pathname);
      const root = resolve(staticDir);
      let path = resolve(root, "." + relative);
      if (path !== root && !path.startsWith(root + sep)) {
        send(res, 403, { error: "Invalid path" });
        return;
      }
      if (!existsSync(path) || statSync(path).isDirectory()) {
        if (extname(path)) {
          send(res, 404, { error: "资源不存在" });
          return;
        }
        path = resolve(root, "index.html");
      }
      if (!existsSync(path)) {
        send(res, 503, { error: "请先构建管理员应用 npm run build:admin" });
        return;
      }
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".webp": "image/webp",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
      };
      res.writeHead(200, {
        "Content-Type": types[extname(path)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": extname(path) === ".html" ? "no-store" : "no-cache",
      });
      if (req.method === "HEAD") res.end();
      else
        createReadStream(path)
          .on("error", () => res.destroy())
          .pipe(res);
    } catch (error) {
      const status = /格式|不能为空|无效|超过|不正确|不存在|超出|重复/.test(
        error.message,
      )
        ? 400
        : 502;
      send(res, status, {
        error:
          status === 400
            ? error.message
            : "后台操作失败。请检查服务端配置、存储与 GitHub 访问；未确认发布成功。",
      });
    }
  });
  server.requestTimeout = 45000;
  server.headersTimeout = 15000;
  server.on("close", () => db.close());
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const origin = process.env.CMS_PUBLIC_ORIGIN;
  const token = process.env.CMS_GITHUB_TOKEN || process.env.GH_TOKEN;
  const server = createCmsServer({
    dataDir: process.env.CMS_DATA_DIR || resolve(".cms-data"),
    passwordHash: process.env.CMS_ADMIN_PASSWORD_HASH,
    origin,
    username: process.env.CMS_ADMIN_USERNAME || "admin",
    secureCookies: process.env.NODE_ENV === "production",
    publisher: token
      ? githubPublisher({
          token,
          repository:
            process.env.CMS_GITHUB_REPOSITORY || "lubaoer35/portfolio-website",
        })
      : null,
  });
  server.listen(
    Number(process.env.PORT || 8787),
    process.env.CMS_BIND_HOST || "127.0.0.1",
    () =>
      console.log(
        "CMS started; persistent data directory configured. Credentials are never logged.",
      ),
  );
}
