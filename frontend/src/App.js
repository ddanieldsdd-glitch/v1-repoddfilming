import { useEffect, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "sonner";
import { useTheme } from "./lib/useTheme";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { SeoHead } from "./components/SeoHead";
import Home from "./pages/Home";

const Work = lazy(() => import("./pages/Work"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const About = lazy(() => import("./pages/About"));
const Showreel = lazy(() => import("./pages/Showreel"));
const Contact = lazy(() => import("./pages/Contact"));
const Admin = lazy(() => import("./pages/Admin"));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // No hacer scroll cuando se cambia de filtro dentro de /work
    const rootSection = (p) => p.split("/")[1];
    const prev = ScrollToTop._prev || "";
    const sameSection =
      rootSection(prev) === rootSection(pathname) && rootSection(pathname) === "work";
    ScrollToTop._prev = pathname;
    if (!sameSection) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/** Actualiza la ruta informada a Speed Insights en cada cambio del cliente (SPA). */
const SpeedInsightsBridge = () => {
  const { pathname } = useLocation();
  return <SpeedInsights framework="react" route={pathname} />;
};

/**
 * Envía un evento page_view a GA4 en cada cambio de ruta.
 * Sin esto, una SPA solo registra la visita inicial (/) y Google Analytics
 * no ve las visitas a /project/:slug, /about, /contact, etc.
 */
const GA4Tracker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);
  return null;
};

function App() {
  const [theme] = useTheme();

  return (
    <div className="App relative bg-white dark:bg-black text-black dark:text-white antialiased transition-colors duration-500">
      <div className="film-grain-overlay pointer-events-none fixed inset-0 z-[100] mix-blend-overlay opacity-[0.035] dark:mix-blend-soft-light dark:opacity-[0.075]" aria-hidden />
      <BrowserRouter>
        <SpeedInsightsBridge />
        <GA4Tracker />
        <SeoHead />
        <ScrollToTop />
        <Nav />
        <main>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:category" element={<Work />} />
              <Route path="/project/:slug" element={<ProjectDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/showreel" element={<Showreel />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Toaster position="bottom-right" theme={theme === "dark" ? "dark" : "light"} />
        <Analytics />
      </BrowserRouter>
    </div>
  );
}

export default App;
