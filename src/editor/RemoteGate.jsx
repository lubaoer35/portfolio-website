import React, { useEffect, useState } from "react";
import { cmsLogin, cmsSession } from "../content/cmsClient";
import "./editor.css";
export default function RemoteGate({ children }) {
  const [session, setSession] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    cmsSession()
      .then(setSession)
      .catch((e) => setError(e.message));
  }, []);
  if (session?.authenticated) return children;
  return (
    <main className="cms-login">
      <span className="eyebrow">LV BAO ER / SECURE EDITOR</span>
      <h1>
        Administrator
        <br />
        <em>sign in.</em>
      </h1>
      <p>管理员验证在服务端完成。公开访客没有内容写入权限。</p>
      {session && !session.configured && (
        <p role="alert">管理员凭证尚未在后台安全配置，当前不能登录。</p>
      )}
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const data = new FormData(e.currentTarget);
          try {
            setSession(
              await cmsLogin(data.get("username"), data.get("password")),
            );
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          管理员账号
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          密码
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button disabled={busy || !session?.configured}>
          {busy ? "验证中…" : "登录后台"}
        </button>
      </form>
      <small>草稿存储于后台数据库；浏览器不持有 GitHub Token。</small>
    </main>
  );
}
