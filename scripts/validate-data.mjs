import fs from "node:fs";

const expectedScenes = ["入場", "一部", "インター", "二部", "三部", "退場"];
const allowedScenes = new Set(expectedScenes);
const allowedGroups = new Set(["太陽", "月", "赤", "白", "未整理", "不明"]);

const music = JSON.parse(fs.readFileSync("src/data/music.json", "utf8"));

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(message);
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
      if (!track.title || !track.artist || !track.source || !track.sourceUrl) {
        fail(`${label} ${scene.scene}: track is missing title, artist, source, or sourceUrl`);
      }
    }
  }
}

if (failures > 0) {
  console.error(`Data validation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log(`Data validation passed for ${music.length} music records.`);
