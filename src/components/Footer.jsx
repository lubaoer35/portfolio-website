import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../content/ContentProvider";
import { BackToTop } from "../animations";
import PdfLink from "./PdfLink";
export default function Footer() {
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
  return (
    <footer id="contact">
      <div className="footer-top">
        <span className="eyebrow">LET’S MAKE SOMETHING / 期待与你交流</span>
        <span className="eyebrow">{profile.graduation} · 求职作品集</span>
      </div>
      <a className="footer-cta" href={`mailto:${profile.email}`}>
        <h2>
          Let’s <em>connect.</em>
        </h2>
        <span>
          <ArrowUpRight />
        </span>
      </a>
      <div className="footer-contact">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <PdfLink>Portfolio PDF</PdfLink>
      </div>
      <BackToTop />
      <div className="footer-bottom">
        <Link to="/">
          {profile.englishName} / {profile.name}
        </Link>
        <p>品牌视觉 · 创意视觉 · 数字媒体艺术</p>
        <span>
          © {new Date().getFullYear()} {profile.englishName}
        </span>
      </div>
    </footer>
  );
}
