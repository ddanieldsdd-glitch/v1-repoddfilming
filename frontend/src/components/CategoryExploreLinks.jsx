import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getActiveCategories } from "../lib/contentStore";

/**
 * Categorías como lista de texto: sobria, para que las imágenes de los
 * proyectos sean lo único que llame la atención.
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
    <ul className={`border-t border-white/10 ${className}`}>
      {categories.map((c) => {
        const count = projects.filter(
          (p) => p.category === c.id && p.published !== false,
        ).length;
        return (
          <li key={c.id} className="border-b border-white/10">
            <Link
              to={`/work/${c.id}`}
              data-testid={`category-explore-${c.id}`}
              className="group flex items-center justify-between gap-6 py-5 md:py-6"
            >
              <span className="text-2xl md:text-4xl font-light tracking-[-0.02em] text-white/70 transition-colors duration-300 group-hover:text-white">
                {c[lang]}
              </span>
              <span className="flex items-center gap-4 text-white/40 transition-colors duration-300 group-hover:text-white">
                <span className="text-[11px] tabular-nums tracking-[0.14em]">
                  {String(count).padStart(2, "0")}
                </span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
