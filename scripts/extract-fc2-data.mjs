import fs from "node:fs";

const musicHtml = fs.readFileSync("sources/fc2-utf8/massgamemusic.html", "utf8");

function cleanEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function strip(cell) {
  return cleanEntities(cell)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const music = [];
const tables = [...musicHtml.matchAll(/<table[\s\S]*?<\/table>/gi)].map((match) => match[0]);
for (const table of tables) {
  const cells = [...table.matchAll(/<td[\s\S]*?<\/td>/gi)].map((match) => strip(match[0]));
  if (cells.length < 6) continue;
  const year = Number((cells[1].join(" ").match(/\d{4}/) || [])[0]);
  if (!year) continue;
  const scenes = cells[4];
  const sides = [
    { legacyGroup: "Red", values: cells[3] },
    { legacyGroup: "White", values: cells[5] },
  ];
  for (const side of sides) {
    for (let i = 0; i < scenes.length; i++) {
      const title = side.values[i * 2];
      const artist = side.values[i * 2 + 1];
      if (!title && !artist) continue;
      music.push({
        year,
        group: side.legacyGroup === "Red" ? (year >= 2006 ? "太陽" : "赤") : (year >= 2006 ? "月" : "白"),
        legacyGroup: side.legacyGroup,
        scene: scenes[i],
        title: title || "不明",
        artist: artist || "不明",
        source: "FC2「マスゲームの曲」",
        sourceUrl: "http://huzokumassgame.web.fc2.com/massgamemusic.html",
        verified: true,
      });
    }
  }
}

fs.writeFileSync("src/data/music.json", `${JSON.stringify(music, null, 2)}\n`);
console.log(`Extracted ${music.length} music entries.`);
