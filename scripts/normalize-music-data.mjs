import fs from "node:fs";

const musicPath = "src/data/music.json";
const expectedScenes = ["入場", "一部", "インター", "二部", "三部", "退場"];

function normalizeScene(scene) {
  if (scene === "インターバル") return "インター";
  return scene;
}

function isLegacyFlatEntry(entry) {
  return "scene" in entry && "title" in entry && "artist" in entry;
}

const input = JSON.parse(fs.readFileSync(musicPath, "utf8"));
if (!input.every(isLegacyFlatEntry)) {
  if (input.every((entry) => Array.isArray(entry.scenes))) {
    console.log(`${musicPath} is already normalized.`);
    process.exit(0);
  }
  console.error(`${musicPath} has an unknown shape.`);
  process.exit(1);
}

const recordsByKey = new Map();

for (const entry of input) {
  const key = `${entry.year}\t${entry.group}\t${entry.legacyGroup}`;
  if (!recordsByKey.has(key)) {
    recordsByKey.set(key, {
      year: entry.year,
      group: entry.group,
      legacyGroup: entry.legacyGroup,
      scenes: expectedScenes.map((scene) => ({ scene, tracks: [] })),
      verified: true,
    });
  }

  const record = recordsByKey.get(key);
  const sceneName = normalizeScene(entry.scene);
  const track = {
    title: entry.title,
    artist: entry.artist,
    source: entry.source,
    sourceUrl: entry.sourceUrl,
    verified: entry.verified,
  };

  const slot = record.scenes.find((scene) => scene.scene === sceneName);
  if (slot) {
    slot.tracks.push(track);
  } else {
    record.unassignedTracks ??= [];
    record.unassignedTracks.push({ ...track, sourceScene: entry.scene });
  }
}

const records = [...recordsByKey.values()].sort(
  (a, b) => b.year - a.year || a.group.localeCompare(b.group, "ja"),
);

fs.writeFileSync(musicPath, `${JSON.stringify(records, null, 2)}\n`);
console.log(`Normalized ${input.length} music entries into ${records.length} records.`);
