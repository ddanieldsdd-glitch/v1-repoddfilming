import { useEffect, useRef, useState } from "react";

export const isVersionConflict = (err) =>
  err?.name === "ContentConflictError" || err?.code === "VERSION_CONFLICT";

export const useSectionDraft = ({ initial, onSave, debounceMs = 1800, enabled = true }) => {
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState("idle");
  const lastSaved = useRef(JSON.stringify(initial));
  const timer = useRef(null);
  const paused = useRef(false);

  useEffect(() => {
    setDraft(initial);
    lastSaved.current = JSON.stringify(initial);
  }, [initial]);

  const isDirty = JSON.stringify(draft) !== lastSaved.current;

  useEffect(() => {
    if (!enabled || paused.current || !isDirty) return undefined;
    setStatus("dirty");
    timer.current = window.setTimeout(async () => {
      setStatus("saving");
      try {
        await onSave(draft);
        lastSaved.current = JSON.stringify(draft);
        setStatus("saved");
      } catch (err) {
        if (isVersionConflict(err)) {
          paused.current = true;
          setStatus("conflict");
        } else {
          setStatus("error");
        }
      }
    }, debounceMs);
    return () => window.clearTimeout(timer.current);
  }, [draft, debounceMs, enabled, isDirty, onSave]);

  return {
    draft,
    setDraft,
    isDirty,
    status,
    markClean: (next = draft) => {
      lastSaved.current = JSON.stringify(next);
      paused.current = false;
      setStatus("saved");
    },
    resume: () => {
      paused.current = false;
      setStatus("idle");
    },
  };
};
