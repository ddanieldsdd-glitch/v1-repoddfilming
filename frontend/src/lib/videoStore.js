/**
 * Global video player store
 * Manages all active Vimeo Player instances, global mute state, and provides
 * reliable mute/pause/unmute across all players.
 */

const PLAYERS = new Map(); // key → Vimeo Player instance
const listeners = new Set();

export const HOME_SHOWREEL_KEY = "home-showreel";

let _globalMuted = false;
if (typeof window !== "undefined") {
  try {
    _globalMuted = localStorage.getItem("ddp_global_muted") === "true";
  } catch {}
}

const notify = () => listeners.forEach((fn) => fn(_globalMuted));

export const getGlobalMuted = () => _globalMuted;

export const setGlobalMuted = (val) => {
  _globalMuted = val;
  try {
    localStorage.setItem("ddp_global_muted", val ? "true" : "false");
  } catch {}
  // Apply to all players in real time
  PLAYERS.forEach((player) => {
    try {
      player.setMuted(val).catch(() => {});
    } catch {}
  });
  notify();
};

export const toggleGlobalMuted = () => setGlobalMuted(!_globalMuted);

export const subscribeGlobalMuted = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/* — Player registry — */

export const registerPlayer = (key, player, { forceMuted = false } = {}) => {
  if (PLAYERS.has(key) && PLAYERS.get(key) !== player) {
    // Destroy old player if it was replaced
    try {
      PLAYERS.get(key).destroy().catch(() => {});
    } catch {}
  }
  PLAYERS.set(key, player);
  try {
    player.setMuted(forceMuted || _globalMuted).catch(() => {});
  } catch {}
};

export const unregisterPlayer = (key) => {
  PLAYERS.delete(key);
};

export const getPlayer = (key) => PLAYERS.get(key) || null;

/* — Bulk operations — */

/** Pauses ALL registered players. */
export const pauseAll = () => {
  PLAYERS.forEach((player) => {
    try {
      player.pause().catch(() => {});
    } catch {}
  });
};

/** Mutes ALL registered players. */
export const muteAll = () => {
  PLAYERS.forEach((player) => {
    try {
      player.setMuted(true).catch(() => {});
    } catch {}
  });
};

/** Pauses all players except the one with the given key. */
export const pauseAllExcept = (exceptKey) => {
  PLAYERS.forEach((player, key) => {
    if (key === exceptKey || key === HOME_SHOWREEL_KEY) return;
    try {
      player.pause().catch(() => {});
    } catch {}
  });
};

const kickPlayer = (player) => {
  try {
    player.setMuted?.(true)?.catch?.(() => {});
  } catch {}
  return player.play();
};

/**
 * Resumes playback for a specific player.
 * Useful after pauseAll() to bring one back.
 */
export const resumePlayer = (key, retries = 0) => {
  const player = PLAYERS.get(key);
  if (!player) return;
  try {
    Promise.resolve(kickPlayer(player)).catch(() => {
      if (retries < 12) {
        window.setTimeout(() => resumePlayer(key, retries + 1), 160 + retries * 90);
      }
    });
  } catch {
    if (retries < 12) {
      window.setTimeout(() => resumePlayer(key, retries + 1), 160 + retries * 90);
    }
  }
};

/**
 * Reintenta un vídeo de fondo cuando vuelve a ser visible. No lo pausa al
 * salir del viewport: únicamente recupera la reproducción si el navegador
 * suspendió el iframe durante scroll, cambio de pestaña o bfcache.
 */
export const observePlayerRecovery = (key, element) => {
  if (!element || typeof document === "undefined" || typeof window === "undefined") {
    return () => {};
  }

  let inView = true;
  let watchdog = null;

  const stopWatchdog = () => {
    if (watchdog) {
      window.clearInterval(watchdog);
      watchdog = null;
    }
  };

  const resumeIfVisible = () => {
    if (document.hidden || !inView) return;
    resumePlayer(key);
    const player = PLAYERS.get(key);
    if (player?.getPaused) {
      player
        .getPaused()
        .then((paused) => {
          if (paused && !document.hidden && inView) resumePlayer(key);
        })
        .catch(() => {});
    }
  };

  const startWatchdog = () => {
    if (watchdog) return;
    watchdog = window.setInterval(resumeIfVisible, 1200);
  };

  const onVisibilityChange = () => resumeIfVisible();
  const onPageShow = () => resumeIfVisible();
  const onScroll = () => resumeIfVisible();

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          ([entry]) => {
            inView = Boolean(entry?.isIntersecting);
            if (inView) {
              resumeIfVisible();
              startWatchdog();
            } else {
              stopWatchdog();
            }
          },
          { threshold: [0, 0.01, 0.15], rootMargin: "120px 0px" },
        )
      : null;

  observer?.observe(element);
  startWatchdog();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    stopWatchdog();
    observer?.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("scroll", onScroll);
  };
};

/**
 * Unmutes only a specific player (while respecting global mute).
 * Returns true if successful.
 */
export const unmutePlayer = (key) => {
  const player = PLAYERS.get(key);
  if (player && !_globalMuted) {
    try {
      player.setMuted(false).catch(() => {});
      return true;
    } catch {}
  }
  return false;
};

/**
 * Mutes only a specific player.
 */
export const mutePlayer = (key) => {
  const player = PLAYERS.get(key);
  if (player) {
    try {
      player.setMuted(true).catch(() => {});
    } catch {}
  }
};

/**
 * Pauses all players and returns a function to restore playback
 * for a specific key. Useful for transitions.
 */
export const silenceAllWithRestore = (keepKey) => {
  const prevState = {};
  PLAYERS.forEach((player, key) => {
    try {
      player.getPaused().then((isPaused) => {
        prevState[key] = isPaused;
      }).catch(() => {});
      player.pause().catch(() => {});
    } catch {}
  });
  return () => {
    if (keepKey) {
      const player = PLAYERS.get(keepKey);
      if (player) {
        try {
          player.play().catch(() => {});
        } catch {}
      }
    }
  };
};