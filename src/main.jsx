import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  Menu,
  X,
  Plus,
  Minus,
  Download,
  Maximize2,
  Asterisk,
} from "lucide-react";
import {
  asset,
  profile,
  projects,
  categories,
  featuredSlugs,
  sourceNote,
} from "./data";
import "./styles.css";

function Navigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    const p = projects.find((p) => location.pathname === `/work/${p.slug}`);
    document.title = `${p?.name || (location.pathname === "/about" ? "About · 关于我" : location.pathname === "/work" ? "Works · 作品" : "Portfolio")} — ${profile.name} LV BAO ER`;
    if (location.hash)
      requestAnimationFrame(() =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: "instant" }),
      );
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  return (
    <header className="header">
      <Link to="/" className="logo" aria-label="吕宝儿 · 首页">
        <span className="logo-symbol" aria-hidden="true">
          lb.
        </span>
        <span>
          LV BAO ER<small>VISUAL DESIGNER</small>
        </span>
      </Link>
      <button
        className="menu-toggle icon-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="main-nav"
        aria-label={open ? "关闭菜单" : "打开菜单"}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="main-nav"
        className={`nav ${open ? "open" : ""}`}
        aria-label="主导航"
      >
        <NavLink to="/" end>
          Home<small>首页</small>
        </NavLink>
        <NavLink to="/work">
          Works<sup>08</sup>
          <small>作品</small>
        </NavLink>
        <NavLink to="/about">
          About<small>关于</small>
        </NavLink>
        <a className="nav-contact" href={`mailto:${profile.email}`}>
          Let’s talk <ArrowUpRight size={16} />
        </a>
      </nav>
    </header>
  );
}
function PdfLink({ children = "下载作品集", className = "" }) {
  return (
    <a
      className={className}
      href={asset("/projects/lv-bao-er-portfolio.pdf")}
      download="吕宝儿-2027届-作品集.pdf"
    >
      {children}
      <Download size={16} />
    </a>
  );
}
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
function ProjectCard({ project: p, index = 0 }) {
  return (
    <Link
      to={`/work/${p.slug}`}
      className={`project-card card-${p.slug}`}
      style={{ "--project-tint": p.tint, "--project-accent": p.accent }}
    >
      <div className="project-image">
        <ProjectImage project={p} priority={index < 2} />
        <span className="project-index">({p.number})</span>
        <div className="project-hover">
          <span>
            {p.name}
            <small>
              {p.tags.join(" / ")} · {p.year || "年份未注明"}
            </small>
          </span>
          <ArrowUpRight />
        </div>
        <span className="project-open" aria-hidden="true">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="project-caption">
        <div>
          <h3>{p.name}</h3>
          <p>{p.chinese}</p>
        </div>
        <span>
          {p.tags[0]}
          <small>{p.year || "—"}</small>
        </span>
      </div>
    </Link>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <span className="eyebrow">
            A PERSONAL COLLECTION
            <br />
            OF VISUAL EXPLORATIONS
          </span>
          <span className="hero-edition">
            2027<small>GRADUATE PORTFOLIO</small>
          </span>
        </div>
        <h1 className="portfolio-title">
          <span className="sr-only">Portfolio — 吕宝儿 LV BAO ER</span>
          <img
            src={asset("/projects/identity/portfolio-lettering.webp")}
            alt=""
            fetchPriority="high"
            width="2134"
            height="737"
          />
        </h1>
        <div className="hero-bottom">
          <div className="hero-name">
            <strong>
              吕宝儿<span>LV BAO ER</span>
            </strong>
            <p>数字媒体艺术 · 本科 · 2027届</p>
          </div>
          <p className="hero-directions">
            BRAND VISUAL / CREATIVE DESIGN
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
        <div className="hero-foot">
          <span>INDEPENDENT PERSPECTIVES. VISUAL POSSIBILITIES.</span>
          <span>SELECTED WORKS ↓</span>
        </div>
      </section>
      <section id="selected" className="work-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">01 / SELECTED PROJECTS</div>
            <h2>
              Selected <em>works.</em>
              <sup>(06)</sup>
            </h2>
          </div>
          <p>
            从想法到图像，
            <br />
            探索视觉表达的更多可能。
          </p>
        </div>
        <div className="project-grid editorial-grid">
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
      <section className="intro-section">
        <div className="eyebrow">02 / BEHIND THE WORK</div>
        <div>
          <h2>
            Different mediums.
            <br />
            <em>One curious mind.</em>
          </h2>
          <div className="intro-copy">
            <p>
              我是吕宝儿，武昌工学院数字媒体艺术专业本科生，2027届。
              <br />
              求职方向：品牌视觉设计 / 创意视觉设计 / 数字媒体艺术设计。
            </p>
            <Link className="text-link" to="/about">
              More about me · 关于我 <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <span className="intro-flower" aria-hidden="true">
          <Asterisk size={75} strokeWidth={1} />
        </span>
      </section>
    </>
  );
}
function Work() {
  const [params, setParams] = useSearchParams();
  const filter = categories.includes(params.get("category"))
    ? params.get("category")
    : "All";
  const visible = projects.filter(
    (p) => filter === "All" || p.tags.includes(filter),
  );
  return (
    <section className="page-section works-page">
      <div className="page-kicker">
        <span className="eyebrow">PROJECT INDEX / 作品索引</span>
        <span className="eyebrow">08 SELECTED PROJECTS</span>
      </div>
      <h1 className="page-title">
        Visual <em>archive.</em>
        <span>作品集</span>
      </h1>
      <div className="filter-bar">
        <div className="filters" aria-label="作品分类">
          {categories.map((c) => (
            <button
              key={c}
              aria-pressed={filter === c}
              onClick={() =>
                setParams(c === "All" ? {} : { category: c }, {
                  preventScrollReset: true,
                })
              }
            >
              {c}
              <sup>
                {c === "All"
                  ? projects.length
                  : projects.filter((p) => p.tags.includes(c)).length}
              </sup>
            </button>
          ))}
        </div>
        <span className="filter-count" aria-live="polite">
          {String(visible.length).padStart(2, "0")} PROJECTS
        </span>
      </div>
      <div className="project-grid editorial-grid" aria-live="polite">
        {visible.map((p, i) => (
          <ProjectCard project={p} key={p.slug} index={i} />
        ))}
      </div>
      <p className="source-note">{sourceNote}</p>
    </section>
  );
}
function Lightbox({ pages, index, setIndex }) {
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
              href={asset(current.src)}
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
        {current && <img src={asset(current.src)} alt={current.title} />}
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
function Detail() {
  const { slug } = useParams();
  const p = projects.find((p) => p.slug === slug);
  const [index, setIndex] = useState(null);
  useEffect(() => setIndex(null), [slug]);
  if (!p) return <NotFound />;
  const next = projects[(projects.indexOf(p) + 1) % projects.length];
  return (
    <article
      className="page-section detail"
      style={{ "--project-accent": p.accent, "--project-tint": p.tint }}
    >
      <div className="detail-breadcrumb">
        <Link to="/work">
          <ArrowLeft size={15} /> ALL WORKS
        </Link>
        <span>PROJECT {p.number} / 08</span>
      </div>
      <div className="detail-heading">
        <div className="eyebrow">
          {p.tags.join(" / ")}
          <span>·</span>
          {p.year || "YEAR NOT SPECIFIED"}
        </div>
        <h1>{p.name}</h1>
        <p>{p.chinese}</p>
      </div>
      <div className="detail-cover">
        <img
          src={asset(p.cover)}
          alt={`${p.name} 主视觉`}
          fetchPriority="high"
        />
      </div>
      <div className="case-intro">
        <div>
          <span className="eyebrow">OVERVIEW / 项目概述</span>
          <h2>{p.summary}</h2>
          <p>{p.intro}</p>
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
          <dt>YEAR / 年份</dt>
          <dd>{p.year || "原稿未注明"}</dd>
        </dl>
      </div>
      <div className="case-text">
        {p.sections.map(([title, text], i) => (
          <section key={title}>
            <span className="eyebrow">0{i + 1}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <div className="gallery-heading">
        <h2>
          The visual <em>story.</em>
        </h2>
        <p>
          完整保留原稿构图与配色
          <br />
          点击图片放大，查看细节
        </p>
      </div>
      <div className="case-gallery">
        {p.pages.map((page, i) => (
          <figure key={page.number}>
            <figcaption>
              <span>
                {String(i + 1).padStart(2, "0")} / {page.title}
              </span>
              <span>PDF P.{String(page.number).padStart(2, "0")}</span>
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
                width="3200"
                height="1800"
              />
              <span className="zoom-label">
                <Maximize2 size={15} /> VIEW FULL SIZE
              </span>
            </button>
          </figure>
        ))}
      </div>
      <div className="detail-source">
        <p>{sourceNote}</p>
        <PdfLink className="text-link">下载完整 PDF</PdfLink>
      </div>
      <Link to={`/work/${next.slug}`} className="next-project">
        <span className="eyebrow">NEXT PROJECT / 下一个项目</span>
        <div>
          <h2>{next.name}</h2>
          <ArrowUpRight />
        </div>
        <p>{next.chinese}</p>
      </Link>
      <Lightbox pages={p.pages} index={index} setIndex={setIndex} />
    </article>
  );
}
function About() {
  return (
    <section className="page-section about-page">
      <div className="page-kicker">
        <span className="eyebrow">ABOUT THE DESIGNER / 关于我</span>
        <span className="eyebrow">2027 GRADUATE</span>
      </div>
      <h1 className="page-title">
        Hello, I’m
        <br />
        <em>LV BAO ER.</em>
        <span>吕宝儿</span>
      </h1>
      <div className="about-grid">
        <div className="portrait-wrap">
          <img
            src={asset("/projects/identity/portrait.webp")}
            alt="吕宝儿的个人照片，摘自作品集第 2 页"
            width="724"
            height="724"
          />
          <span className="eyebrow">LV BAO ER / 吕宝儿</span>
        </div>
        <div className="about-copy">
          <span className="eyebrow">DIGITAL MEDIA ART / 数字媒体艺术</span>
          <h2>
            以视觉表达，
            <br />
            连接创意与想象。
          </h2>
          <p>
            武昌工学院 · 本科
            <br />
            数字媒体艺术专业 · 2027届
          </p>
          <p>
            求职方向
            <br />
            <strong>
              品牌视觉设计 / 创意视觉设计 /<br />
              数字媒体艺术设计
            </strong>
          </p>
          <a className="text-link" href={`mailto:${profile.email}`}>
            {profile.email}
            <ArrowUpRight size={18} />
          </a>
          <PdfLink className="text-link">下载作品集 PDF</PdfLink>
        </div>
      </div>
      <section className="awards-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">RECOGNITION / 获奖情况</span>
            <h2>
              Selected <em>recognition.</em>
            </h2>
          </div>
          <div className="award-total">
            42
            <span>
              项奖项
              <br />
              据作品集原稿
            </span>
          </div>
        </div>
        <div className="awards-list">
          {profile.awards.map(([name, award, rank], i) => (
            <div className="award-row" key={i}>
              <span className="award-n">{String(i + 1).padStart(2, "0")}</span>
              <h3>{name}</h3>
              <span className="award-prize">
                {award}
                <small>{rank}</small>
              </span>
            </div>
          ))}
        </div>
        <p className="source-note">
          以上依据 PDF 第 2
          页逐项保留。原稿列有两条同名“米兰设计周全国三等奖”，未注明对应作品；此处未合并或补写。
        </p>
      </section>
      <section className="skills-section">
        <div>
          <span className="eyebrow">TOOLS & PRACTICE / 擅长软件</span>
          <h2>
            My creative
            <br />
            <em>toolkit.</em>
          </h2>
        </div>
        <ul>
          {profile.skills.map((s, i) => (
            <li key={s}>
              <span>0{i + 1}</span>
              {s}
              <Plus size={18} />
            </li>
          ))}
        </ul>
      </section>
      <div className="original-profile">
        <a
          className="text-link"
          href={asset("/projects/archive/page-02.webp")}
          target="_blank"
          rel="noreferrer"
        >
          查看个人信息原稿 · PDF P.02 <ArrowUpRight size={17} />
        </a>
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer id="contact">
      <div className="footer-top">
        <span className="eyebrow">LET’S MAKE SOMETHING / 期待与你交流</span>
        <span className="eyebrow">2027届 · 求职作品集</span>
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
      <div className="footer-bottom">
        <Link to="/">LV BAO ER / 吕宝儿</Link>
        <p>品牌视觉 · 创意视觉 · 数字媒体艺术</p>
        <span>© {new Date().getFullYear()} LV BAO ER</span>
      </div>
    </footer>
  );
}
function NotFound() {
  return (
    <section className="page-section not-found">
      <span className="eyebrow">404 / PAGE NOT FOUND</span>
      <h1 className="page-title">
        A different
        <br />
        <em>direction.</em>
      </h1>
      <p>这个页面不存在，不如回到作品中继续探索。</p>
      <Link className="text-link" to="/work">
        返回作品页 <ArrowRight size={18} />
      </Link>
    </section>
  );
}
function App() {
  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}
    >
      <a className="skip-link" href="#main">
        跳转到主要内容
      </a>
      <Navigation />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/work/:slug" element={<Detail />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
