import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowUpRight, ArrowLeft, Maximize2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { asset } from "../data";
import { useContent, EditableText } from "../content/ContentProvider";
import PdfLink from "../components/PdfLink";
import Lightbox from "../components/Lightbox";
import NotFound from "./NotFound";
export default function Detail() {
  const {
    profile,
    projects,
    categories,
    featuredSlugs,
    sourceNote,
    styleFor,
    isAdmin,
    editing,
  } = useContent();
  const reduced = useReducedMotion();
  const { slug, section } = useParams();
  const location = useLocation();
  const original = projects.find((p) => p.slug === slug);
  const chapterIds = [
    "illustration-posters",
    "commerce",
    "motion-3d",
    "aigc-film",
  ];
  const chapterNames = [
    "Illustration Posters",
    "Commerce & Display",
    "3D & Motion",
    "AIGC Film",
  ];
  const chapter = section ? chapterIds.indexOf(section) : -1;
  const p =
    original &&
    section &&
    original.slug === "other-works" &&
    chapter >= 0 &&
    original.pages[chapter]
      ? {
          ...original,
          name: chapterNames[chapter],
          chinese: original.pages[chapter].title,
          cover: original.pages[chapter].src,
          pages: [original.pages[chapter]],
          pageRange: String(original.pages[chapter].number),
        }
      : section
        ? null
        : original;
  const projectIndex = projects.findIndex((x) => x.slug === slug);
  const returnTo = location.state?.returnTo || "/work";
  const [index, setIndex] = useState(null);
  useEffect(() => setIndex(null), [slug, section]);
  if (!p) return <NotFound />;
  const next = projects[(projectIndex + 1) % projects.length];
  const previous =
    projects[(projectIndex - 1 + projects.length) % projects.length];
  return (
    <article
      className="page-section detail"
      style={{ "--project-accent": p.accent, "--project-tint": p.tint }}
    >
      <div className="detail-breadcrumb">
        <Link to={returnTo} data-restore-scroll="true">
          <ArrowLeft size={15} /> ALL WORKS
        </Link>
        <span>
          PROJECT {p.number} / {String(projects.length).padStart(2, "0")}
        </span>
      </div>
      <div className="detail-heading">
        <div className="eyebrow">
          {p.tags
            .map((id) => categories.find((c) => c.id === id)?.label || id)
            .join(" / ")}
          <span>·</span>
          {p.year || "YEAR NOT SPECIFIED"}
        </div>
        <h1>
          {section ? (
            p.name
          ) : (
            <EditableText path={`projects.${projectIndex}.name`} />
          )}
        </h1>
        <p>
          {section ? (
            p.chinese
          ) : (
            <EditableText path={`projects.${projectIndex}.chinese`} />
          )}
        </p>
      </div>
      <div
        className="detail-cover"
        style={{ viewTransitionName: `project-${p.slug}` }}
      >
        <img
          src={asset(p.cover)}
          alt={`${p.name} 主视觉`}
          fetchPriority="high"
        />
      </div>
      <div className="case-intro">
        <div>
          <span className="eyebrow">OVERVIEW / 项目概述</span>
          <h2>
            <EditableText path={`projects.${projectIndex}.summary`} />
          </h2>
          <EditableText path={`projects.${projectIndex}.intro`} as="p" />
        </div>
        <dl>
          <dt>DISCIPLINES / 设计内容</dt>
          <dd>{p.services.join(" / ")}</dd>
          <dt>SOURCE / 原稿来源</dt>
          <dd>
            作品集 PDF · P.{p.pageRange}
            <br />
            {p.pages.length} 页完整设计展示
          </dd>
          <dt>ROLE / 项目角色</dt>
          <dd>原稿未单独注明合作分工</dd>
          <dt>YEAR / 年份</dt>
          <dd>{p.year || "原稿未注明"}</dd>
        </dl>
      </div>
      <div className="case-text">
        {p.sections.map(([title, text], i) => (
          <section key={title}>
            <span className="eyebrow">0{i + 1}</span>
            <h2>
              <EditableText path={`projects.${projectIndex}.sections.${i}.0`} />
            </h2>
            <EditableText
              path={`projects.${projectIndex}.sections.${i}.1`}
              as="p"
            />
          </section>
        ))}
      </div>
      {slug === "other-works" && !section && (
        <nav className="other-index" aria-label="其他作品独立详情">
          {p.pages.slice(0, 4).map((page, i) => (
            <Link to={`/work/other-works/${chapterIds[i]}`} key={page.src}>
              <img src={asset(page.small)} alt={page.title} loading="lazy" />
              <span>
                {chapterNames[i]}
                <small>{page.title}</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </nav>
      )}
      <div className="gallery-heading">
        <h2>
          The visual <em>story.</em>
          <span className="heading-cn">视觉呈现</span>
        </h2>
        <p>
          完整保留原稿构图与配色
          <br />
          点击图片放大，查看细节
        </p>
      </div>
      <div className="case-gallery">
        {p.pages.map((page, i) => (
          <motion.figure
            key={page.src + "-" + i}
            initial={reduced ? false : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{
              duration: reduced ? 0 : 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <figcaption>
              <span>
                {String(i + 1).padStart(2, "0")} / {page.title}
              </span>
              <span>
                {page.number
                  ? `PDF P.${String(page.number).padStart(2, "0")}`
                  : "新增作品图片"}
              </span>
            </figcaption>
            <button
              className="gallery-image"
              onClick={() => setIndex(i)}
              aria-label={`放大：${page.title}`}
            >
              <img
                src={asset(page.small)}
                srcSet={`${asset(page.small)} 960w, ${asset(page.src)} 3200w`}
                sizes="(max-width: 700px) 94vw, 90vw"
                alt={`${p.name} — ${page.title}，原稿第 ${page.number} 页`}
                loading="lazy"
                decoding="async"
                width={page.number ? 3200 : undefined}
                height={page.number ? 1800 : undefined}
              />
              <span className="zoom-label">
                <Maximize2 size={15} /> VIEW FULL SIZE
              </span>
            </button>
          </motion.figure>
        ))}
      </div>
      <section className="case-recap">
        <span className="eyebrow">PROJECT RECAP / 项目回顾</span>
        <h2>{p.chinese}</h2>
        <p>{p.summary}</p>
        <ul>
          {p.services.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <div className="detail-source">
        <p>{sourceNote}</p>
        <PdfLink className="text-link">下载完整 PDF</PdfLink>
      </div>
      <div className="adjacent-projects">
        <Link className="previous-project" to={`/work/${previous.slug}`}>
          <span className="eyebrow">PREVIOUS PROJECT / 上一个项目</span>
          <h2>
            <ArrowLeft size={25} />
            {previous.name}
          </h2>
          <p>{previous.chinese}</p>
        </Link>
        <Link to={`/work/${next.slug}`} className="next-project">
          <span className="eyebrow">NEXT PROJECT / 下一个项目</span>
          <div>
            <h2>{next.name}</h2>
            <ArrowUpRight />
          </div>
          <p>{next.chinese}</p>
        </Link>
      </div>
      <Lightbox pages={p.pages} index={index} setIndex={setIndex} />
    </article>
  );
}
