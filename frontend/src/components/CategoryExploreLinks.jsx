import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getActiveCategories } from "../lib/contentStore";
import { optimizeCloudinaryUrl } from "../lib/cloudinary";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

/**
 * Carteles horizontales por categoría (como «Explorar otras ramas» en la ficha).
 */
export function CategoryExploreLinks({
  projects = [],
  lang,
  excludeCategoryId = null,
  className = "",
}) {
  const categories = getActiveCategories(projects).filter(
    (c) => c.id !== excludeCategoryId,
  );

  if (!categories.length) return null;

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 ${className}`}
    >
      {categories.map((c) => {
        const preview = projects.find(
          (p) => p.category === c.id && p.published !== false,
        );
        const raw = preview?.poster || preview?.cover;
        const thumb =
          raw && !isVideoUrl(raw)
            ? optimizeCloudinaryUrl(raw, { width: 640, quality: "good" })
            : null;
        return (
          <Link
            key={c.id}
            to={`/work/${c.id}`}
            data-testid={`category-explore-${c.id}`}
            className="group relative overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-white/10 hover:ring-white/25 transition-all duration-500 p-5 flex flex-col justify-end min-h-[100px] sm:min-h-[120px]"
          >
            {thumb && (
              <img
                src={thumb}
                alt=""
                className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500 scale-[1.04] group-hover:scale-100"
              />
            )}
            <div className="relative z-10">
              <span className="text-lg sm:text-xl font-light tracking-tight text-white">
                {c[lang]}
              </span>
            </div>
            <ArrowRight
              className="absolute right-4 bottom-4 h-4 w-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all"
              strokeWidth={1.5}
            />
          </Link>
        );
      })}
    </div>
  );
}
