import { useEffect, useState, useCallback } from "react";

const THEME_KEY = "ddp_theme";

const applyTheme = (t) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = t;
};

export const useTheme = () => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem(THEME_KEY) || "dark";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // keyboard shortcut: Shift+D
  useEffect(() => {
    const onKey = (e) => {
      if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setThemeState((t) => (t === "dark" ? "light" : "dark"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  return [theme, toggle];
};

// On module load, apply previously-saved theme ASAP to avoid flash
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved || "dark");
  } catch {}
}
