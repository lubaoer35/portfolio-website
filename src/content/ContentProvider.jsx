import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { asset } from "../data";
import { defaultContent } from "./defaults";
import { getPath, setPath, validateContent } from "./schema";
import { storeRead, storeWrite } from "./storage";
import { cmsRead, cmsWrite } from "./cmsClient";
export const REMOTE_ADMIN_MODE = import.meta.env.MODE === "admin";
const Context = createContext(null);
export const ADMIN_MODE =
  REMOTE_ADMIN_MODE ||
  (import.meta.env.MODE === "editor" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname));
export function ContentProvider({ children }) {
  const [content, setContent] = useState(defaultContent),
    [checkpoint, setCheckpoint] = useState(defaultContent),
    [editing, setEditing] = useState(false),
    [open, setOpen] = useState(false),
    [selected, setSelected] = useState("profile.intro"),
    [status, setStatus] = useState(""),
    [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const revision = useRef(0);
  const history = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await fetch(asset("/content.json"), {
          cache: "no-cache",
        });
        if (!response.ok) throw new Error("内容文件无法读取，当前显示内置作品");
        let published = validateContent(await response.json());
        let saved = REMOTE_ADMIN_MODE
          ? await cmsRead()
          : ADMIN_MODE
            ? await storeRead()
            : null;
        if (!alive) return;
        if (saved?.content) {
          published = validateContent(saved.content);
          setCheckpoint(validateContent(saved.checkpoint || published));
          setStatus(
            REMOTE_ADMIN_MODE
              ? "已读取后台持久化草稿 · 尚未发布"
              : "已恢复本机草稿 · 未同步线上",
          );
        } else {
          setCheckpoint(published);
        }
        setContent(published);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const t = content.theme;
    document.documentElement.style.setProperty("--paper", t.background);
    document.documentElement.style.setProperty("--blue", t.accent);
    document.documentElement.style.setProperty("--page-text", t.text);
    document.documentElement.style.setProperty(
      "--section-space",
      `${t.spacing}px`,
    );
    document.documentElement.style.setProperty(
      "--body-font",
      t.font === "serif"
        ? 'Georgia, "Noto Serif CJK SC", serif'
        : 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    );
  }, [content.theme]);
  useEffect(() => {
    if (!ADMIN_MODE || !ready) return;
    const version = ++revision.current;
    setStatus(REMOTE_ADMIN_MODE ? "正在保存到后台…" : "正在自动保存本机草稿…");
    const timer = setTimeout(
      () =>
        (REMOTE_ADMIN_MODE
          ? cmsWrite({ content, checkpoint })
          : storeWrite({ content, checkpoint })
        )
          .then(() => {
            if (version === revision.current)
              setStatus(
                REMOTE_ADMIN_MODE
                  ? "后台草稿已持久化保存 · 尚未发布"
                  : "草稿已自动保存到此浏览器 · 未同步线上",
              );
          })
          .catch((e) => setError(`保存失败：${e.message}`)),
      650,
    );
    return () => clearTimeout(timer);
  }, [content, checkpoint, ready]);
  const replace = (next) => {
    try {
      validateContent(next);
      history.current.push(content);
      if (history.current.length > 25) history.current.shift();
      setCanUndo(true);
      setContent(next);
      setError("");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const update = (path, value) => replace(setPath(content, path, value));
  const save = async () => {
    try {
      validateContent(content);
      await (REMOTE_ADMIN_MODE
        ? cmsWrite({ content, checkpoint: content })
        : storeWrite({ content, checkpoint: content }));
      setCheckpoint(structuredClone(content));
      setStatus(
        REMOTE_ADMIN_MODE
          ? "SAVE 成功 · 后台检查点已保存，尚未发布"
          : "SAVE 成功 · 本机检查点已保存，尚未发布",
      );
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const cancel = () => {
    setContent(structuredClone(checkpoint));
    setStatus("已取消未保存修改，恢复至最近 SAVE 检查点");
    setError("");
  };
  const reset = () => {
    if (window.confirm("恢复项目内置默认内容？不会删除任何原始 PDF 图片。"))
      replace(structuredClone(defaultContent));
  };
  const styleFor = (key) => {
    const s = content.elementStyles[key] || {};
    return {
      display: s.width || s.align ? "inline-block" : undefined,
      color: s.color,
      fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
      fontFamily:
        s.font === "serif"
          ? 'Georgia, "Noto Serif CJK SC", serif'
          : s.font === "sans"
            ? "Arial, sans-serif"
            : undefined,
      textAlign: s.align,
      translate:
        s.offsetX || s.offsetY
          ? `${s.offsetX || 0}px ${s.offsetY || 0}px`
          : undefined,
      width: s.width ? `${s.width}%` : undefined,
      marginBottom: s.gap ? `${s.gap}px` : undefined,
      aspectRatio: { landscape: "16 / 9", square: "1", portrait: "3 / 4" }[
        s.ratio
      ],
    };
  };
  const undo = () => {
    const previous = history.current.pop();
    if (previous) setContent(previous);
    setCanUndo(history.current.length > 0);
  };
  const value = {
    undo,
    canUndo,
    ...content,
    content,
    ready,
    isAdmin: ADMIN_MODE,
    editing,
    setEditing,
    open,
    setOpen,
    selected,
    setSelected,
    status,
    error,
    setError,
    update,
    replace,
    save,
    cancel,
    reset,
    styleFor,
  };
  return (
    <Context.Provider value={value}>
      <div
        className={editing ? "editor-surface is-editing" : "editor-surface"}
        onClickCapture={(e) => {
          if (!ADMIN_MODE || !editing) return;
          const node = e.target.closest("[data-edit]");
          if (node) {
            e.preventDefault();
            e.stopPropagation();
            setSelected(node.dataset.edit);
          }
        }}
      >
        {children}
      </div>
    </Context.Provider>
  );
}
export const useContent = () => useContext(Context);
export function EditableText({
  path,
  as: Tag = "span",
  className = "",
  children,
}) {
  const c = useContent();
  const ref = useRef(null);
  const [typing, setTyping] = useState(false);
  const old = useRef("");
  const value = getPath(c.content, path) ?? children ?? "";
  useEffect(() => {
    if (typing) {
      ref.current?.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [typing]);
  return (
    <Tag
      ref={ref}
      className={className}
      data-edit={c.isAdmin && c.editing ? path : undefined}
      style={c.styleFor(path)}
      contentEditable={typing}
      suppressContentEditableWarning
      onDoubleClick={(e) => {
        if (!c.isAdmin || !c.editing) return;
        e.preventDefault();
        e.stopPropagation();
        c.setSelected(path);
        old.current = String(value);
        setTyping(true);
      }}
      onPaste={(e) => {
        if (!typing) return;
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(
          document.createTextNode(e.clipboardData.getData("text/plain")),
        );
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }}
      onBlur={(e) => {
        if (!typing) return;
        const text = e.currentTarget.textContent;
        setTyping(false);
        if (!c.update(path, text)) e.currentTarget.textContent = old.current;
      }}
      onKeyDown={(e) => {
        if (!typing) return;
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.textContent = old.current;
          e.currentTarget.blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}
