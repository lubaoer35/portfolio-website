import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  animate,
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useInView,
} from "motion/react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { asset } from "./data";
import { useContent } from "./content/ContentProvider";

const MotionPreferences = createContext({
  reduced: false,
  fine: false,
  parallax: false,
});
const ease = [0.22, 1, 0.36, 1];

export function MotionExperience({ children }) {
  const reduced = !!useReducedMotion();
  const [device, setDevice] = useState({ fine: false, wide: false });
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const wide = matchMedia("(min-width: 768px)");
    const update = () => setDevice({ fine: fine.matches, wide: wide.matches });
    update();
    fine.addEventListener("change", update);
    wide.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      wide.removeEventListener("change", update);
    };
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <MotionPreferences.Provider
        value={{
          reduced,
          fine: device.fine,
          parallax: device.fine && device.wide && !reduced,
        }}
      >
        <RouteTransitions>{children}</RouteTransitions>
        <CreativeCursor />
        <ReadingProgress />
      </MotionPreferences.Provider>
    </MotionConfig>
  );
}

export function PortfolioTitle() {
  const { reduced } = useContext(MotionPreferences);
  const { hero, profile } = useContent();
  const [ready, setReady] = useState(false),
    [assembled, setAssembled] = useState(false);
  const image = useRef(null);
  useEffect(() => {
    setAssembled(false);
    setReady(!!image.current?.complete);
  }, [hero.image]);
  const edges = [0, 21, 32, 41, 50, 59, 69, 77, 86, 100];
  return (
    <h1 className="portfolio-title">
      <span className="sr-only">
        Portfolio — {profile.name} {profile.englishName}
      </span>
      <motion.img
        ref={image}
        src={asset(hero.image)}
        alt=""
        fetchPriority="high"
        width="2134"
        height="737"
        onLoad={() => setReady(true)}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: reduced || assembled ? 1 : 0 }}
        transition={{ duration: 0 }}
      />
      {ready &&
        !assembled &&
        !reduced &&
        edges.slice(0, -1).map((left, i) => (
          <motion.div
            className="lettering-slice"
            key={i}
            style={{ clipPath: `inset(0 ${100 - edges[i + 1]}% 0 ${left}%)` }}
            initial={{
              opacity: 0,
              x: i % 2 ? 7 : -7,
              y: 24,
              rotate: i % 2 ? 0.35 : -0.35,
            }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 1.05, delay: i * 0.075, ease }}
            onAnimationComplete={() => {
              if (i === 8) setAssembled(true);
            }}
          >
            <img
              src={asset(hero.image)}
              alt=""
              aria-hidden="true"
              width="2134"
              height="737"
            />
          </motion.div>
        ))}
    </h1>
  );
}
export function StudioClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Shanghai",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="studio-clock">CST / {time}</span>;
}
export function HeroDecorations() {
  const ref = useRef(null);
  const active = useInView(ref);
  const { reduced } = useContext(MotionPreferences);
  return (
    <div
      ref={ref}
      className={`hero-decorations ${active && !reduced ? "is-active" : ""}`}
      aria-hidden="true"
    >
      <div className="paper-grain" />
      <svg viewBox="0 0 1200 500" preserveAspectRatio="none">
        <motion.path
          d="M 65 440 C 350 510, 855 420, 1135 335"
          fill="none"
          stroke="currentColor"
          strokeWidth=".6"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{
            duration: reduced ? 0 : 2,
            delay: reduced ? 0 : 0.35,
            ease,
          }}
        />
        <path
          className="hero-star star-one"
          d="M 80 390 l 3 12 12 3 -12 3 -3 12 -3 -12 -12 -3 12 -3 Z"
        />
        <path
          className="hero-star star-two"
          d="M 1125 70 l 3 14 14 3 -14 3 -3 14 -3 -14 -14 -3 14 -3 Z"
        />
      </svg>
    </div>
  );
}

export function useProjectMotion(ref, index) {
  const { reduced, parallax } = useContext(MotionPreferences);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    parallax ? [12, -12] : [0, 0],
  );
  const captionY = useTransform(
    scrollYProgress,
    [0, 1],
    parallax ? [-7, 7] : [0, 0],
  );
  return {
    imageY,
    captionY,
    reveal: {
      initial: reduced ? false : { opacity: 0, x: index % 2 ? 18 : -18, y: 32 },
      whileInView: { opacity: 1, x: 0, y: 0 },
      viewport: { once: true, amount: 0.12, margin: "0px 0px -18px 0px" },
      transition: {
        duration: reduced ? 0 : 0.8,
        delay: reduced ? 0 : (index % 2) * 0.07,
        ease,
      },
    },
  };
}

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="reading-progress"
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
function CreativeCursor() {
  const { fine, reduced } = useContext(MotionPreferences);
  const { pathname } = useLocation();
  const [state, setState] = useState({ visible: false, project: false });
  const rawX = useMotionValue(-100),
    rawY = useMotionValue(-100);
  const x = useSpring(rawX, { stiffness: 650, damping: 42, mass: 0.35 });
  const y = useSpring(rawY, { stiffness: 650, damping: 42, mass: 0.35 });
  useEffect(() => {
    if (!fine || reduced) return;
    let shown = false;
    const hide = () => {
      shown = false;
      document.documentElement.classList.remove("has-custom-cursor");
      setState({ visible: false, project: false });
    };
    const move = (e) => {
      if (
        e.pointerType !== "mouse" ||
        e.target.closest("dialog[open]") ||
        document.documentElement.dataset.navigation === "busy"
      ) {
        hide();
        return;
      }
      if (!shown) {
        x.jump(e.clientX);
        y.jump(e.clientY);
        shown = true;
        document.documentElement.classList.add("has-custom-cursor");
      }
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      const project = !!e.target.closest(".project-image");
      setState((s) =>
        s.visible && s.project === project ? s : { visible: true, project },
      );
    };
    const key = (e) => {
      if (e.key === "Tab") hide();
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("mouseleave", hide);
    document.addEventListener("keydown", key);
    window.addEventListener("blur", hide);
    return () => {
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("mouseleave", hide);
      document.removeEventListener("keydown", key);
      window.removeEventListener("blur", hide);
    };
  }, [fine, reduced, pathname, rawX, rawY, x, y]);
  if (!fine || reduced) return null;
  return (
    <motion.div
      className="custom-cursor"
      style={{ x, y }}
      aria-hidden="true"
      data-mode={state.project ? "project" : "dot"}
    >
      <motion.div
        className="cursor-circle"
        animate={{
          width: state.project ? 94 : 7,
          height: state.project ? 94 : 7,
          opacity: state.visible ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease }}
      >
        <motion.span
          animate={{ opacity: state.project ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          View
          <br />
          Project <ArrowUpRight size={11} />
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

function isPlainClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
function decodeImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () =>
      image
        .decode()
        .catch(() => {})
        .finally(resolve);
    image.onerror = resolve;
    image.src = src;
    setTimeout(resolve, 450);
  });
}

function RouteTransitions({ children }) {
  const { projects } = useContent();
  const navigate = useNavigate();
  const location = useLocation();
  const { reduced } = useContext(MotionPreferences);
  const veil = useRef(null),
    current = useRef(null),
    sequence = useRef(0);
  const fallbackAnimation = useRef(null);
  const mounted = useRef(true);
  const pendingCommit = useRef(null);
  useLayoutEffect(() => {
    if (pendingCommit.current?.path === location.pathname) {
      pendingCommit.current.resolve();
      pendingCommit.current = null;
    }
  }, [location.pathname]);
  const [flight, setFlight] = useState(null);
  useEffect(() => {
    mounted.current = true;
    const cancel = () => {
      sequence.current++;
      current.current?.skipTransition();
      fallbackAnimation.current?.stop();
      pendingCommit.current?.resolve();
      pendingCommit.current = null;
      if (veil.current) veil.current.style.transform = "scaleY(0)";
      delete document.documentElement.dataset.navigation;
      if (mounted.current) setFlight(null);
    };
    window.addEventListener("popstate", cancel);
    return () => {
      mounted.current = false;
      cancel();
      window.removeEventListener("popstate", cancel);
    };
  }, []);
  useEffect(() => {
    if (reduced) current.current?.skipTransition();
  }, [reduced]);
  const finish = (token) => {
    if (token !== sequence.current || !mounted.current) return;
    delete document.documentElement.dataset.navigation;
    setFlight(null);
    const main = document.getElementById("main");
    main?.focus({ preventScroll: true });
  };
  const follow = async (e) => {
    if (e.defaultPrevented || !isPlainClick(e)) return;
    const link = e.target.closest("a[href]");
    if (
      !link ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self") ||
      link.getAttribute("href").startsWith("#")
    )
      return;
    const url = new URL(link.href);
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    if (
      url.origin !== window.location.origin ||
      (base && !url.pathname.startsWith(base + "/"))
    )
      return;
    const path = url.pathname.slice(base.length) || "/";
    if (path === location.pathname) return;
    e.preventDefault();
    const token = ++sequence.current;
    current.current?.skipTransition();
    fallbackAnimation.current?.stop();
    if (veil.current) veil.current.style.transform = "scaleY(0)";
    setFlight(null);
    const project = projects.find((p) => path === `/work/${p.slug}`);
    const source = link.querySelector(".project-image");
    const rect = source?.getBoundingClientRect();
    // Only one destination image is warmed; a slow image must not block navigation.
    if (project && !reduced) await decodeImage(asset(project.cover));
    if (token !== sequence.current || !mounted.current) return;
    const to = path + url.search + url.hash;
    const update = () => {
      if (token !== sequence.current || !mounted.current)
        return Promise.resolve();
      return new Promise((resolve) => {
        // BrowserRouter schedules navigation in a React transition. Await its DOM
        // commit before measuring the destination or capturing the new snapshot.
        pendingCommit.current?.resolve();
        pendingCommit.current = { path, resolve };
        const state = link.dataset.restoreScroll
          ? { restoreScroll: true }
          : link.closest(".project-card")
            ? { returnTo: location.pathname + location.search }
            : undefined;
        navigate(to, { state });
      });
    };
    if (reduced) {
      await update();
      finish(token);
      return;
    }
    document.documentElement.dataset.navigation = "busy";
    if (document.startViewTransition) {
      const transition = document.startViewTransition(update);
      current.current = transition;
      transition.finished.catch(() => {}).finally(() => finish(token));
    } else {
      // Progressive fallback: a short veil and a single, contain-fitted shared image.
      const cover = animate(
        veil.current,
        { scaleY: 1 },
        { duration: 0.2, ease },
      );
      fallbackAnimation.current = cover;
      await cover.finished;
      if (token !== sequence.current || !mounted.current) return;
      await update();
      if (token !== sequence.current || !mounted.current) return;
      const target = document.querySelector(".detail-cover");
      if (rect && target && project) {
        const toRect = target.getBoundingClientRect();
        setFlight({
          token,
          project,
          from: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
          to: {
            left: toRect.left,
            top: toRect.top,
            width: toRect.width,
            height: toRect.height,
          },
        });
      }
      const uncover = animate(
        veil.current,
        { scaleY: 0 },
        { duration: 0.55, ease, delay: 0.05 },
      );
      fallbackAnimation.current = uncover;
      await uncover.finished;
      finish(token);
    }
  };
  return (
    <div onClickCapture={follow} className="motion-experience">
      {children}
      <div ref={veil} className="route-veil" aria-hidden="true">
        <span>
          LV BAO ER <small>VISUAL PORTFOLIO</small>
        </span>
      </div>
      {flight && (
        <motion.div
          className="shared-flight"
          aria-hidden="true"
          initial={{ ...flight.from, opacity: 1 }}
          animate={{ ...flight.to, opacity: [1, 1, 0] }}
          transition={{ duration: 0.58, ease }}
          style={{ background: flight.project.tint }}
        >
          <img src={asset(flight.project.cover)} alt="" />
        </motion.div>
      )}
    </div>
  );
}

export function BackToTop() {
  const { reduced } = useContext(MotionPreferences);
  const { scrollYProgress } = useScroll();
  return (
    <div className="back-top-row">
      <span className="eyebrow">END OF THE PAGE / MORE TO EXPLORE ABOVE</span>
      <motion.button
        className="back-to-top"
        aria-label="返回顶部"
        whileHover={reduced ? undefined : { y: -3 }}
        whileTap={reduced ? undefined : { scale: 0.97 }}
        onClick={() =>
          window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" })
        }
      >
        <span>
          Back to Top <small>返回顶部</small>
        </span>
        <span className="back-top-icon">
          <svg
            className="scroll-progress"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="22" />
            <motion.circle
              cx="24"
              cy="24"
              r="22"
              style={{ pathLength: scrollYProgress }}
            />
          </svg>
          <ArrowUp size={19} />
        </span>
      </motion.button>
    </div>
  );
}
