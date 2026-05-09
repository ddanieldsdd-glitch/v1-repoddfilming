# 📝 Cómo gestionar el contenido (`content.json`)

Todo el contenido de la web vive en un único archivo:

```
src/data/content.json
```

Este archivo es la fuente de verdad. La web no usa base de datos: lo que escribas
aquí es lo que se muestra.

---

## 📍 Estructura del archivo

```json
{
  "site":     { ... }   // Datos generales (nombre, redes, foto About, logo)
  "about":    { ... }   // Texto biografía (ES y EN)
  "projects": [ ... ]   // ⭐ AQUÍ van todos los proyectos. Orden = orden web
}
```

---

## ➕ Cómo AÑADIR un proyecto

1. Abre `src/data/content.json`.
2. Copia este bloque:

```json
{
  "id": "p-NUEVO_ID_UNICO",
  "slug": "titulo-en-kebab-case",
  "category": "fiction",
  "title": "Título del Proyecto",
  "year": 2025,
  "type": { "es": "Cortometraje", "en": "Short Film" },
  "director": "Nombre del Director o Directores",
  "format": "ARRI Alexa Mini LF · Cooke S4",
  "synopsis": {
    "es": "Sinopsis en español (2-3 frases).",
    "en": "Synopsis in English (2-3 sentences)."
  },
  "cover": "https://res.cloudinary.com/.../cover.jpg",
  "poster": "https://res.cloudinary.com/.../poster.jpg",
  "preview_url": "https://vimeo.com/XXXXXXXXX",
  "stills": [
    "https://res.cloudinary.com/.../still1.jpg",
    "https://res.cloudinary.com/.../still2.jpg"
  ],
  "bts": [
    "https://res.cloudinary.com/.../bts1.jpg"
  ],
  "external_link": "https://www.imdb.com/..."
},
```

3. Pégalo dentro del array `projects` en el sitio donde quieras que aparezca:
   - **Al principio** = aparece primero en home y en `/work`.
   - Entre dos proyectos existentes = aparece en esa posición.
4. Asegúrate de que **NO HAY COMA** después del último objeto del array.
5. Guarda y haz `git push`. El proyecto aparece automáticamente.

### Campos importantes

| Campo | Qué contiene | Dónde aparece |
|---|---|---|
| `title` | Título del proyecto | Cards, detalle y navegación |
| `year` | Año | Cards y ficha técnica |
| `type` | Tipo ES/EN | Cards y ficha técnica |
| `director` | Director o directores | Cards y ficha técnica |
| `format` | Cámara, lentes o formato técnico | Ficha técnica |
| `synopsis` | Sinopsis ES/EN | Página de proyecto |
| `preview_url` | Video embed de Vimeo o YouTube | Hover de cards y hero del proyecto |
| `cover` | Cover image horizontal | Miniatura en home y `/work`; fallback visual del vídeo |
| `poster` | Poster image vertical opcional | Página de proyecto |
| `stills` | Fotogramas | Galería del proyecto |
| `bts` | Fotos behind-the-scenes | Sección BTS desplegable |
| `external_link` | IMDb, web oficial u otro enlace | Botón “Ver proyecto” |

---

## 🗑️ Cómo ELIMINAR un proyecto

1. Abre `src/data/content.json`.
2. Localiza el bloque `{ ... }` del proyecto que quieres borrar (busca por su `slug`
   o `title`).
3. Elimina ese bloque entero, **incluyendo la coma** que lo separa del siguiente.
4. Guarda y haz `git push`.

---

## ✏️ Cómo MODIFICAR un proyecto

1. Abre `src/data/content.json`.
2. Localiza el bloque del proyecto.
3. Edita los campos que quieras (título, año, sinopsis, URLs de imágenes, etc.).
4. Guarda y haz `git push`.

---

## 🎬 Categorías

Las 4 categorías permitidas en el campo `"category"` son:

| Valor | Aparece en la web como (ES/EN) |
|---|---|
| `fiction` | Ficción / Fiction |
| `documentary` | Documental / Documentary |
| `commercial` | Publicidad / Commercials |
| `music-video` | Videoclips / Music Videos |

> Si una categoría se queda **sin proyectos**, desaparece automáticamente de los
> filtros y de la franja de la home. No tienes que tocar nada.

---

## 🔗 Sobre los enlaces de Vimeo

- En `preview_url` y `cover` puedes poner una URL de Vimeo o de YouTube.
- Para que se reproduzcan en la web, el vídeo de Vimeo tiene que estar:
  - Privacy: **Public**
  - Where can this be embedded: **Anywhere**
- Verifica antes de cada deploy con:
  ```bash
  yarn check:videos
  ```

---

## 🖼️ Sobre las imágenes

- Sube las imágenes a [Cloudinary](https://cloudinary.com/) (gratis, ya tienes
  cuenta) o a cualquier CDN/host externo.
- **No subas imágenes al repo** — la web carga URLs externas.
- Formato recomendado: JPG/PNG/WebP. Tamaño largo recomendado **2000-2400 px**
  para que se vean nítidas en pantallas grandes.
- Las stills **conservan su proporción real** (no se recortan), así que puedes
  mezclar 16:9 horizontales con verticales sin problema visual.

---

## 🔄 Alternativa: editar desde `/admin` (sin tocar código)

Si prefieres no tocar el JSON a mano:

1. Configura `REACT_APP_ADMIN_PASSWORD` en Vercel (o en `.env.local`) y despliega; entra en `/admin` con esa contraseña.
2. Añade / edita / elimina proyectos con la interfaz.
3. Pulsa **Export** → descarga `content-FECHA.json`.
4. Reemplaza `src/data/content.json` con el archivo descargado.
5. `git commit -m "update content"` + `git push`.

> Ojo: lo que edites en `/admin` solo vive en el `localStorage` del navegador en
> el que estás. Para que sea permanente y visible para todo el mundo, **siempre
> tienes que exportar y reemplazar el JSON** del repo.
