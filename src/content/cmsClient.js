let csrf = "";
let revision = 0;
async function request(path, method = "GET", body) {
  const r = await fetch(`/api/${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...(method === "PUT" || path === "publish"
        ? { "If-Match": String(revision) }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `后台请求失败 ${r.status}`);
  if (data.csrfToken) csrf = data.csrfToken;
  if (data.revision !== undefined) revision = data.revision;
  return data;
}
export const cmsSession = () => request("session");
export const cmsLogin = (username, password) =>
  request("login", "POST", { username, password });
export const cmsLogout = () => request("logout", "POST", {});
export const cmsRead = () => request("draft");
export const cmsWrite = (data) => request("draft", "PUT", data);
export const cmsPublish = () => request("publish", "POST", {});
export const cmsPublishStatus = (sha) =>
  request(`publish/status?sha=${encodeURIComponent(sha)}`);
