import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings2,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Upload,
  Download,
  Eye,
  Undo2,
} from "lucide-react";
import { asset } from "../data";
import { EditableText, useContent } from "../content/ContentProvider";
import { getPath, validateContent } from "../content/schema";
import "./editor.css";
import { REMOTE_ADMIN_MODE } from "../content/ContentProvider";
import { cmsPublish, cmsPublishStatus, cmsLogout } from "../content/cmsClient";
function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  ...props
}) {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => setLocal(value ?? ""), [value]);
  const Control = multiline ? "textarea" : "input";
  const commit = () => onChange(type === "number" ? Number(local) : local);
  return (
    <label className="editor-field">
      <span>{label}</span>
      <Control
        type={multiline ? undefined : type}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          if (type === "color") onChange(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (!multiline && e.key === "Enter") e.currentTarget.blur();
        }}
        {...props}
      />
    </label>
  );
}

function reorder(list, i, by) {
  const next = [...list];
  const j = i + by;
  if (j < 0 || j >= next.length) return next;
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
function download(content) {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lv-bao-er-release.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function readImage(file) {
  if (!file || !/^image\/(png|jpeg|webp|avif)$/.test(file.type))
    throw new Error("请选择 PNG、JPG、WebP 或 AVIF 图片");
  if (file.size > 8 * 1024 * 1024) throw new Error("单张图片请控制在 8MB 内");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
function ImageInput({ label, src, onImage }) {
  const c = useContent();
  return (
    <div className="editor-image-input">
      <span>{label}</span>
      {src && (
        <img src={src.startsWith("data:") ? src : asset(src)} alt={label} />
      )}
      <label className="editor-upload">
        <Upload size={14} /> 上传 / 替换
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={async (e) => {
            try {
              const result = await readImage(e.target.files[0]);
              onImage(result);
            } catch (err) {
              c.setError(err.message);
            }
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
export default function EditorPanel() {
  const c = useContent();
  const [tab, setTab] = useState("profile"),
    [projectId, setProjectId] = useState(c.projects[0]?.slug),
    [preview, setPreview] = useState(false),
    [publish, setPublish] = useState(false),
    [exported, setExported] = useState(false);
  const [publishing, setPublishing] = useState(false),
    [publication, setPublication] = useState(null);
  const fileRef = useRef(null),
    panelRef = useRef(null),
    buttonRef = useRef(null);
  const index = Math.max(
    0,
    c.projects.findIndex((p) => p.slug === projectId),
  );
  const p = c.projects[index];
  const projectPath = `projects.${index}`;
  useEffect(() => {
    if (!c.open) return;
    const previous = document.activeElement;
    panelRef.current?.focus();
    return () => previous?.focus?.();
  }, [c.open]);
  const updateProject = (key, value) =>
    c.update(`${projectPath}.${key}`, value);
  const changePages = (pages) => updateProject("pages", pages);
  const removeProject = () => {
    if (c.projects.length === 1) {
      c.setError("至少保留一个项目");
      return;
    }
    if (!window.confirm(`从网站草稿中删除 ${p.name}？原始图片文件不会删除。`))
      return;
    c.replace({
      ...c.content,
      projects: c.projects.filter((x) => x.slug !== p.slug),
      featuredSlugs: c.featuredSlugs.filter((x) => x !== p.slug),
    });
    setProjectId(c.projects.find((x) => x.slug !== p.slug).slug);
  };
  const addProject = () => {
    const slug = `new-project-${Date.now()}`;
    const next = {
      slug,
      number: String(c.projects.length + 1).padStart(2, "0"),
      name: "新项目（请编辑）",
      chinese: "请填写真实项目名称",
      tags: [],
      year: null,
      pageRange: "自定义",
      accent: "#193b85",
      tint: "#edf0f7",
      cover: p.cover,
      coverSmall: p.coverSmall,
      summary: "请填写真实项目说明",
      intro: "",
      sections: [],
      services: [],
      pages: [],
    };
    if (c.replace({ ...c.content, projects: [...c.projects, next] }))
      setProjectId(slug);
  };
  const selectedStyle = c.elementStyles[c.selected] || {};
  const updateStyle = (key, value) =>
    c.replace({
      ...c.content,
      elementStyles: {
        ...c.elementStyles,
        [c.selected]: { ...selectedStyle, [key]: value },
      },
    });
  const close = () => {
    c.setOpen(false);
    c.setEditing(false);
  };
  return (
    <>
      <button
        ref={buttonRef}
        className="editor-gear"
        aria-label="打开管理员编辑台"
        aria-expanded={c.open}
        onClick={() => {
          c.setOpen(!c.open);
          c.setEditing(!c.open);
          setPreview(false);
        }}
      >
        <Settings2 size={19} />
        <span>EDITOR</span>
      </button>
      {preview && (
        <div className="editor-preview-bar">
          <span>本机草稿预览 · 未发布</span>
          <button
            onClick={() => {
              setPreview(false);
              c.setOpen(true);
              c.setEditing(true);
            }}
          >
            返回编辑台
          </button>
        </div>
      )}
      {c.open && (
        <aside
          ref={panelRef}
          tabIndex={-1}
          className="editor-panel"
          aria-label="管理员编辑台"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          <header>
            <div>
              <small>
                {REMOTE_ADMIN_MODE
                  ? "AUTHENTICATED ADMIN / 已验证管理员"
                  : "LOCAL ADMIN / 本机管理员"}
              </small>
              <h2>Editorial desk.</h2>
            </div>
            <button aria-label="关闭编辑台" onClick={close}>
              <X />
            </button>
          </header>
          <p className="editor-storage-note">
            {REMOTE_ADMIN_MODE
              ? "后台已验证身份，草稿持久化保存至服务器。发布需等待 GitHub 部署确认。"
              : "本机专用编辑构建。草稿保存在此浏览器，不会自动修改线上网站。"}
          </p>
          <div className="editor-actions">
            <button onClick={() => c.save()}>SAVE</button>
            <button onClick={c.cancel}>CANCEL</button>
            <button
              onClick={() => {
                setPreview(true);
                c.setEditing(false);
                c.setOpen(false);
              }}
            >
              PREVIEW
            </button>
            <button
              onClick={() => {
                setPublish(true);
                setExported(false);
              }}
            >
              PUBLISH
            </button>
          </div>
          <p role="status" className="editor-status">
            {c.status || "正在载入本机草稿…"}
          </p>
          {c.error && (
            <p role="alert" className="editor-error">
              {c.error}
              <button aria-label="关闭错误提示" onClick={() => c.setError("")}>
                <X size={12} />
              </button>
            </p>
          )}
          <div className="editor-history">
            <button disabled={!c.canUndo} onClick={c.undo}>
              <Undo2 size={14} /> 撤销最近操作
            </button>
            {REMOTE_ADMIN_MODE && (
              <button
                onClick={async () => {
                  await cmsLogout();
                  location.reload();
                }}
              >
                退出登录
              </button>
            )}
          </div>
          <nav className="editor-tabs" aria-label="编辑台功能">
            {[
              ["profile", "个人信息"],
              ["projects", "项目与图片"],
              ["visual", "视觉样式"],
              ["settings", "备份与发布"],
            ].map(([id, name]) => (
              <button
                key={id}
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
              >
                {name}
              </button>
            ))}
          </nav>
          <div className="editor-page-links">
            <Link to="/">Home</Link>
            <Link to="/work">Work</Link>
            <Link to="/about">About</Link>
          </div>
          <div className="editor-content">
            {tab === "profile" && (
              <>
                <h3>个人信息</h3>
                <p className="editor-help">
                  也可双击页面中带虚线的文字直接修改。
                </p>
                {[
                  ["name", "姓名"],
                  ["englishName", "英文名"],
                  ["email", "联系邮箱"],
                  ["school", "学校"],
                  ["major", "专业"],
                  ["degree", "学历"],
                  ["graduation", "届别"],
                  ["direction", "设计方向"],
                  ["intro", "个人介绍"],
                  ["bio", "补充介绍"],
                ].map(([id, label]) => (
                  <Field
                    key={id}
                    label={label}
                    value={c.profile[id]}
                    multiline={["intro", "bio"].includes(id)}
                    onChange={(v) => c.update(`profile.${id}`, v)}
                  />
                ))}
                <ImageInput
                  label="个人照片"
                  src={c.profile.portrait}
                  onImage={(v) => c.update("profile.portrait", v)}
                />
                <ImageInput
                  label="首页艺术标题（原稿默认保留）"
                  src={c.hero.image}
                  onImage={(v) => c.update("hero.image", v)}
                />
                <h3>软件技能</h3>
                <Field
                  label="每行一个技能，不使用虚构百分比"
                  value={c.profile.skills.join("\n")}
                  multiline
                  onChange={(v) => c.update("profile.skills", v.split("\n"))}
                />
                <h3>获奖信息</h3>
                {c.profile.awards.map((award, i) => (
                  <fieldset key={i}>
                    <legend>奖项 {i + 1}</legend>
                    {["赛事原始名称", "奖项", "排序信息"].map((label, j) => (
                      <Field
                        key={j}
                        label={label}
                        value={award[j]}
                        onChange={(v) =>
                          c.update(`profile.awards.${i}.${j}`, v)
                        }
                      />
                    ))}
                    <button
                      className="editor-danger"
                      onClick={() =>
                        c.update(
                          "profile.awards",
                          c.profile.awards.filter((_, j) => j !== i),
                        )
                      }
                    >
                      删除这条奖项
                    </button>
                  </fieldset>
                ))}
                <button
                  className="editor-add"
                  onClick={() =>
                    c.update("profile.awards", [
                      ...c.profile.awards,
                      ["请填写真实赛事", "", ""],
                    ])
                  }
                >
                  <Plus size={14} /> 添加真实奖项
                </button>
                <h3>个人经历</h3>
                {c.profile.timeline.map((item, i) => (
                  <fieldset key={i}>
                    <legend>经历 {i + 1}</legend>
                    {[
                      ["date", "时间（未知请注明）"],
                      ["title", "标题"],
                      ["description", "说明"],
                    ].map(([id, label]) => (
                      <Field
                        key={id}
                        label={label}
                        value={item[id]}
                        onChange={(v) =>
                          c.update(`profile.timeline.${i}.${id}`, v)
                        }
                      />
                    ))}
                    <button
                      className="editor-danger"
                      onClick={() =>
                        c.update(
                          "profile.timeline",
                          c.profile.timeline.filter((_, j) => j !== i),
                        )
                      }
                    >
                      删除
                    </button>
                  </fieldset>
                ))}
                <button
                  className="editor-add"
                  onClick={() =>
                    c.update("profile.timeline", [
                      ...c.profile.timeline,
                      { date: "", title: "请填写真实经历", description: "" },
                    ])
                  }
                >
                  添加经历
                </button>
              </>
            )}
            {tab === "projects" && (
              <>
                <div className="editor-section-title">
                  <h3>项目管理</h3>
                  <button aria-label="新增项目" onClick={addProject}>
                    <Plus size={18} />
                  </button>
                </div>
                <label className="editor-field">
                  <span>选择项目</span>
                  <select
                    value={p.slug}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    {c.projects.map((x) => (
                      <option key={x.slug} value={x.slug}>
                        {x.number} / {x.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="editor-project-tools">
                  <Link to={`/work/${p.slug}`}>
                    打开此项目 <Eye size={14} />
                  </Link>
                  <button
                    aria-label="项目上移"
                    disabled={index === 0}
                    onClick={() =>
                      c.update("projects", reorder(c.projects, index, -1))
                    }
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    aria-label="项目下移"
                    disabled={index === c.projects.length - 1}
                    onClick={() =>
                      c.update("projects", reorder(c.projects, index, 1))
                    }
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    aria-label="删除项目"
                    className="editor-danger"
                    onClick={removeProject}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {[
                  ["name", "英文标题"],
                  ["chinese", "中文标题"],
                  ["summary", "项目描述"],
                  ["intro", "背景与概念"],
                  ["year", "年份（无依据留空）"],
                ].map(([id, label]) => (
                  <Field
                    key={id}
                    label={label}
                    value={p[id] || ""}
                    multiline={["summary", "intro"].includes(id)}
                    onChange={(v) =>
                      updateProject(id, id === "year" ? v || null : v)
                    }
                  />
                ))}
                <Field
                  label="设计内容（用 / 分隔）"
                  value={p.services.join(" / ")}
                  onChange={(v) =>
                    updateProject(
                      "services",
                      v.split("/").map((x) => x.trim()),
                    )
                  }
                />
                <fieldset>
                  <legend>项目分类</legend>
                  {c.categories
                    .filter((x) => x.id !== "All")
                    .map((x) => (
                      <label className="editor-check" key={x.id}>
                        <input
                          type="checkbox"
                          checked={p.tags.includes(x.id)}
                          onChange={(e) =>
                            updateProject(
                              "tags",
                              e.target.checked
                                ? [...p.tags, x.id]
                                : p.tags.filter((id) => id !== x.id),
                            )
                          }
                        />
                        {x.label}
                      </label>
                    ))}
                </fieldset>
                <label className="editor-check">
                  <input
                    type="checkbox"
                    checked={c.featuredSlugs.includes(p.slug)}
                    onChange={(e) =>
                      c.update(
                        "featuredSlugs",
                        e.target.checked
                          ? [...c.featuredSlugs, p.slug]
                          : c.featuredSlugs.filter((x) => x !== p.slug),
                      )
                    }
                  />
                  显示于首页精选
                </label>
                <ImageInput
                  label="项目封面"
                  src={p.cover}
                  onImage={(v) =>
                    c.replace({
                      ...c.content,
                      projects: c.projects.map((x, i) =>
                        i === index ? { ...x, cover: v, coverSmall: v } : x,
                      ),
                    })
                  }
                />
                <h3>项目叙事</h3>
                {p.sections.map((section, i) => (
                  <fieldset key={i}>
                    {["段落标题", "设计说明"].map((label, j) => (
                      <Field
                        key={j}
                        label={label}
                        value={section[j]}
                        multiline={j === 1}
                        onChange={(v) =>
                          c.update(`${projectPath}.sections.${i}.${j}`, v)
                        }
                      />
                    ))}
                    <button
                      className="editor-danger"
                      onClick={() =>
                        updateProject(
                          "sections",
                          p.sections.filter((_, j) => j !== i),
                        )
                      }
                    >
                      删除段落
                    </button>
                  </fieldset>
                ))}
                <button
                  className="editor-add"
                  onClick={() =>
                    updateProject("sections", [
                      ...p.sections,
                      ["请填写标题", ""],
                    ])
                  }
                >
                  添加说明段落
                </button>
                <h3>项目图片 · {p.pages.length}</h3>
                <p className="editor-help">
                  删除仅移除草稿中的引用，原始 PDF 图片不会从仓库删除。
                </p>
                {p.pages.map((image, i) => (
                  <div className="editor-gallery-row" key={image.src + "-" + i}>
                    <img
                      src={
                        image.small.startsWith("data:")
                          ? image.small
                          : asset(image.small)
                      }
                      alt={image.title}
                    />
                    <Field
                      label={`图片 ${i + 1} 说明`}
                      value={image.title}
                      onChange={(v) =>
                        c.update(`${projectPath}.pages.${i}.title`, v)
                      }
                    />
                    <div>
                      <button
                        aria-label={`图片${i + 1}上移`}
                        disabled={i === 0}
                        onClick={() => changePages(reorder(p.pages, i, -1))}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        aria-label={`图片${i + 1}下移`}
                        disabled={i === p.pages.length - 1}
                        onClick={() => changePages(reorder(p.pages, i, 1))}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        aria-label={`将图片${i + 1}设为封面`}
                        onClick={() =>
                          c.replace({
                            ...c.content,
                            projects: c.projects.map((x, j) =>
                              j === index
                                ? {
                                    ...x,
                                    cover: image.src,
                                    coverSmall: image.small,
                                  }
                                : x,
                            ),
                          })
                        }
                      >
                        设为封面
                      </button>
                      <button
                        aria-label={`删除图片${i + 1}`}
                        onClick={() =>
                          changePages(p.pages.filter((_, j) => j !== i))
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <ImageInput
                      label="替换此图片"
                      onImage={(v) =>
                        changePages(
                          p.pages.map((x, j) =>
                            i === j ? { ...x, src: v, small: v } : x,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
                <ImageInput
                  label="添加新作品图片"
                  onImage={(v) =>
                    changePages([
                      ...p.pages,
                      {
                        number: null,
                        title: "请填写图片说明",
                        src: v,
                        small: v,
                      },
                    ])
                  }
                />
                <h3>分类名称</h3>
                {c.categories.map((x, i) => (
                  <Field
                    key={x.id}
                    label={x.id}
                    value={x.label}
                    onChange={(v) => c.update(`categories.${i}.label`, v)}
                  />
                ))}
              </>
            )}
            {tab === "visual" && (
              <>
                <h3>全站视觉</h3>
                {[
                  ["background", "背景"],
                  ["text", "文字"],
                  ["accent", "强调色"],
                ].map(([id, label]) => (
                  <Field
                    key={id}
                    type="color"
                    label={label}
                    value={c.theme[id]}
                    onChange={(v) => c.update(`theme.${id}`, v)}
                  />
                ))}
                <label className="editor-field">
                  <span>全站字体</span>
                  <select
                    value={c.theme.font}
                    onChange={(e) => c.update("theme.font", e.target.value)}
                  >
                    <option value="sans">现代无衬线</option>
                    <option value="serif">编辑式衬线</option>
                  </select>
                </label>
                <Field
                  label="区块留白（30—140px）"
                  type="number"
                  min="30"
                  max="140"
                  value={c.theme.spacing}
                  onChange={(v) => c.update("theme.spacing", v)}
                />
                <h3>选中元素</h3>
                <p className="editor-help">
                  点击页面中带虚线的文字或图片以选择；双击文字进入直接编辑。
                </p>
                <code>{c.selected}</code>
                <Field
                  label="颜色"
                  type="color"
                  value={selectedStyle.color || c.theme.text}
                  onChange={(v) => updateStyle("color", v)}
                />
                {[
                  ["fontSize", "字号", 8, 120, 16],
                  ["width", "宽度 %", 50, 100, 100],
                  ["gap", "下方间距 px", 0, 100, 0],
                  ["offsetX", "水平位置 px", -160, 160, 0],
                  ["offsetY", "垂直位置 px", -160, 160, 0],
                ].map(([id, label, min, max, fallback]) => (
                  <Field
                    key={id}
                    label={label}
                    type="number"
                    min={min}
                    max={max}
                    value={selectedStyle[id] ?? fallback}
                    onChange={(v) => updateStyle(id, v)}
                  />
                ))}
                {[
                  [
                    "font",
                    "字体",
                    [
                      ["sans", "无衬线"],
                      ["serif", "衬线"],
                    ],
                  ],
                  [
                    "align",
                    "对齐",
                    [
                      ["left", "左对齐"],
                      ["center", "居中"],
                      ["right", "右对齐"],
                    ],
                  ],
                  [
                    "ratio",
                    "图片容器比例",
                    [
                      ["original", "保留原比例"],
                      ["landscape", "16:9"],
                      ["square", "1:1"],
                      ["portrait", "3:4"],
                    ],
                  ],
                ].map(([id, label, choices]) => (
                  <label className="editor-field" key={id}>
                    <span>{label}</span>
                    <select
                      value={selectedStyle[id] || choices[0][0]}
                      onChange={(e) => updateStyle(id, e.target.value)}
                    >
                      {choices.map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <button
                  onClick={() => {
                    const styles = { ...c.elementStyles };
                    delete styles[c.selected];
                    c.replace({ ...c.content, elementStyles: styles });
                  }}
                >
                  恢复此元素默认样式
                </button>
              </>
            )}
            {tab === "settings" && (
              <>
                <h3>备份、导入与发布</h3>
                <p>
                  {REMOTE_ADMIN_MODE
                    ? "当前已连接服务端持久化存储，可在其他已验证设备读取草稿。发布提交与网站上线是两个独立步骤。"
                    : "所有 SAVE 与自动保存仅发生在本机浏览器；当前本机模式没有跨设备同步。"}
                </p>
                <button
                  className="editor-add"
                  onClick={() => download(c.content)}
                >
                  <Download size={15} /> 导出草稿 JSON
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={async (e) => {
                    try {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 65 * 1024 * 1024)
                        throw new Error("发布包超过 65MB");
                      const data = validateContent(
                        JSON.parse(await file.text()),
                      );
                      if (c.replace(data)) c.setError("");
                    } catch (err) {
                      c.setError(err.message);
                    }
                    e.target.value = "";
                  }}
                />
                <button
                  className="editor-add"
                  onClick={() => fileRef.current.click()}
                >
                  <Upload size={15} /> 导入 JSON 草稿
                </button>
                <button className="editor-add" onClick={c.reset}>
                  <Undo2 size={15} /> 恢复内置默认内容
                </button>
                <h3>发布步骤</h3>
                <ol>
                  <li>PUBLISH 导出经过校验的发布包。</li>
                  <li>
                    在本地项目执行{" "}
                    <code>npm run content:import -- 发布包路径</code>。
                  </li>
                  <li>构建检查后提交、推送 GitHub，由 Pages 工作流部署。</li>
                  <li>确认线上部署成功后才视为已发布。</li>
                </ol>
                <p>
                  本编辑台不保存或请求 GitHub Token，也没有浏览器端管理员密钥。
                </p>
              </>
            )}
          </div>
        </aside>
      )}
      {publish && (
        <div
          className="editor-publish-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPublish(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-title"
            className="editor-publish-dialog"
          >
            <h2 id="publish-title">
              {REMOTE_ADMIN_MODE ? "发布到 GitHub Pages" : "导出发布包"}
            </h2>
            {REMOTE_ADMIN_MODE ? (
              <>
                <p>
                  服务端会将已保存的后台草稿与上传图片提交到指定仓库
                  main。提交成功仅表示部署排队，需检查 Actions 与 HTTPS
                  验证结果。
                </p>
                <button
                  disabled={publishing}
                  onClick={async () => {
                    setPublishing(true);
                    try {
                      if (await c.save()) setPublication(await cmsPublish());
                    } catch (e) {
                      c.setError(e.message);
                    } finally {
                      setPublishing(false);
                    }
                  }}
                >
                  {publishing ? "正在创建发布提交…" : "确认提交并部署"}
                </button>
                {publication && (
                  <div role="status">
                    <p>{publication.message || publication.status}</p>
                    <p>状态：{publication.status}</p>
                    <button
                      onClick={async () => {
                        try {
                          setPublication({
                            ...publication,
                            ...(await cmsPublishStatus(publication.commit)),
                          });
                        } catch (e) {
                          c.setError(e.message);
                        }
                      }}
                    >
                      检查部署结果
                    </button>
                    {publication.status === "success" && (
                      <a
                        href={publication.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        打开已验证的网站
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p>
                  当前没有配置线上写入服务。此操作会下载包含内容和上传图片的
                  JSON 文件，<strong>不会自动发布到公网</strong>。
                </p>
                <p>
                  导出后运行内容导入命令，再构建、提交 GitHub 并检查 Pages
                  部署。
                </p>
              </>
            )}
            {exported && <p role="status">发布包已导出；线上网站尚未更新。</p>}
            <div>
              <button
                onClick={async () => {
                  if (await c.save()) {
                    download(c.content);
                    setExported(true);
                  }
                }}
              >
                确认导出发布包
              </button>
              <button onClick={() => setPublish(false)}>关闭</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
