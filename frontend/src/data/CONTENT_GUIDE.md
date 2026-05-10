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

### Opción recomendada: pegar una plantilla completa

1. Rellena esta plantilla fuera de la terminal:

```json
{
  "title": "Título del Proyecto",
  "year": 2025,
  "category": "fiction",
  "type": { "es": "Cortometraje", "en": "Short Film" },
  "director": "Nombre del Director o Directores",
  "production_company": "Nombre de la Productora",
  "format": "ARRI Alexa Mini LF · Cooke S4",
  "synopsis": {
    "es": "Sinopsis en español.",
    "en": "Synopsis in English."
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
  "external_link": "https://www.imdb.com/...",
  "position": "beginning"
}
```

2. En PowerShell, ejecuta desde la raíz del proyecto:

```powershell
Set-Location "C:\Users\ddani\Documents\v1-repoddfilming"
npm run new-project:paste
```

3. Cuando la terminal diga `Paste the completed project JSON below`, pega solo el JSON, sin copiar las líneas de Markdown ```json ni ```powershell.

4. Al terminar, escribe `FIN` en una línea nueva y pulsa Enter.

Ejemplo de final:

```powershell
}
FIN
```

El script leerá el JSON pegado y añadirá el proyecto automáticamente a:

```text
frontend/src/data/content.json
```

Después de añadirlo, el asistente te ofrecerá:

1. Ejecutar `npm run build` para validar que la web compila.
2. Abrir un servidor local en una nueva ventana de PowerShell para revisar:
   - `http://localhost:3000/work`
   - `http://localhost:3000/project/slug-del-proyecto`
3. Cuando confirmes que está bien, hacer `git add`, `git commit` y `git push` para que Vercel despliegue automáticamente desde GitHub.

El `push` no se hace solo: el script te pregunta antes.

Puedes usar `"position": "beginning"` para añadirlo al principio o `"position": "end"` para añadirlo al final.

### Alternativa: asistente pregunta a pregunta

Desde cualquier terminal, entra primero en la raíz del proyecto:

```powershell
Set-Location "C:\Users\ddani\Documents\v1-repoddfilming"
```

Después ejecuta:

```powershell
npm run new-project
```

El asistente te preguntará los datos del proyecto y lo añadirá automáticamente a:

```text
frontend/src/data/content.json
```

También puedes ejecutarlo desde cualquier ubicación sin cambiar de carpeta:

```powershell
npm --prefix "C:\Users\ddani\Documents\v1-repoddfilming\frontend" run new-project
```

El script genera automáticamente:

- `id`
- `slug`
- URL final `/project/slug-del-proyecto`

### Nota para futuras IAs o desarrolladores

El flujo más cómodo y seguro para crear proyectos es pegar una plantilla JSON completa en el portapapeles y ejecutar:

```powershell
npm run new-project:paste
```

Si el usuario prefiere responder campo por campo, también existe:

```powershell
npm run new-project
```

Ambos comandos funcionan desde la raíz del repo gracias al `package.json` raíz, que delega en:

```text
frontend/scripts/new-project.js
```

Este script modifica únicamente:

```text
frontend/src/data/content.json
```

La fuente de verdad de la web sigue siendo `frontend/src/data/content.json`.
No hay CMS ni base de datos. El panel `/admin` edita `localStorage`, por lo que
para producción siempre debe quedar reflejado en `content.json`.

### Opción manual

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
  "production_company": "Nombre de la Productora",
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
