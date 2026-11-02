import React, { useRef } from "react";
import { Settings2, X } from "lucide-react";
import { ADMIN_MODE } from "../content/ContentProvider";
export default function AdminAccess() {
  const ref = useRef(null);
  if (ADMIN_MODE) return null;
  const target = import.meta.env.VITE_CMS_URL;
  return (
    <>
      <button
        className="admin-access"
        aria-label="管理员登录"
        onClick={() => {
          if (target && /^https:\/\//.test(target))
            window.location.assign(target);
          else ref.current.showModal();
        }}
      >
        <Settings2 size={16} />
      </button>
      <dialog ref={ref} className="admin-unavailable">
        <button aria-label="关闭后台说明" onClick={() => ref.current.close()}>
          <X size={19} />
        </button>
        <h2>管理员后台尚未连接</h2>
        <p>
          安全后台已在项目中提供，但需要部署后台服务、配置管理员认证和持久化存储，再设置后台
          HTTPS 地址。
        </p>
        <p>
          公开 GitHub Pages
          只提供浏览；它不能运行身份验证或数据库服务。当前不会把本地草稿当作线上同步。
        </p>
      </dialog>
    </>
  );
}
