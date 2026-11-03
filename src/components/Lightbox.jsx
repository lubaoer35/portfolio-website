import React, { useEffect, useRef, useState } from "react";
import {
  Minus,
  Plus,
  ArrowUpRight,
  X,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { asset } from "../data";
import { fullImageSource } from "../imageSources";
export default function Lightbox({ pages, index, setIndex }) {
  const ref = useRef(null);
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    if (index !== null) {
      ref.current.showModal();
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
        ref.current?.close();
      };
    }
  }, [index !== null]);
  useEffect(() => setZoom(false), [index]);
  const change = (dir) =>
    setIndex((i) => (i + dir + pages.length) % pages.length);
  const current = index === null ? null : pages[index];
  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label="作品原稿大图"
      onCancel={() => setIndex(null)}
      onClick={(e) => {
        if (e.target === ref.current) setIndex(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          change(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          change(-1);
        }
      }}
    >
      <div className="lightbox-bar">
        <span>
          {current?.title}
          <small>
            PDF P.{current?.number} / {index === null ? 0 : index + 1} OF{" "}
            {pages.length}
          </small>
        </span>
        <div>
          <button
            className="icon-button"
            onClick={() => setZoom(!zoom)}
            aria-label={zoom ? "缩小图片" : "放大图片"}
          >
            {zoom ? <Minus /> : <Plus />}
          </button>
          {current && (
            <a
              className="icon-button"
              href={asset(fullImageSource(current.src))}
              target="_blank"
              rel="noreferrer"
              aria-label="在新窗口查看原图"
            >
              <ArrowUpRight />
            </a>
          )}
          <button
            className="icon-button"
            onClick={() => setIndex(null)}
            aria-label="关闭大图"
          >
            <X />
          </button>
        </div>
      </div>
      <div className={`lightbox-view ${zoom ? "zoomed" : ""}`}>
        {current && <img src={asset(fullImageSource(current.src))} alt={current.title} />}
      </div>
      <div className="lightbox-controls">
        <button onClick={() => change(-1)}>
          <ArrowLeft size={18} /> 上一页
        </button>
        <span>← → 切换 · ESC 关闭</span>
        <button onClick={() => change(1)}>
          下一页 <ArrowRight size={18} />
        </button>
      </div>
    </dialog>
  );
}
