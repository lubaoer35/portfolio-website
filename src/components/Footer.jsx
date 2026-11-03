import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../content/ContentProvider";
import { BackToTop, HeroDecorations } from "../animations";
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
      <HeroDecorations />
      <div className="footer-top">
        <span className="eyebrow">THANK YOU FOR WATCHING / 感谢观看</span>
        <span className="eyebrow">{profile.graduation} · 求职作品集</span>
      </div>
      <a className="footer-cta" href={`mailto:${profile.email}`}>
        <h2>
          LET’S CREATE
          <br />
          <em>SOMETHING NEW.</em>
        </h2>
        <span>
          <ArrowUpRight />
        </span>
      </a>
      <p className="ending-signature">{profile.englishName} / 2027</p>
      <div className="footer-contact">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <PdfLink>Portfolio PDF</PdfLink>
        <a className="ending-contact" href={`mailto:${profile.email}`}>
          CONTACT ME <ArrowUpRight size={15} />
        </a>
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
