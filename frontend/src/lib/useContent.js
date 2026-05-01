import { useEffect, useState, useCallback } from "react";
import { loadContent, subscribeContent, getLang } from "./contentStore";

export const useContent = () => {
  const [content, setContent] = useState(loadContent());
  useEffect(() => subscribeContent(setContent), []);
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
