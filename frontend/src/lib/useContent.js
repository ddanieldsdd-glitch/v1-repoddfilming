import { useEffect, useState, useCallback } from "react";
import {
  loadContent,
  fetchContent,
  saveContent,
  subscribeContent,
  getLang,
} from "./contentStore";

export const useContent = () => {
  // Instant initial render from localStorage cache (or bundled default)
  const [content, setContent] = useState(loadContent());

  useEffect(() => {
    let mounted = true;

    // Subscribe to local saves first so we pick up any changes immediately
    const unsubscribe = subscribeContent(setContent);

    // Fetch fresh data from MongoDB in the background
    fetchContent()
      .then((serverContent) => {
        if (mounted && serverContent) {
          // saveContent updates cache + triggers setContent via the subscription above
          saveContent(serverContent);
        }
      })
      .catch(() => {
        // Silently fall back to cached/default content on network errors
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return content;
};

export const useLang = () => {
  const [lang, setLangState] = useState(getLang());
  useEffect(() => {
    const handler = (e) => setLangState(e.detail);
    window.addEventListener("ddp-lang-change", handler);
    return () => window.removeEventListener("ddp-lang-change", handler);
  }, []);
  const set = useCallback((l) => {
    import("./contentStore").then((m) => m.setLang(l));
  }, []);
  return [lang, set];
};
