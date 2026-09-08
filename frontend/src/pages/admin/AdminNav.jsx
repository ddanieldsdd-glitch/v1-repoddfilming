import { NavLink } from "react-router-dom";
import { T } from "../../lib/i18n";

const LINKS = [
  { to: "/admin/projects", label: T.admin.projects.es },
  { to: "/admin/home", label: T.admin.home.es },
  { to: "/admin/site", label: T.admin.site.es },
  { to: "/admin/history", label: T.admin.history.es },
];

export const AdminNav = () => (
  <nav className="flex flex-wrap gap-2" data-testid="admin-nav">
    {LINKS.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        className={({ isActive }) =>
          `border px-3 py-2 text-[10px] tracking-[0.18em] uppercase transition ${
            isActive
              ? "border-white bg-white text-black"
              : "border-white/20 text-neutral-400 hover:text-white"
          }`
        }
      >
        {link.label}
      </NavLink>
    ))}
  </nav>
);
