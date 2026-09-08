import { useEffect, useState } from "react";
import { AdminSection } from "./AdminSection";
import { AdminButton } from "./AdminButton";
import { AdminDialog } from "./AdminDialog";
import { useAdminContent } from "./hooks/useAdminContent";

export const AdminHistory = () => {
  const { reload } = useAdminContent();
  const [items, setItems] = useState([]);
  const [target, setTarget] = useState(null);

  const load = async () => {
    const res = await fetch("/api/content-history", { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    setItems(data.items || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminSection title="Historial" description="Copias recientes de cambios del admin. Restaurar sustituye el contenido actual.">
      <ul className="divide-y divide-white/10">
        {items.map((item) => (
          <li key={item.id} className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">{item.scope}</p>
              <p className="text-[11px] text-neutral-500">{item.createdAt}</p>
            </div>
            <AdminButton onClick={() => setTarget(item)}>Restaurar</AdminButton>
          </li>
        ))}
      </ul>
      {!items.length && <p className="text-neutral-500 text-sm">Todavía no hay entradas.</p>}
      <AdminDialog
        open={Boolean(target)}
        title="Restaurar versión"
        description="Se creará un snapshot actual y luego se restaurará esta entrada."
        confirmLabel="Restaurar"
        onCancel={() => setTarget(null)}
        onConfirm={async () => {
          await fetch("/api/content-history", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: target.id }),
          });
          await reload();
          setTarget(null);
        }}
      />
    </AdminSection>
  );
};
