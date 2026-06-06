import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getGlobalMuted, toggleGlobalMuted, subscribeGlobalMuted } from "../lib/videoStore";

/**
 * Global sound toggle. Renders a small button showing volume on/off.
 * Place in the navigation bar.
 *
 * Props:
 *   - className: additional classes
 *   - txt: text color class for the icon
 *   - inactive: text color class for inactive state
 */
export const SoundControl = ({ className = "", txt = "text-black", inactive = "text-neutral-500" }) => {
  const [muted, setMuted] = useState(getGlobalMuted());

  useEffect(() => subscribeGlobalMuted(setMuted), []);

  // Shift+M keyboard shortcut
  useEffect(() => {
    const onKey = (e) => {
      if (e.shiftKey && (e.key === "M" || e.key === "m")) {
        e.preventDefault();
        toggleGlobalMuted();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <button
      data-testid="sound-toggle"
      onClick={toggleGlobalMuted}
      aria-label={muted ? "Unmute" : "Mute"}
      title={muted ? "Unmute (Shift+M)" : "Mute (Shift+M)"}
      className={`p-1.5 transition-colors duration-500 ${muted ? inactive : txt} hover:${txt} ${className}`}
    >
      {muted ? (
        <VolumeX className="w-[14px] h-[14px]" strokeWidth={1.5} />
      ) : (
        <Volume2 className="w-[14px] h-[14px]" strokeWidth={1.5} />
      )}
    </button>
  );
};
