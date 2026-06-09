const { MongoClient } = require('mongodb');
const defaultContent = require('../src/data/content.json');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ddp_portfolio';

let _client = null;
async function getProjects() {
  if (!MONGO_URL) return defaultContent.projects || [];
  try {
    if (!_client) {
      _client = new MongoClient(MONGO_URL);
      await _client.connect();
    }
    const doc = await _client
      .db(DB_NAME)
      .collection('content')
      .findOne({}, { projection: { _id: 0, projects: 1 } });
    return doc?.projects || defaultContent.projects || [];
  } catch {
    return defaultContent.projects || [];
  }
}

function generateOGHTML(project, baseUrl, isProjectPage = false) {
  const title = project.title;
  const description =
    project.synopsis?.es ||
    project.synopsis?.en ||
    'Proyecto de Dani Díaz';
  const image =
    project.poster ||
    project.cover ||
    'https://res.cloudinary.com/dsphxo7mx/image/upload/v1777654137/POSTER-ORIGAMI2-scaled_r5mmum.jpg';
  const url = isProjectPage ? `${baseUrl}/project/${project.slug}` : baseUrl;
  const type = isProjectPage ? 'article' : 'website';

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/png" sizes="32x32" href="https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_32,h_32,c_pad,b_rgb:000000,q_auto,f_png/v1777731841/DD_BLANCO_l8xqal.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_192,h_192,c_pad,b_rgb:000000,q_auto,f_png/v1777731841/DD_BLANCO_l8xqal.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_180,h_180,c_pad,b_rgb:000000,q_auto,f_png/v1777731841/DD_BLANCO_l8xqal.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
    <title>${title} — Dani Díaz</title>
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
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@ddani_00" />
    <meta name="twitter:title" content="${title} — Dani Díaz" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <script>
        window.addEventListener("error", function(e) {
            if (e.error instanceof DOMException && e.error.name === "DataCloneError" &&
                e.message && e.message.includes("PerformanceServerTiming")) {
                e.stopImmediatePropagation(); e.preventDefault();
            }
        }, true);
    </script>
</head>
<body style="background:#000000;">
    <noscript>Necesitas habilitar JavaScript para ver esta web.</noscript>
    <div id="root"></div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  const { URL } = require('url');
  const parsed = new URL(req.url, 'http://localhost');
  const path = parsed.pathname;
  const baseUrl = 'https://ddanidiaz.com';

  const projectMatch = path.match(/^\/project\/([^/]+)/);

  if (projectMatch) {
    const slug = projectMatch[1];
    const projects = await getProjects();
    const project = projects.find((p) => p.slug === slug) || null;

    if (project) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.status(200).send(generateOGHTML(project, baseUrl, true));
    }
  }

  const userAgent = req.headers['user-agent'] || '';
  const isBot =
    /bot|crawler|spider|facebook|twitter|linkedin|whatsapp|telegram|slack|discord/i.test(
      userAgent
    );

  if (isBot && (path === '/' || path === '/index.html')) {
    const logoImage =
      'https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_1200,h_630,c_pad,b_rgb:000000,q_auto,f_png/v1777731841/DD_BLANCO_l8xqal.png';
    const favicon32 =
      'https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_32,h_32,c_pad,b_rgb:000000,q_auto,f_png/v1777731841/DD_BLANCO_l8xqal.png';
    const favicon192 =
      'https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_192,h_192,c_pad,b_rgb:000000,q_auto,f_png/v1777731841/DD_BLANCO_l8xqal.png';
    const appleTouch =
      'https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_180,h_180,c_pad,b_rgb:000000,q_auto,f_png/v1777731841/DD_BLANCO_l8xqal.png';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Dani Díaz — Cinematographer. Trabajos seleccionados en ficción, documental, publicidad y videoclips." />
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/png" sizes="32x32" href="${favicon32}" />
    <link rel="icon" type="image/png" sizes="192x192" href="${favicon192}" />
    <link rel="apple-touch-icon" sizes="180x180" href="${appleTouch}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
    <title>Dani Díaz — Cinematographer</title>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Dani Díaz — Cinematographer" />
    <meta property="og:title" content="Dani Díaz — Cinematographer" />
    <meta property="og:description" content="La luz como narrativa. La imagen como memoria. Trabajos seleccionados en ficción, documental, publicidad y videoclips." />
    <meta property="og:image" content="${logoImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${baseUrl}/" />
    <meta property="og:locale" content="es_ES" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@ddani_00" />
    <meta name="twitter:title" content="Dani Díaz — Cinematographer" />
    <meta name="twitter:description" content="La luz como narrativa. La imagen como memoria. Trabajos seleccionados en ficción, documental, publicidad y videoclips." />
    <meta name="twitter:image" content="${logoImage}" />
    <script>
        window.addEventListener("error", function(e) {
            if (e.error instanceof DOMException && e.error.name === "DataCloneError" &&
                e.message && e.message.includes("PerformanceServerTiming")) {
                e.stopImmediatePropagation(); e.preventDefault();
            }
        }, true);
    </script>
</head>
<body style="background:#000000;">
    <noscript>Necesitas habilitar JavaScript para ver esta web.</noscript>
    <div id="root"></div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.status(200).send(html);
  }

  return res.status(404).end();
};
