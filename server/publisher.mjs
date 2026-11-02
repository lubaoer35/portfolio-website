import { createHash } from "node:crypto";
import { validateContent } from "../src/content/schema.js";
export function materializeContent(input) {
  const files = new Map();
  function walk(value) {
    if (typeof value === "string" && value.startsWith("data:image/")) {
      const [, mime, base64] =
        value.match(/^data:image\/(png|jpeg|webp|avif);base64,(.+)$/) || [];
      if (!base64) throw new Error("无效的上传图片");
      const bytes = Buffer.from(base64, "base64");
      if (bytes.length > 8 * 1024 * 1024) throw new Error("单张图片超过8MB");
      const name = `/editor-assets/${createHash("sha256").update(bytes).digest("hex")}.${mime === "jpeg" ? "jpg" : mime}`;
      files.set("public" + name, bytes);
      return name;
    }
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, walk(v)]),
      );
    return value;
  }
  const content = validateContent(walk(validateContent(input)));
  files.set(
    "public/content.json",
    Buffer.from(JSON.stringify(content, null, 2) + "\n"),
  );
  return { content, files };
}
export function githubPublisher({
  token,
  repository = "lubaoer35/portfolio-website",
  fetchImpl = fetch,
}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
    throw new Error("Invalid repository");
  const api = async (path, method = "GET", body) => {
    if (!token) throw new Error("服务端 GitHub 凭证未配置");
    const r = await fetchImpl(
      `https://api.github.com/repos/${repository}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!r.ok)
      throw new Error(
        `GitHub ${method} ${path.split("?")[0]} 返回 ${r.status}，请检查网络、仓库权限和 Pages 配置`,
      );
    return r.status === 204 ? null : r.json();
  };
  return {
    async publish(input) {
      const { content, files } = materializeContent(input);
      const ref = await api("/git/ref/heads/main");
      const parent = await api(`/git/commits/${ref.object.sha}`);
      const tree = await api(`/git/trees/${parent.tree.sha}?recursive=1`);
      if (tree.truncated)
        throw new Error("仓库文件列表被截断，无法安全核对图片");
      const existing = new Set(tree.tree.map((x) => x.path));
      const images = [
        content.hero.image,
        content.profile.portrait,
        ...content.projects.flatMap((p) => [
          p.cover,
          p.coverSmall,
          ...p.pages.flatMap((x) => [x.src, x.small]),
        ]),
      ];
      for (const image of images)
        if (!files.has("public" + image) && !existing.has("public" + image))
          throw new Error("仓库缺少图片：" + image);
      const entries = [];
      for (const [path, bytes] of files) {
        if (path !== "public/content.json" && existing.has(path)) continue;
        const blob = await api("/git/blobs", "POST", {
          encoding: "base64",
          content: bytes.toString("base64"),
        });
        entries.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      }
      const nextTree = await api("/git/trees", "POST", {
        base_tree: parent.tree.sha,
        tree: entries,
      });
      const commit = await api("/git/commits", "POST", {
        message: "Publish reviewed portfolio content",
        tree: nextTree.sha,
        parents: [ref.object.sha],
      });
      await api("/git/refs/heads/main", "PATCH", {
        sha: commit.sha,
        force: false,
      });
      return {
        commit: commit.sha,
        status: "queued",
        workflowUrl: `https://github.com/${repository}/actions`,
        message: "发布提交已推送，尚需等待 GitHub Actions 与 HTTPS 验证",
      };
    },
    async status(sha) {
      if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error("无效提交");
      const list = await api(`/actions/runs?head_sha=${sha}&event=push`);
      const run = list.workflow_runs?.find(
        (x) => x.path === ".github/workflows/deploy.yml",
      );
      if (!run) return { status: "queued" };
      if (run.status !== "completed")
        return { status: "running", workflowUrl: run.html_url };
      if (run.conclusion !== "success")
        return {
          status: "failed",
          conclusion: run.conclusion,
          workflowUrl: run.html_url,
        };
      const pages = await api("/pages");
      if (!pages.html_url?.startsWith("https://"))
        return { status: "unverified", workflowUrl: run.html_url };
      const response = await fetchImpl(pages.html_url, {
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok)
        return { status: "unverified", workflowUrl: run.html_url };
      const html = await response.text();
      const script = html.match(/<script[^>]+src="([^"]+)"/);
      if (!script) return { status: "unverified", workflowUrl: run.html_url };
      const assetUrl = new URL(script[1], pages.html_url);
      if (assetUrl.origin !== new URL(pages.html_url).origin)
        return { status: "unverified", workflowUrl: run.html_url };
      const assetResponse = await fetchImpl(assetUrl, {
        signal: AbortSignal.timeout(20000),
      });
      const contentResponse = await fetchImpl(
        new URL("content.json", pages.html_url),
        { signal: AbortSignal.timeout(20000) },
      );
      if (!assetResponse.ok || !contentResponse.ok)
        return { status: "unverified", workflowUrl: run.html_url };
      const deployedBytes = Buffer.from(await contentResponse.arrayBuffer());
      validateContent(JSON.parse(deployedBytes.toString("utf8")));
      const expected = await api(`/contents/public/content.json?ref=${sha}`);
      if (expected.encoding !== "base64" || !expected.content)
        return { status: "unverified", workflowUrl: run.html_url };
      const expectedBytes = Buffer.from(expected.content, "base64");
      if (!deployedBytes.equals(expectedBytes))
        return { status: "unverified", workflowUrl: run.html_url };
      return {
        status: "success",
        url: pages.html_url,
        workflowUrl: run.html_url,
      };
    },
  };
}
