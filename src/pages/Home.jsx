import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { useContent, EditableText } from "../content/ContentProvider";
import ProjectCard from "../components/ProjectCard";
import { PortfolioTitle, HeroDecorations, StudioClock } from "../animations";
import DraggableModule from "../editor/DraggableModule";
import Intro from "../components/Intro";
import ProfileSummary from "../sections/ProfileSummary";
export default function Home() {
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
    <>
      <section className="hero" id="home">
        <Intro />
        <HeroDecorations />
        <div className="hero-top">
          <span className="eyebrow">
            A PERSONAL COLLECTION
            <br />
            OF VISUAL EXPLORATIONS
          </span>
          <span className="hero-edition">
            <EditableText path="profile.graduation" />
            <small>GRADUATE PORTFOLIO</small>
            <StudioClock />
          </span>
        </div>
        <PortfolioTitle />
        <DraggableModule id="hero-info" label="首屏信息">
          <div className="hero-bottom">
            <div className="hero-name">
              <strong>
                <EditableText path="profile.name" />
                <span>
                  <EditableText path="profile.englishName" />
                </span>
              </strong>
              <p>2027 / DESIGN PORTFOLIO</p>
            </div>
            <p className="hero-directions">
              VISUAL DESIGNER & DIGITAL MEDIA ARTIST
              <br />
              <span>品牌视觉设计 · 创意视觉设计</span>
            </p>
            <a className="scroll-link" href="#selected">
              Explore the work{" "}
              <span>
                <ArrowDown size={18} />
              </span>
            </a>
          </div>
        </DraggableModule>
        <div className="hero-foot">
          <span>01 / SELECTED WORKS</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>
      <section id="selected" className="work-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">01 / SELECTED PROJECTS</div>
            <h2>
              Selected <em>works.</em>
              <sup>({String(featuredSlugs.length).padStart(2, "0")})</sup>
            </h2>
          </div>
          <p>
            从想法到图像，
            <br />
            探索视觉表达的更多可能。
          </p>
        </div>
        <div className="project-grid editorial-grid exhibition-grid">
          {featuredSlugs.map((slug, index) => (
            <ProjectCard
              key={slug}
              project={projects.find((p) => p.slug === slug)}
              index={index}
            />
          ))}
        </div>
        <div className="work-bottom">
          <span className="eyebrow">
            BRAND / UI / ILLUSTRATION / IP / MOTION
          </span>
          <Link className="text-link" to="/work">
            View all projects · 全部作品 <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
      <ProfileSummary />
    </>
  );
}
