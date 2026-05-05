export const T = {
  nav: {
    work: { es: "Obra", en: "Work" },
    about: { es: "Sobre mí", en: "About" },
    contact: { es: "Contacto", en: "Contact" },
    home: { es: "Inicio", en: "Home" },
  },
  hero: {
    showreel: { es: "Showreel", en: "Showreel" },
    scroll: { es: "Desplázate", en: "Scroll" },
  },
  work: {
    title: { es: "Obra seleccionada", en: "Selected work" },
    all: { es: "Todo", en: "All" },
    none: { es: "Sin proyectos en esta categoría todavía.", en: "No projects in this category yet." },
  },
  project: {
    director: { es: "Dirección", en: "Director" },
    year: { es: "Año", en: "Year" },
    type: { es: "Formato", en: "Type" },
    format: { es: "Captura", en: "Format" },
    synopsis: { es: "Sinopsis", en: "Synopsis" },
    stills: { es: "Fotogramas", en: "Stills" },
    bts: { es: "Detrás de cámara", en: "Behind the scenes" },
    showBts: { es: "Ver BTS", en: "Show BTS" },
    hideBts: { es: "Ocultar BTS", en: "Hide BTS" },
    external: { es: "Ver proyecto", en: "View project" },
    back: { es: "Volver", en: "Back" },
    next: { es: "Siguiente proyecto", en: "Next project" },
    notFound: { es: "Proyecto no encontrado.", en: "Project not found." },
  },
  about: {
    title: { es: "Sobre mí", en: "About" },
  },
  contact: {
    title: { es: "Contacto", en: "Contact" },
    intro: {
      es: "Para nuevos proyectos, colaboraciones o referencias técnicas.",
      en: "For new projects, collaborations or technical references.",
    },
    email: { es: "Correo", en: "Email" },
    phone: { es: "Teléfono", en: "Phone" },
    follow: { es: "Encuéntrame en", en: "Find me on" },
  },
  footer: {
    rights: { es: "Todos los derechos reservados.", en: "All rights reserved." },
  },
  admin: {
    title: { es: "Panel de administración", en: "Admin Panel" },
    login: { es: "Acceder", en: "Sign in" },
    logout: { es: "Salir", en: "Sign out" },
    password: { es: "Contraseña", en: "Password" },
    invalid: { es: "Contraseña incorrecta", en: "Invalid password" },
    site: { es: "Información del sitio", en: "Site information" },
    projects: { es: "Proyectos", en: "Projects" },
    addProject: { es: "Añadir proyecto", en: "Add project" },
    save: { es: "Guardar", en: "Save" },
    cancel: { es: "Cancelar", en: "Cancel" },
    delete: { es: "Eliminar", en: "Delete" },
    edit: { es: "Editar", en: "Edit" },
    moveUp: { es: "Subir", en: "Move up" },
    moveDown: { es: "Bajar", en: "Move down" },
    export: { es: "Exportar JSON", en: "Export JSON" },
    import: { es: "Importar JSON", en: "Import JSON" },
    reset: { es: "Restablecer por defecto", en: "Reset to default" },
    saved: { es: "Guardado", en: "Saved" },
    confirmDelete: { es: "¿Eliminar este proyecto?", en: "Delete this project?" },
    confirmReset: { es: "¿Restablecer al contenido original? Se perderán los cambios locales.", en: "Reset to original content? Local changes will be lost." },
  },
};

export const tr = (entry, lang) => {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return entry[lang] || entry.es || entry.en || "";
};
