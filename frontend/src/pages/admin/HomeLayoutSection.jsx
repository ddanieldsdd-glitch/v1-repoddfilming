import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { HOME_SIZES, stillChoices } from "../../lib/homeGrid";
import { SHOWREEL_PLACEMENTS } from "../../lib/crop";
import { Field } from "./fields/Field";
import { inputCls } from "./styles";
import { AdminSection } from "./AdminSection";
import { SaveStatus } from "./SaveStatus";
import { useAdminContent } from "./hooks/useAdminContent";
import { useSectionDraft } from "./hooks/useSectionDraft";
import { useMemo, useState } from "react";

const snapshot = (content) => ({
  home_max: content.site?.home_max ?? 12,
  showreel_url: content.site?.showreel_url || "",
  showreel_placement: content.site?.showreel_placement || "nav",
  rows: (content.projects || []).map((p, i) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    cover: p.cover,
    stills: p.stills || [],
    home_featured: p.home_featured !== false,
    home_order: Number.isFinite(Number(p.home_order)) ? Number(p.home_order) : i + 1,
    home_size: p.home_size || "medium",
    home_still: p.home_still || "",
    home_still_ratio:
      Number.isFinite(Number(p.home_still_ratio)) && Number(p.home_still_ratio) > 0
        ? Number(p.home_still_ratio)
        : null,
  })),
});

const naturalRatio = (image) => {
  if (!image?.naturalWidth || !image?.naturalHeight) return null;
  return Number((image.naturalWidth / image.naturalHeight).toFixed(6));
};

export const HomeLayoutSection = () => {
  const { content, saveHome, saveStates, reload } = useAdminContent();
  const initial = useMemo(() => snapshot(content), [content]);
  const [query, setQuery] = useState("");
  const [homeOnly, setHomeOnly] = useState(true);

  const { draft, setDraft, status } = useSectionDraft({
    initial,
    debounceMs: 1800,
    onSave: async (next) => {
      await saveHome({
        home_max: Number(next.home_max) || 12,
        showreel_url: next.showreel_url,
        showreel_placement: next.showreel_placement,
        projects: next.rows.map((row) => ({
          id: row.id,
          home_featured: row.home_featured,
          home_order: row.home_order,
          home_size: row.home_size,
          home_still: row.home_still,
          home_still_ratio: row.home_still_ratio,
        })),
      });
    },
  });

  const patch = (id, next) =>
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === id ? { ...row, ...next } : row)),
    }));

  const selectStill = (id, url, image) => {
    const ratio = naturalRatio(image);
    patch(id, { home_still: url, home_still_ratio: ratio });
    if (ratio) return;

    const probe = new Image();
    probe.onload = () => {
      const measured = naturalRatio(probe);
      if (!measured) return;
      setDraft((current) => ({
        ...current,
        rows: current.rows.map((row) =>
          row.id === id && row.home_still === url
            ? { ...row, home_still_ratio: measured }
            : row,
        ),
      }));
    };
    probe.src = url;
  };

  const sorted = [...draft.rows].sort(
    (a, b) => Number(a.home_order) - Number(b.home_order) || a.title.localeCompare(b.title),
  );
  const visible = sorted.filter((row) => {
    if (homeOnly && !row.home_featured) return false;
    if (!query.trim()) return true;
    return `${row.title} ${row.slug}`.toLowerCase().includes(query.trim().toLowerCase());
  });

  const move = (id, dir) => {
    const featured = sorted.filter((r) => r.home_featured);
    const i = featured.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= featured.length) return;
    const next = [...featured];
    [next[i], next[j]] = [next[j], next[i]];
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => {
        const idx = next.findIndex((item) => item.id === row.id);
        return idx >= 0 ? { ...row, home_order: idx + 1 } : row;
      }),
    }));
  };

  return (
    <AdminSection
      title="Pantalla principal"
      description="Controla qué proyectos salen en portada, su still, tamaño y el showreel. El recorte del vídeo se edita en cada proyecto."
      actions={<SaveStatus saveState={status === "dirty" ? "idle" : status === "saving" ? "saving" : saveStates.home} onReload={reload} lastSavedAt={status === "saved" ? new Date() : null} />}
      testId="admin-home-layout"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Field label="Máximo de piezas">
          <input type="number" min={1} max={24} className={inputCls} value={draft.home_max} data-testid="site-home-max" onChange={(e) => setDraft((d) => ({ ...d, home_max: parseInt(e.target.value, 10) || 12 }))} />
        </Field>
        <Field label="Showreel URL">
          <input className={inputCls} value={draft.showreel_url} onChange={(e) => setDraft((d) => ({ ...d, showreel_url: e.target.value }))} />
        </Field>
        <Field label="Dónde mostrar el showreel">
          <select className={inputCls} value={draft.showreel_placement} onChange={(e) => setDraft((d) => ({ ...d, showreel_placement: e.target.value }))}>
            {SHOWREEL_PLACEMENTS.map((p) => <option key={p.id} value={p.id}>{p.es}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input className={inputCls + " max-w-sm"} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en portada" />
        <button type="button" onClick={() => setHomeOnly((v) => !v)} className={`border px-3 py-2 text-[10px] tracking-[0.18em] uppercase ${homeOnly ? "bg-white text-black" : "border-white/20 text-neutral-400"}`}>
          Solo en portada
        </button>
      </div>
      <ul className="space-y-4">
        {visible.map((row) => {
          const project = content.projects.find((p) => p.id === row.id) || row;
          const thumbs = stillChoices(project);
          const missingStill = row.home_still && !thumbs.includes(row.home_still) && row.home_still !== row.cover;
          return (
            <li key={row.id} className="rounded-xl border border-white/10 p-4 grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4">
              <div className="h-24 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                {(row.home_still || row.cover) && (
                  <img
                    src={row.home_still || row.cover}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                    onLoad={(event) => {
                      const ratio = naturalRatio(event.currentTarget);
                      if (ratio && ratio !== row.home_still_ratio) {
                        patch(row.id, { home_still_ratio: ratio });
                      }
                    }}
                  />
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{row.title}</p>
                    <Link to={`/admin/projects/${row.id}`} className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 hover:text-white">Editar proyecto</Link>
                    {missingStill && <p className="text-[11px] text-amber-400">El still elegido ya no está en cover/stills.</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {row.home_featured && (
                      <>
                        <button type="button" onClick={() => move(row.id, -1)} className="p-1.5 border border-white/20" aria-label="Subir"><ChevronUp className="w-4 h-4" /></button>
                        <button type="button" onClick={() => move(row.id, 1)} className="p-1.5 border border-white/20" aria-label="Bajar"><ChevronDown className="w-4 h-4" /></button>
                      </>
                    )}
                    <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                      <input type="checkbox" className="accent-white" checked={row.home_featured} onChange={(e) => patch(row.id, { home_featured: e.target.checked })} />
                      En home
                    </label>
                  </div>
                </div>
                <Field label="Tamaño">
                  <select className={inputCls} value={row.home_size} onChange={(e) => patch(row.id, { home_size: e.target.value })}>
                    {HOME_SIZES.map((s) => <option key={s.id} value={s.id}>{s.es}</option>)}
                  </select>
                </Field>
                {thumbs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {thumbs.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={(event) =>
                          selectStill(row.id, url, event.currentTarget.querySelector("img"))
                        }
                        className={`h-12 w-[4.5rem] overflow-hidden rounded-md border bg-black ${(row.home_still || row.cover) === url ? "border-white" : "border-white/15"}`}
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
    </AdminSection>
  );
};
