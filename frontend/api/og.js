import { projects, defaultProject } from "./projects-data.js";

export const config = {
  runtime: "edge",
};

function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug) || null;
}

function generateOGHTML(project, baseUrl, isProjectPage = false) {
  const title = project.title;
  const description = project.synopsis?.es || project.synopsis?.en || "Proyecto de Dani Díaz";
  const image = project.poster || project.cover || "https://res.cloudinary.com/dsphxo7mx/image/upload/v1777654137/POSTER-ORIGAMI2-scaled_r5mmum.jpg";
  const url = isProjectPage ? `${baseUrl}/project/${project.slug}` : baseUrl;
  const type = isProjectPage ? "article" : "website";

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/png" href="https://res.cloudinary.com/dsphxo7mx/image/upload/v1777731841/DD_BLANCO_l8xqal.png" />
    <link rel="apple-touch-icon" href="https://res.cloudinary.com/dsphxo7mx/image/upload/v1777731841/DD_BLANCO_l8xqal.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
    <title>${title} — Dani Díaz</title>

    <!-- Open Graph / Social Sharing -->
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="Dani Díaz — Director de Fotografía" />
    <meta property="og:title" content="${title} — Dani Díaz" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="es_ES" />
    <meta property="og:locale:alternate" content="en_US" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@ddani_00" />
    <meta name="twitter:title" content="${title} — Dani Díaz" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />

    <script>
        window.addEventListener(
            "error",
            function (e) {
                if (
                    e.error instanceof DOMException &&
                    e.error.name === "DataCloneError" &&
                    e.message &&
                    e.message.includes("PerformanceServerTiming")
                ) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            },
            true,
        );
    </script>
</head>
<body style="background:#000000;">
    <noscript>Necesitas habilitar JavaScript para ver esta web.</noscript>
    <div id="root"></div>
</body>
</html>`;
}

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const baseUrl = "https://ddfilming.com"; // Update with your actual domain

  // Check if it's a project page
  const projectMatch = path.match(/^\/project\/([^/]+)/);
  
  if (projectMatch) {
    const slug = projectMatch[1];
    const project = getProjectBySlug(slug);
    
    if (project) {
      const html = generateOGHTML(project, baseUrl, true);
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      });
    }
  }

  // For root or other pages, check if it's a bot/crawler
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = /bot|crawler|spider|facebook|twitter|linkedin|whatsapp|telegram|slack|discord/i.test(userAgent);
  
  // If it's a bot requesting the root, serve the most viewed project (Origami)
  if (isBot && (path === "/" || path === "/index.html")) {
    const html = generateOGHTML(defaultProject, baseUrl, false);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  }

  // For all other requests, let the SPA handle it
  return new Response(null, { status: 404 });
}
