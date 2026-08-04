#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const ROOT_PATH = path.join(__dirname, "..", "..");
const CONTENT_PATH = path.join(__dirname, "..", "src", "data", "content.json");
const CATEGORIES = ["fiction", "documentary", "commercial", "music-video"];
const USE_PASTE = process.argv.includes("--paste");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question, fallback = "") =>
  new Promise((resolve) => {
    const suffix = fallback ? ` (${fallback})` : "";
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || fallback);
    });
  });

const slugify = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const splitUrls = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeRecognitionsInput = (input) => {
  if (!input) return [];
  const list = Array.isArray(input) ? input : splitUrls(input);
  return list
    .map((item) => {
      if (typeof item === "string") {
        const url = item.trim();
        return url ? { url, showOnCard: true } : null;
      }
      const url = String(item?.url || "").trim();
      return url ? { url, showOnCard: item.showOnCard !== false } : null;
    })
    .filter(Boolean);
};

const ensureUnique = (base, existing) => {
  let value = base;
  let i = 2;
  while (existing.has(value)) {
    value = `${base}-${i}`;
    i += 1;
  }
  return value;
};

const readContent = () => {
  if (!fs.existsSync(CONTENT_PATH)) {
    throw new Error(`content.json not found at ${CONTENT_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONTENT_PATH, "utf8"));
};

const writeContent = (content) => {
  fs.writeFileSync(CONTENT_PATH, `${JSON.stringify(content, null, 2)}\n`, "utf8");
};

const run = (command, cwd = ROOT_PATH) => {
  execSync(command, {
    cwd,
    stdio: "inherit",
    shell: true,
  });
};

const startLocalServer = () => {
  execSync(
    "powershell -NoProfile -Command \"Start-Process powershell -ArgumentList '-NoExit','-Command','npm --prefix frontend start'\"",
    {
      cwd: ROOT_PATH,
      stdio: "inherit",
      shell: true,
    }
  );
};

const readPastedJson = () =>
  new Promise((resolve, reject) => {
    console.log("Paste the completed project JSON below.");
    console.log("When finished, type FIN on a new line and press Enter.\n");

    const lines = [];

    rl.on("line", (line) => {
      if (line.trim().toUpperCase() === "FIN") {
        const raw = lines.join("\n").trim();
        if (!raw) {
          reject(new Error("No JSON was pasted."));
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(new Error(`Invalid JSON: ${error.message}`));
        }
        return;
      }
      lines.push(line);
    });
  });

const normalizeProject = (input, projects) => {
  const title = String(input.title || "").trim();
  if (!title) throw new Error("Project title is required.");

  const existingSlugs = new Set(projects.map((p) => p.slug).filter(Boolean));
  const existingIds = new Set(projects.map((p) => p.id).filter(Boolean));
  const baseSlug = slugify(input.slug || title);
  if (!baseSlug) throw new Error("Could not generate slug from project title.");

  const slug = ensureUnique(baseSlug, existingSlugs);
  const id = ensureUnique(input.id || `p-${slug}`, existingIds);
  const year = Number.parseInt(input.year, 10);
  if (!Number.isFinite(year)) throw new Error("Project year must be a number.");

  const category = input.category || "fiction";
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Invalid category \"${category}\". Use one of: ${CATEGORIES.join(", ")}`);
  }

  return {
    id,
    slug,
    category,
    title,
    year,
    type: {
      es: input.type?.es || input.type_es || "",
      en: input.type?.en || input.type_en || "",
    },
    director: input.director || "",
    production_company: input.production_company || "",
    format: input.format || "",
    synopsis: {
      es: input.synopsis?.es || input.synopsis_es || "",
      en: input.synopsis?.en || input.synopsis_en || "",
    },
    cover: input.cover || "",
    poster: input.poster || "",
    preview_url: input.preview_url || "",
    stills: Array.isArray(input.stills) ? input.stills.filter(Boolean) : splitUrls(input.stills),
    bts: Array.isArray(input.bts) ? input.bts.filter(Boolean) : splitUrls(input.bts),
    recognitions: normalizeRecognitionsInput(input.recognitions),
    external_link: input.external_link || "",
  };
};

const insertProject = (content, project, atBeginning = true) => {
  const projects = Array.isArray(content.projects) ? content.projects : [];
  return {
    ...content,
    projects: atBeginning ? [project, ...projects] : [...projects, project],
  };
};

const runPostCreateFlow = async (project) => {
  console.log("\nOptional checks and deploy workflow:");

  const shouldBuild = await ask("Run production build now? y/n", "y");
  if (shouldBuild.toLowerCase().startsWith("y")) {
    run("npm run build");
  }

  const shouldStart = await ask("Open local preview server in a new PowerShell window? y/n", "y");
  if (shouldStart.toLowerCase().startsWith("y")) {
    startLocalServer();
    console.log("\nLocal server starting in a new PowerShell window.");
    console.log("Review these pages in the browser:");
    console.log("http://localhost:3000/work");
    console.log(`http://localhost:3000/project/${project.slug}`);
    await ask("When you have reviewed it locally, type OK and press Enter", "OK");
  }

  const shouldPush = await ask("Commit content.json and push to GitHub for Vercel deploy? y/n", "n");
  if (shouldPush.toLowerCase().startsWith("y")) {
    run("git status --short");
    run("git add frontend/src/data/content.json");
    run(`git commit -m "add project ${project.slug}"`);
    run("git push");
    console.log("\nPushed to GitHub. Vercel should deploy automatically.");
  } else {
    console.log("\nSkipped GitHub push.");
    console.log("When ready, run:");
    console.log("git add frontend/src/data/content.json");
    console.log(`git commit -m "add project ${project.slug}"`);
    console.log("git push");
  }
};

(async () => {
  try {
    console.log("\nAdd a new project to src/data/content.json\n");

    const content = readContent();
    const projects = Array.isArray(content.projects) ? content.projects : [];
    let project;
    let atBeginning = true;

    if (USE_PASTE) {
      const input = await readPastedJson();
      project = normalizeProject(input, projects);
      atBeginning = input.position !== "end";
    } else {
      const title = await ask("Title");
      if (!title) throw new Error("Title is required.");

      const defaultSlug = slugify(title);
      const existingSlugs = new Set(projects.map((p) => p.slug).filter(Boolean));
      const existingIds = new Set(projects.map((p) => p.id).filter(Boolean));

      const slug = ensureUnique(await ask("Slug", defaultSlug), existingSlugs);
      const id = ensureUnique(`p-${slug}`, existingIds);

      const yearRaw = await ask("Year", String(new Date().getFullYear()));
      const year = Number.parseInt(yearRaw, 10);
      if (!Number.isFinite(year)) throw new Error("Year must be a number.");

      let category = await ask(`Category [${CATEGORIES.join(" | ")}]`, "fiction");
      while (!CATEGORIES.includes(category)) {
        console.log(`Invalid category. Use one of: ${CATEGORIES.join(", ")}`);
        category = await ask(`Category [${CATEGORIES.join(" | ")}]`, "fiction");
      }

      const typeEs = await ask("Type ES", "Cortometraje");
      const typeEn = await ask("Type EN", "Short Film");
      const director = await ask("Director(s)");
      const productionCompany = await ask("Production company (optional)");
      const format = await ask("Format details", "");
      const synopsisEs = await ask("Synopsis ES");
      const synopsisEn = await ask("Synopsis EN");
      const cover = await ask("Cover image URL");
      const poster = await ask("Poster image URL (optional)");
      const previewUrl = await ask("Video embed / preview URL (Vimeo or YouTube)");
      const stills = splitUrls(await ask("Still image URLs separated by commas"));
      const bts = splitUrls(await ask("BTS image URLs separated by commas (optional)"));
      const externalLink = await ask("External link (optional)");
      const position = await ask("Add at beginning? y/n", "y");
      atBeginning = position.toLowerCase().startsWith("y");

      project = {
        id,
        slug,
        category,
        title,
        year,
        type: { es: typeEs, en: typeEn },
        director,
        production_company: productionCompany,
        format,
        synopsis: { es: synopsisEs, en: synopsisEn },
        cover,
        poster,
        preview_url: previewUrl,
        stills,
        bts,
        external_link: externalLink,
      };
    }

    writeContent(insertProject(content, project, atBeginning));

    JSON.parse(fs.readFileSync(CONTENT_PATH, "utf8"));

    console.log("\nProject added successfully.");
    console.log(`ID: ${project.id}`);
    console.log(`Slug: ${project.slug}`);
    console.log(`URL: /project/${project.slug}`);
    await runPostCreateFlow(project);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
})();
