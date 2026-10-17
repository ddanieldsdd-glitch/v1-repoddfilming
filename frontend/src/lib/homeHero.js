/** "immersive" = 100svh a sangre. "framed" = tarjeta 16:9 con márgenes. */
export const HOME_HERO_LAYOUT = "immersive";

/** 0 = caber entero, 1 = cover total. El hero usa un recorte leve. */
export const HOME_HERO_COVER_AMOUNT = 0.15;

export const isImmersiveHomeHero = () => HOME_HERO_LAYOUT === "immersive";

/**
 * El reel trae bandas negras dentro del 16:9 (imagen scope ~2.39).
 * En vertical el hero recorta hasta que esa imagen llena la pantalla.
 */
export const HOME_HERO_PICTURE_RATIO = 2.39;

const PORTRAIT_QUERY = "(orientation: portrait)";

export const isPortraitViewport = () =>
  typeof window !== "undefined" && window.matchMedia?.(PORTRAIT_QUERY).matches === true;

export const subscribePortrait = (callback) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(PORTRAIT_QUERY);
  const handler = () => callback(mql.matches);
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
};
