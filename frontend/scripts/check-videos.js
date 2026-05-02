#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Validates every Vimeo URL in src/data/content.json is publicly embeddable.
 * Uses Vimeo's oEmbed endpoint, which only returns 200 when the video is
 * Public AND embed = Anywhere (or matches the requesting domain).
 *
 * Usage:  yarn check:videos
 */

const fs = require("fs");
const path = require("path");

const CONTENT_PATH = path.join(__dirname, "..", "src", "data", "content.json");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const isVimeo = (url) => /vimeo\.com/.test(String(url || ""));
const isYoutube = (url) => /youtube\.com|youtu\.be/.test(String(url || ""));

const extractVimeoId = (url) => {
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

const collect = (content) => {
  const items = [];
  if (content.site?.showreel_url) {
    items.push({ label: "Showreel", url: content.site.showreel_url });
  }
  for (const p of content.projects || []) {
    if (p.preview_url) {
      items.push({ label: `${p.title} · preview`, url: p.preview_url, slug: p.slug });
    }
    if (p.cover && (isVimeo(p.cover) || isYoutube(p.cover))) {
      items.push({ label: `${p.title} · cover`, url: p.cover, slug: p.slug });
    }
  }
  return items;
};

const checkVimeo = async (url) => {
  const id = extractVimeoId(url);
  if (!id) return { ok: false, reason: "no-id" };
  const oembed = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`;
  try {
    const res = await fetch(oembed, { redirect: "follow" });
    if (res.status === 200) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, title: data.title, id };
    }
    if (res.status === 403) {
      return {
        ok: false,
        id,
        reason: "embed-restricted",
        hint: `Set Privacy=Public AND Embed=Anywhere at https://vimeo.com/manage/videos/${id}/privacy`,
      };
    }
    if (res.status === 404) {
      return { ok: false, id, reason: "not-found", hint: "Check the video ID" };
    }
    return { ok: false, id, reason: `http-${res.status}` };
  } catch (e) {
    return { ok: false, reason: "network", error: e.message };
  }
};

const checkYoutube = async (url) => {
  // YouTube oEmbed always succeeds when the video is public.
  const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  try {
    const res = await fetch(oembed);
    if (res.status === 200) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, title: data.title };
    }
    return { ok: false, reason: `http-${res.status}` };
  } catch (e) {
    return { ok: false, reason: "network", error: e.message };
  }
};

(async () => {
  if (!fs.existsSync(CONTENT_PATH)) {
    console.error(`${RED}content.json not found at ${CONTENT_PATH}${RESET}`);
    process.exit(2);
  }
  const content = JSON.parse(fs.readFileSync(CONTENT_PATH, "utf8"));
  const items = collect(content);

  if (items.length === 0) {
    console.log(`${YELLOW}No videos to check.${RESET}`);
    process.exit(0);
  }

  console.log(`${BOLD}Checking ${items.length} video URL(s) from content.json${RESET}\n`);
  let failed = 0;

  for (const it of items) {
    const isV = isVimeo(it.url);
    const isY = isYoutube(it.url);
    const result = isV
      ? await checkVimeo(it.url)
      : isY
        ? await checkYoutube(it.url)
        : { ok: false, reason: "unsupported-host" };

    const provider = isV ? "Vimeo  " : isY ? "YouTube" : "?      ";

    if (result.ok) {
      console.log(`  ${GREEN}✔${RESET}  [${provider}] ${it.label}  ${DIM}${it.url}${RESET}`);
    } else {
      failed += 1;
      console.log(`  ${RED}✘${RESET}  [${provider}] ${it.label}  ${DIM}${it.url}${RESET}`);
      console.log(`     ${RED}reason:${RESET} ${result.reason}${result.error ? ` (${result.error})` : ""}`);
      if (result.hint) console.log(`     ${YELLOW}fix:${RESET} ${result.hint}`);
    }
  }

  console.log("");
  if (failed === 0) {
    console.log(`${GREEN}${BOLD}All videos are publicly embeddable. Ready to deploy.${RESET}`);
    process.exit(0);
  } else {
    console.log(
      `${RED}${BOLD}${failed} video(s) failed.${RESET} Fix Vimeo privacy (Public + Embed Anywhere) for the URLs above before deploying.`
    );
    process.exit(1);
  }
})();
