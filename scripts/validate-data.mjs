import fs from "node:fs";

const expectedScenes = ["入場", "一部", "インター", "二部", "三部", "退場"];
const allowedScenes = new Set(expectedScenes);
const allowedGroups = new Set(["太陽", "月", "赤", "白", "未整理", "不明"]);
const allowedYoutubeHosts = new Set(["youtube.com", "www.youtube.com", "youtu.be"]);
const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const youtubePlaylistIdPattern = /^[A-Za-z0-9_-]+$/;

const music = JSON.parse(fs.readFileSync("src/data/music.json", "utf8"));
const media = JSON.parse(fs.readFileSync("src/data/media.json", "utf8"));

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(message);
}

function parseYoutubeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !allowedYoutubeHosts.has(parsed.hostname)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function playlistId(url) {
  const parsed = parseYoutubeUrl(url);
  if (!parsed) return null;
  const id = parsed.searchParams.get("list");
  return id && youtubePlaylistIdPattern.test(id) ? id : null;
}

function videoId(url) {
  const parsed = parseYoutubeUrl(url);
  if (!parsed) return null;
  if (parsed.hostname === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    return youtubeVideoIdPattern.test(id) ? id : null;
  }
  const id = parsed.searchParams.get("v");
  return id && youtubeVideoIdPattern.test(id) ? id : null;
}

for (const record of music) {
  const label = `${record.year} ${record.group}`;

  if (!allowedGroups.has(record.group)) {
    fail(`${label}: unknown group "${record.group}"`);
  }

  if (!Array.isArray(record.scenes)) {
    fail(`${label}: scenes must be an array`);
    continue;
  }

  const sceneNames = record.scenes.map((scene) => scene.scene);
  const missing = expectedScenes.filter((scene) => !sceneNames.includes(scene));
  const duplicate = sceneNames.filter((scene, index) => sceneNames.indexOf(scene) !== index);
  const unknown = sceneNames.filter((scene) => !allowedScenes.has(scene));

  if (missing.length > 0) {
    fail(`${label}: missing scenes ${missing.join(", ")}`);
  }

  if (duplicate.length > 0) {
    fail(`${label}: duplicate scenes ${[...new Set(duplicate)].join(", ")}`);
  }

  if (unknown.length > 0) {
    fail(`${label}: unknown scenes ${[...new Set(unknown)].join(", ")}`);
  }

  for (const scene of record.scenes) {
    if (!Array.isArray(scene.tracks)) {
      fail(`${label} ${scene.scene}: tracks must be an array`);
      continue;
    }

    for (const track of scene.tracks) {
      if (track.status === "unknown") {
        if (!track.source || !track.sourceUrl) {
          fail(`${label} ${scene.scene}: unknown track is missing source or sourceUrl`);
        }
        continue;
      }

      if (!track.title || !track.artist || !track.source || !track.sourceUrl) {
        fail(`${label} ${scene.scene}: track is missing title, artist, source, or sourceUrl`);
      }
    }
  }
}

for (const entry of media) {
  const label = entry.label || "(missing label)";

  if (entry.kind !== "youtube-playlist" && entry.kind !== "youtube-video") {
    fail(`${label}: unknown media kind "${entry.kind}"`);
    continue;
  }

  if (entry.kind === "youtube-playlist" && !playlistId(entry.url)) {
    fail(`${label}: playlist URL must be an HTTPS YouTube URL with a valid list parameter`);
  }

  if (entry.kind === "youtube-video" && !videoId(entry.url)) {
    fail(`${label}: video URL must be an HTTPS YouTube watch or youtu.be URL with a valid video id`);
  }
}

if (failures > 0) {
  console.error(`Data validation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log(`Data validation passed for ${music.length} music records and ${media.length} media entries.`);
