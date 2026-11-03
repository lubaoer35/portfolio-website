import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { useContent, EditableText } from "../content/ContentProvider";
import FeaturedGallery from "../sections/FeaturedGallery";
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
            OF VISUAL EXPLORATIONS · 视觉创作集
          </span>
          <span className="hero-edition">
            <EditableText path="profile.graduation" />
            <small>GRADUATE PORTFOLIO / 毕业作品集</small>
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
              Explore the work · 浏览作品{" "}
              <span>
                <ArrowDown size={18} />
              </span>
            </a>
          </div>
        </DraggableModule>
        <div className="hero-foot">
          <span>01 / SELECTED WORKS · 精选作品</span>
          <span>SCROLL TO EXPLORE · 向下探索 ↓</span>
        </div>
      </section>
      <section id="selected" className="work-section">
        <header className="selected-heading">
          <div className="selected-title-line">
            <span className="selected-section-no">01</span>
            <h2>
              Selected works <span>精选作品</span>
            </h2>
            <span className="selected-count">
              {String(featuredSlugs.length).padStart(2, "0")}{" "}
              <small>PROJECTS / 个项目</small>
            </span>
          </div>
          <p>从视觉概念到完整表达，以不同媒介呈现创意的更多可能。</p>
        </header>
        <FeaturedGallery />
        <div className="work-bottom">
          <span className="eyebrow">
            BRAND / UI / ILLUSTRATION / IP / MOTION · 品牌 / 界面 / 插画 / IP /
            动效
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
