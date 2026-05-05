import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "sonner";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Work from "./pages/Work";
import ProjectDetail from "./pages/ProjectDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/** Actualiza la ruta informada a Speed Insights en cada cambio del cliente (SPA). */
const SpeedInsightsBridge = () => {
  const { pathname } = useLocation();
  return <SpeedInsights framework="react" route={pathname} />;
};

function App() {
  return (
    <div className="App bg-white dark:bg-black text-black dark:text-white antialiased transition-colors duration-500">
      <BrowserRouter>
        <SpeedInsightsBridge />
        <ScrollToTop />
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/work/:category" element={<Work />} />
            <Route path="/project/:slug" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="bottom-right" theme="light" />
      </BrowserRouter>
    </div>
  );
}

export default App;
