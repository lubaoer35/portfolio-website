import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { asset } from "../data";
import { useContent, EditableText } from "../content/ContentProvider";
import { useProjectMotion } from "../animations";
const MotionLink = motion.create(Link);
function ProjectImage({ project: p, priority = false }) {
  return (
    <img
      src={asset(p.coverSmall)}
      srcSet={`${asset(p.coverSmall)} 960w, ${asset(p.cover)} 2400w`}
      sizes="(max-width: 700px) 92vw, 48vw"
      alt={`${p.name}：${p.summary}`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
export default function ProjectCard({ project: p, index = 0 }) {
  const { categories, projects, styleFor, isAdmin, editing } = useContent();
  const location = useLocation();
  const itemIndex = projects.findIndex((x) => x.slug === p.slug);
  const ref = useRef(null);
  const { imageY, captionY, reveal } = useProjectMotion(ref, index);
  return (
    <MotionLink
      layout="position"
      ref={ref}
      to={`/work/${p.slug}`}
      state={{ returnTo: location.pathname + location.search }}
      className={`project-card card-${p.slug}`}
      style={{ "--project-tint": p.tint, "--project-accent": p.accent }}
      {...reveal}
    >
      <div
        className="project-image"
        data-edit={
          isAdmin && editing ? `projects.${itemIndex}.cover` : undefined
        }
        style={{
          viewTransitionName: `project-${p.slug}`,
          ...styleFor(`projects.${itemIndex}.cover`),
        }}
      >
        <motion.div className="project-media" style={{ y: imageY }}>
          <ProjectImage project={p} priority={index < 2} />
        </motion.div>
        <span className="project-index">({p.number})</span>
        <div className="project-hover">
          <span>
            {p.name}
            <small>
              {p.tags
                .map((id) => categories.find((c) => c.id === id)?.label || id)
                .join(" / ")}{" "}
              · {p.year || "年份未注明"}
            </small>
          </span>
          <ArrowUpRight />
        </div>
        <span className="project-open" aria-hidden="true">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <motion.div className="project-caption" style={{ y: captionY }}>
        <div>
          <h3>
            <EditableText path={`projects.${itemIndex}.name`} />
          </h3>
          <p>
            <EditableText path={`projects.${itemIndex}.chinese`} />
          </p>
        </div>
        <span>
          {categories.find((c) => c.id === p.tags[0])?.label || p.tags[0]}
          <small>{p.year || "—"}</small>
        </span>
      </motion.div>
    </MotionLink>
  );
}
