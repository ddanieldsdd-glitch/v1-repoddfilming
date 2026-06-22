export const extractVimeoId = (url) => {
  const m = String(url || "").match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

/** Poster estático del showreel (mejora LCP antes de cargar el iframe) */
export const getVimeoPosterUrl = (url) => {
  const id = extractVimeoId(url);
  if (!id) return null;
  return `https://vumbnail.com/${id}.jpg`;
};
