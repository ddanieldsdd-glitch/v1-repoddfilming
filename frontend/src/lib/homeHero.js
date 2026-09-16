/** "immersive" = 100svh a sangre. "framed" = tarjeta 16:9 con márgenes. */
export const HOME_HERO_LAYOUT = "immersive";

/** 0 = caber entero, 1 = cover total. El hero usa un recorte leve. */
export const HOME_HERO_COVER_AMOUNT = 0.15;

export const isImmersiveHomeHero = () => HOME_HERO_LAYOUT === "immersive";
