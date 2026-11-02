import React from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useContent, EditableText } from "../content/ContentProvider";
import ProjectCard from "../components/ProjectCard";
export default function Work() {
  const { projects, categories, sourceNote } = useContent();
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const filter = categories.some((c) => c.id === params.get("category"))
    ? params.get("category")
    : "All";
  const visible = projects.filter(
    (p) => filter === "All" || p.tags.includes(filter),
  );
  return (
    <section className="page-section works-page">
      <div className="page-kicker">
        <span className="eyebrow">PROJECT INDEX / 作品索引</span>
        <span className="eyebrow">
          {String(projects.length).padStart(2, "0")} SELECTED PROJECTS
        </span>
      </div>
      <h1 className="page-title">
        Visual <em>archive.</em>
        <span>作品集</span>
      </h1>
      <div className="filter-bar">
        <div className="filters" aria-label="作品分类">
          {categories.map((c, i) => (
            <button
              key={c.id}
              aria-pressed={filter === c.id}
              onClick={() =>
                setParams(c.id === "All" ? {} : { category: c.id }, {
                  preventScrollReset: true,
                })
              }
            >
              <EditableText path={`categories.${i}.label`} />
              <sup>
                {c.id === "All"
                  ? projects.length
                  : projects.filter((p) => p.tags.includes(c.id)).length}
              </sup>
            </button>
          ))}
        </div>
        <span className="filter-count" aria-live="polite">
          {String(visible.length).padStart(2, "0")} PROJECTS
        </span>
      </div>
      <motion.div
        key={filter}
        className="project-grid editorial-grid"
        aria-live="polite"
        initial={reduced ? false : { opacity: 0.35, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        {visible.map((p, i) => (
          <ProjectCard project={p} key={p.slug} index={i} />
        ))}
      </motion.div>
      <p className="source-note">{sourceNote}</p>
    </section>
  );
}
