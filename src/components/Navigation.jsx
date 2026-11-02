import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { ArrowDown, Menu, X } from "lucide-react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useContent, EditableText } from "../content/ContentProvider";
import { rememberScroll, savedScroll } from "./scrollPositions";
export default function Navigation() {
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
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigationType = useNavigationType();
  const reduced = useReducedMotion();
  const previous = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) =>
    setScrolled((v) => (y > 24 === v ? v : y > 24)),
  );
  useLayoutEffect(() => {
    setOpen(false);
    const p = projects.find((p) => location.pathname === `/work/${p.slug}`);
    document.title = `${p?.name || (location.pathname === "/about" ? "About · 关于我" : location.pathname === "/work" ? "Works · 作品" : "Portfolio")} — ${profile.name} LV BAO ER`;
    const key = location.pathname + location.search;
    const samePage = previous.current === location.pathname;
    if (location.hash)
      requestAnimationFrame(() =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" }),
      );
    else if (navigationType === "POP" || location.state?.restoreScroll)
      window.scrollTo({ top: savedScroll(key), behavior: "instant" });
    else if (!samePage) window.scrollTo({ top: 0, behavior: "instant" });
    previous.current = location.pathname;
    return () => rememberScroll(key);
  }, [location.key]);
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  return (
    <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
      <Link to="/" className="logo" aria-label="吕宝儿 · 首页">
        <span className="logo-symbol" aria-hidden="true">
          lb.
        </span>
        <span>
          <EditableText path="profile.englishName" />
          <small>DESIGN PORTFOLIO</small>
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
      <motion.nav
        initial={false}
        animate={{ opacity: 1, y: open ? [-6, 0] : 0 }}
        transition={{ duration: 0.25 }}
        id="main-nav"
        className={`nav ${open ? "open" : ""}`}
        aria-label="主导航"
      >
        <NavLink to="/" end>
          Home<small>首页</small>
        </NavLink>
        <NavLink to="/work">
          Work<sup>{String(projects.length).padStart(2, "0")}</sup>
          <small>作品</small>
        </NavLink>
        <NavLink to="/about">
          About<small>关于</small>
        </NavLink>
        <a
          className="nav-contact"
          href="#contact"
          onClick={() => setOpen(false)}
        >
          Contact <ArrowDown size={14} />
        </a>
      </motion.nav>
      <span className="nav-availability">
        2027 /<br /> AVAILABLE FOR OPPORTUNITIES
      </span>
    </header>
  );
}
