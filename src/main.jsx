import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ContentProvider } from "./content/ContentProvider";
import { MotionExperience } from "./animations";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Work from "./pages/Work";
import Detail from "./pages/Detail";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import "./styles.css";
import "./animations.css";
import "./editorial.css";
const Editor =
  import.meta.env.MODE === "editor" || import.meta.env.MODE === "admin"
    ? lazy(() => import("./editor/EditorPanel"))
    : null;
import { ADMIN_MODE } from "./content/ContentProvider";
const RemoteGate =
  import.meta.env.MODE === "admin"
    ? lazy(() => import("./editor/RemoteGate"))
    : null;
function App() {
  return (
    <ContentProvider>
      <BrowserRouter
        basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}
      >
        <MotionExperience>
          <a className="skip-link" href="#main">
            跳转到主要内容
          </a>
          <Navigation />
          <main id="main" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:slug" element={<Detail />} />
              <Route path="/work/:slug/:section" element={<Detail />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          {ADMIN_MODE && Editor && (
            <Suspense
              fallback={<span className="editor-loading">正在载入编辑台…</span>}
            >
              <Editor />
            </Suspense>
          )}
        </MotionExperience>
      </BrowserRouter>
    </ContentProvider>
  );
}
// Pages may add a directory slash for a physical route. Keep client URLs canonical.
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const appPath = window.location.pathname.slice(basePath.length);
if (appPath.length > 1 && appPath.endsWith("/"))
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname.slice(0, -1) +
      window.location.search +
      window.location.hash,
  );
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {RemoteGate ? (
      <Suspense fallback={<p>正在验证管理员身份…</p>}>
        <RemoteGate>
          <App />
        </RemoteGate>
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
