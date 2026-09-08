import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { HOME_SIZES, stillChoices } from "../../lib/homeGrid";
import { Field } from "./fields/Field";
import { inputCls } from "./styles";

export const HomeLayoutSection = ({ content, onSave, saving }) => {
  const snapshot = (projects, site) =>
    (projects || []).map((p, i) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      cover: p.cover,
      stills: p.stills || [],
      home_featured: p.home_featured !== false,
      home_order: Number.isFinite(Number(p.home_order)) ? Number(p.home_order) : i + 1,
      home_size: p.home_size || "medium",
      home_still: p.home_still || "",
    }));

  const [rows, setRows] = useState(() => snapshot(content.projects, content.site));
  const [homeMax, setHomeMax] = useState(content.site?.home_max ?? 12);
  useEffect(() => {
    setRows(snapshot(content.projects, content.site));
    setHomeMax(content.site?.home_max ?? 12);
  }, [content.projects, content.site]);

  const patch = (id, next) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const handleSave = async () => {
    try {
      await onSave({
        home_max: Number(homeMax) || 12,
        projects: rows.map((row) => ({
          id: row.id,
          home_featured: row.home_featured,
          home_order: row.home_order,
          home_size: row.home_size,
          home_still: row.home_still,
        })),
      });
      toast.success("Portada guardada");
    } catch {
      /* parent handles errors */
    }
  };

  const sorted = [...rows].sort(
    (a, b) => Number(a.home_order) - Number(b.home_order) || a.title.localeCompare(b.title),
  );

  const move = (id, dir) => {
    const featured = sorted.filter((r) => r.home_featured);
    const rest = sorted.filter((r) => !r.home_featured);
    const i = featured.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= featured.length) return;
    const next = [...featured];
    [next[i], next[j]] = [next[j], next[i]];
    setRows([
      ...next.map((r, idx) => ({ ...r, home_order: idx + 1 })),
      ...rest.map((r, idx) => ({ ...r, home_order: next.length + idx + 1 })),
    ]);
  };

  return (
    <div className="border border-white/10 p-6 md:p-8 mb-10" data-testid="admin-home-layout">
      <h2 className="text-xl tracking-tight mb-2">Pantalla principal</h2>
      <p className="text-[12px] text-neutral-500 mb-6 max-w-2xl">
        Qué proyectos salen en la parrilla, su still, tamaño y orden. El reencuadre del vídeo Vimeo
        (miniaturas en Obra y preview en portada) se configura en cada proyecto, junto a la URL de
        preview. El showreel y el máximo de piezas global se ajustan aquí; la URL del reel en Site.
      </p>
      <div className="mb-6 max-w-xs">
        <Field label="Máximo de piezas en portada">
          <input
            type="number"
            min={1}
            max={24}
            className={inputCls}
            value={homeMax}
            onChange={(e) => setHomeMax(parseInt(e.target.value, 10) || 12)}
            data-testid="site-home-max"
          />
        </Field>
      </div>
      <ul className="space-y-4">
        {sorted.map((row) => {
          const project = content.projects.find((p) => p.id === row.id) || row;
          const thumbs = stillChoices(project);
          const featuredList = sorted.filter((r) => r.home_featured);
          const featIndex = featuredList.findIndex((r) => r.id === row.id);
          return (
            <li
              key={row.id}
              className="rounded-xl border border-white/10 p-4 grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4"
            >
              <div className="h-24 lg:h-full min-h-[96px] rounded-lg overflow-hidden bg-black flex items-center justify-center">
                {(row.home_still || row.cover) && (
                  <img
                    src={row.home_still || row.cover}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white">{row.title}</p>
                  <div className="flex items-center gap-3">
                    {row.home_featured && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => move(row.id, -1)}
                          disabled={featIndex <= 0}
                          className="p-1.5 border border-white/20 text-white hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white transition"
                          aria-label="Subir"
                          title="Subir"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(row.id, 1)}
                          disabled={featIndex < 0 || featIndex >= featuredList.length - 1}
                          className="p-1.5 border border-white/20 text-white hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white transition"
                          aria-label="Bajar"
                          title="Bajar"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-neutral-400">
                      <input
                        type="checkbox"
                        checked={row.home_featured}
                        onChange={(e) => patch(row.id, { home_featured: e.target.checked })}
                        className="accent-white"
                      />
                      En home
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Field label="Orden">
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={row.home_order}
                      onChange={(e) => patch(row.id, { home_order: parseInt(e.target.value, 10) || 1 })}
                    />
                  </Field>
                  <Field label="Tamaño">
                    <select
                      className={inputCls}
                      value={row.home_size}
                      onChange={(e) => patch(row.id, { home_size: e.target.value })}
                    >
                      {HOME_SIZES.map((s) => (
                        <option key={s.id} value={s.id}>{s.es}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                {thumbs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {thumbs.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => patch(row.id, { home_still: url })}
                        className={`h-12 w-[4.5rem] overflow-hidden rounded-md border bg-black ${
                          (row.home_still || row.cover) === url
                            ? "border-white"
                            : "border-white/15 hover:border-white/40"
                        }`}
                        title="Usar este still"
                      >
                        <img src={url} alt="" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <button
        data-testid="save-home-layout"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 border border-white/30 px-5 py-2 text-[11px] tracking-[0.28em] uppercase text-white hover:bg-white hover:text-black transition disabled:opacity-50"
      >
        {saving ? "Saving…" : "Guardar portada"}
      </button>
    </div>
  );
};
