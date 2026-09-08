import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchContent,
  isAdminAuthed,
  setAdminAuthed,
  logoutAdmin,
  verifyAdminSession,
} from "../lib/contentStore";
import { inputCls } from "./admin/styles";
import { AdminNav } from "./admin/AdminNav";
import { AdminButton } from "./admin/AdminButton";
import { AdminDialog } from "./admin/AdminDialog";
import { SaveStatus } from "./admin/SaveStatus";
import { AdminContentProvider, useAdminContent } from "./admin/hooks/useAdminContent";
import { ProjectList } from "./admin/ProjectList";
import { ProjectEditor } from "./admin/ProjectEditor";
import { HomeLayoutSection } from "./admin/HomeLayoutSection";
import { SiteSection } from "./admin/SiteSection";
import { AdminHistory } from "./admin/AdminHistory";

function AdminChrome() {
  const { content, saveStates, lastSavedAt, reload, importContent, resetAll } = useAdminContent();
  const fileRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const combinedState = Object.values(saveStates).includes("conflict")
    ? "conflict"
    : Object.values(saveStates).includes("saving")
      ? "saving"
      : Object.values(saveStates).includes("error")
        ? "error"
        : "saved";

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white" data-testid="admin-panel">
      <div className="border-b border-white/10 px-6 md:px-12 py-5 sticky top-0 bg-black z-30 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-[11px] tracking-[0.28em] uppercase text-neutral-400 hover:text-white">← Sitio</Link>
            <h1 className="text-base tracking-[0.2em] uppercase">Admin</h1>
          </div>
          <SaveStatus saveState={combinedState} lastSavedAt={lastSavedAt} onReload={reload} />
          <button type="button" className="md:hidden text-[10px] uppercase tracking-[0.18em]" onClick={() => setMenuOpen((v) => !v)}>Menú</button>
          <div className={`flex items-center gap-2 flex-wrap ${menuOpen ? "flex" : "hidden md:flex"}`}>
            <AdminButton data-testid="admin-export" onClick={exportJson}>Exportar</AdminButton>
            <AdminButton data-testid="admin-import" onClick={() => fileRef.current?.click()}>Importar</AdminButton>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" data-testid="admin-import-input" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const json = JSON.parse(reader.result);
                  if (!json.site || !Array.isArray(json.projects)) throw new Error("Estructura inválida");
                  setImportPreview(json);
                } catch (err) {
                  toast.error(err.message);
                }
              };
              reader.readAsText(file);
              e.target.value = "";
            }} />
            <AdminButton onClick={() => setConfirmReset(true)}>Reset</AdminButton>
            <AdminButton data-testid="admin-logout" variant="ghost" onClick={async () => { await logoutAdmin(); window.location.assign("/admin"); }}>Salir</AdminButton>
          </div>
        </div>
        <AdminNav />
      </div>
      <div className="px-6 md:px-12 py-10 max-w-6xl" key={location.pathname}>
        <Routes>
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/new" element={<ProjectEditor />} />
          <Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="home" element={<HomeLayoutSection />} />
          <Route path="site" element={<SiteSection />} />
          <Route path="history" element={<AdminHistory />} />
        </Routes>
      </div>
      <AdminDialog
        open={Boolean(importPreview)}
        title="Importar contenido"
        description={importPreview ? `Se importarán ${importPreview.projects.length} proyectos. Esto sustituye el documento actual.` : ""}
        confirmLabel="Importar"
        confirmVariant="primary"
        onCancel={() => setImportPreview(null)}
        onConfirm={async () => {
          await importContent(importPreview);
          setImportPreview(null);
        }}
      />
      <AdminDialog
        open={confirmReset}
        title="Restablecer contenido"
        description="Se perderán los cambios actuales y se volverá al contenido por defecto."
        confirmLabel="Restablecer"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetAll();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [pwd, setPwd] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    if (!authed) return undefined;
    let cancelled = false;
    setContentLoading(true);
    (async () => {
      const valid = await verifyAdminSession();
      if (!valid) {
        await logoutAdmin();
        if (!cancelled) setAuthed(false);
        return;
      }
      try {
        const next = await fetchContent();
        if (!cancelled) setContent(next);
      } catch {
        toast.error("No se pudo cargar el contenido");
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authed]);

  const tryLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setAdminAuthed(true);
        setAuthed(true);
      } else {
        toast.error(data.message || "Contraseña incorrecta");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoginLoading(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-sm" data-testid="admin-login">
          <Link to="/" className="text-[11px] tracking-[0.28em] uppercase text-neutral-400 mb-10 inline-block hover:text-white">← Volver</Link>
          <h1 className="text-3xl tracking-tight mb-8 font-light text-white">Admin</h1>
          <input type="password" data-testid="admin-password" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tryLogin()} placeholder="Contraseña" className={inputCls} autoComplete="current-password" />
          <button data-testid="admin-login-btn" type="button" onClick={tryLogin} disabled={loginLoading} className="mt-4 w-full border border-white/30 px-5 py-3 text-[11px] tracking-[0.28em] uppercase text-white hover:bg-white hover:text-black transition disabled:opacity-50">
            {loginLoading ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  if (contentLoading || !content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-500">Cargando…</p>
      </div>
    );
  }

  return (
    <AdminContentProvider initialContent={content}>
      <AdminChrome />
    </AdminContentProvider>
  );
}
