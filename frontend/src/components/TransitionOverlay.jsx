import { useEffect, useState, useRef } from "react";

/**
 * Cinematic transition overlay.
 * Triggers a fade-out → wait → fade-in sequence.
 *
 * Props:
 *   - trigger: any value that changes to begin the transition
 *   - duration: fade duration in ms (default 400)
 *   - wait: middle wait in ms (default 300)
 *   - className: additional classes
 *   - onComplete: called when the full transition is done
 */
export const TransitionOverlay = ({
  trigger,
  duration = 400,
  wait = 300,
  className = "",
  onComplete,
}) => {
  const [phase, setPhase] = useState("idle"); // idle → fadingOut → hidden → fadingIn → idle
  const prevTrigger = useRef(trigger);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    if (phase !== "idle") return; // already transitioning

    const run = async () => {
      if (!mountedRef.current) return;
      setPhase("fadingOut");
      await new Promise((r) => setTimeout(r, duration));
      if (!mountedRef.current) return;
      setPhase("hidden");
      await new Promise((r) => setTimeout(r, wait));
      if (!mountedRef.current) return;
      setPhase("fadingIn");
      await new Promise((r) => setTimeout(r, duration));
      if (!mountedRef.current) return;
      setPhase("idle");
      onComplete?.();
    };
    run();
  }, [trigger, duration, wait, onComplete, phase]);

  const isVisible = phase !== "idle";

  if (!isVisible) return null;

  let opacity = 0;
  if (phase === "fadingOut") opacity = 1;
  else if (phase === "hidden") opacity = 1;
  else if (phase === "fadingIn") opacity = 0;

  const pointerEvents = phase === "idle" ? "none" : "auto";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-${pointerEvents} fixed inset-0 z-[9998] bg-black transition-opacity ease-out ${className}`}
      style={{
        opacity,
        transitionDuration: `${duration}ms`,
      }}
    />
  );
};