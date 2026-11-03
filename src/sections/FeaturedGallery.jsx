import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { asset } from "../data";
import { EditableText, useContent } from "../content/ContentProvider";
import { useProjectMotion } from "../animations";
const categoryNames = {
  "Brand Visual": "品牌视觉",
  UI: "界面设计",
  Illustration: "插画设计",
  IP: "角色与IP设计",
  Motion: "动态视觉",
};
function FeaturedStory({ project: p, index }) {
  const c = useContent();
  const location = useLocation();
  const ref = useRef(null);
  const { imageY, captionY, reveal } = useProjectMotion(ref, index);
  const item = c.projects.findIndex((x) => x.slug === p.slug);
  return (
    <motion.article
      ref={ref}
      className={`featured-story ${index % 2 ? "story-reverse" : ""}`}
      style={{ "--project-tint": p.tint, "--project-accent": p.accent }}
      {...reveal}
    >
      <div className="story-index">
        <span>{String(index + 1).padStart(2, "0")} / 精选项目</span>
        <span>{p.tags.map((id) => categoryNames[id] || id).join(" · ")}</span>
      </div>
      <div className="story-layout">
        <motion.div className="story-description" style={{ y: captionY }}>
          <span className="story-english">
            <EditableText path={`projects.${item}.name`} />
          </span>
          <h3>
            <EditableText path={`projects.${item}.chinese`} />
          </h3>
          <p>
            <EditableText path={`projects.${item}.summary`} />
          </p>
          <span className="story-year">
            {p.year ? `${p.year} / 作品年份` : "设计作品 / DESIGN PROJECT"}
          </span>
          <span className="story-invitation" aria-hidden="true">
            查看项目 <small>VIEW PROJECT</small>
            <ArrowUpRight size={17} />
          </span>
        </motion.div>
        <Link
          to={`/work/${p.slug}`}
          state={{ returnTo: location.pathname + location.search }}
          className={`project-card curated-link card-${p.slug}`}
          aria-label={`查看项目：${p.chinese} / ${p.name}`}
        >
          <div
            className="project-image"
            data-edit={
              c.isAdmin && c.editing ? `projects.${item}.cover` : undefined
            }
            style={{
              viewTransitionName: `project-${p.slug}`,
              ...c.styleFor(`projects.${item}.cover`),
            }}
          >
            <motion.div className="project-media" style={{ y: imageY }}>
              <img
                src={asset(p.coverSmall)}
                srcSet={`${asset(p.coverSmall)} 960w, ${asset(p.cover)} 2400w`}
                sizes="(max-width: 760px) 91vw, 68vw"
                alt={`${p.name} — ${p.chinese}完整作品画面`}
                loading={index < 2 ? "eager" : "lazy"}
                decoding="async"
              />
            </motion.div>
            <span className="curated-view">
              查看作品 <ArrowUpRight size={16} />
            </span>
          </div>
        </Link>
      </div>
    </motion.article>
  );
}
export default function FeaturedGallery() {
  const { projects, featuredSlugs } = useContent();
  return (
    <div className="featured-gallery">
      {featuredSlugs
        .map((slug) => projects.find((p) => p.slug === slug))
        .filter(Boolean)
        .map((p, i) => (
          <FeaturedStory key={p.slug} project={p} index={i} />
        ))}
    </div>
  );
}
