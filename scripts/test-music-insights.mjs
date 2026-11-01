import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { artistKey, buildMusicInsights, insightScenes, rankArtists } from "../src/lib/music-insights.ts";

const track = (overrides = {}) => ({
  year: 2000, group: "太陽", legacyGroup: "Red", scene: "一部", title: "Track A",
  artist: "Artist A", status: "known", verified: true, source: "private source", sourceUrl: "private URL", ...overrides,
});
const record = (year = 2000, group = "太陽") => ({ year, group, verified: true, scenes: insightScenes.map((scene) => ({ scene, tracks: [] })) });

test("artist adoption counts deduplicate a scene, preserve different groups and scenes, and merge explicit aliases", () => {
  const entries = [
    track({ artist: "DragonForce" }), track({ artist: "Dragon Force", title: "Track B" }),
    track({ artist: "Ｄｒａｇｏｎｆｏｒｃｅ", scene: "二部" }),
    track({ artist: "dragonforce", group: "月" }), track({ artist: "DragonForce", year: 2001 }),
    track({ artist: "Hidden", verified: false }), track({ artist: "Unknown", status: "unknown" }),
  ];
  const data = buildMusicInsights(entries, [record(), record(2000, "月"), record(2001)]);
  assert.equal(data.trackCount, 5);
  assert.equal(data.artists.length, 1);
  assert.equal(data.artists[0].count, 4);
  assert.deepEqual(data.artists[0].years, [2000, 2001]);
  assert.equal(data.artists[0].sceneCounts.reduce((sum, n) => sum + n, 0), 4);
  assert.equal(data.knownSlots, 4);
  assert.equal(data.totalSlots, 18);
  assert.equal(data.artists[0].sunCount, 3);
  assert.equal(data.artists[0].moonCount, 1);
  assert.equal(JSON.stringify(data).includes("private source"), false);
  assert.equal(JSON.stringify(data).includes("private URL"), false);
  assert.equal(artistKey("Different Artist"), "different artist");
});

test("rankings use competition ranks for ties, and years can change the order", () => {
  const data = buildMusicInsights([
    track({ artist: "B" }), track({ artist: "B", scene: "二部" }),
    track({ artist: "A" }), track({ artist: "A", year: 2001 }), track({ artist: "C" }),
  ], [record(), record(2001)]);
  assert.deepEqual(rankArtists(data.artists).map((artist) => [artist.name, artist.rank]), [["A", 1], ["B", 1], ["C", 3]]);
  assert.deepEqual(rankArtists(data.artists, "years").map((artist) => [artist.name, artist.value, artist.rank]), [["A", 2, 1], ["B", 1, 2], ["C", 1, 2]]);
});

test("returning songs require multiple years; versions and different artists stay separate", () => {
  const data = buildMusicInsights([
    track(), track({ title: "track a", year: 2006 }), track({ scene: "二部" }),
    track({ title: "Track A (Live)", year: 2007 }), track({ artist: "Another", year: 2008 }),
    track({ title: "Same year only" }), track({ title: "Same year only", scene: "退場" }),
  ], [record(), record(2006), record(2007), record(2008)]);
  assert.equal(data.returningSongs.length, 1);
  assert.deepEqual(data.returningSongs[0].years, [2000, 2006]);
  assert.equal(data.returningSongs[0].count, 3);
  assert.equal(data.uniqueTrackCount, 4);
});

test("novelty uses the full archive, deduplicates slots, and treats same-year first appearances equally", () => {
  const data = buildMusicInsights([
    track({ year: 1999 }), track({ year: 1999 }), track({ year: 1999, group: "月" }),
    track({ year: 2001 }), track({ year: 2001 }), track({ year: 2001, title: "New" }),
  ], [record(1999), record(1999, "月"), record(2001)]);
  assert.deepEqual(data.novelty, [
    { decade: 1990, first: 2, returning: 0, total: 2 },
    { decade: 2000, first: 1, returning: 1, total: 2 },
  ]);
});

test("real archive totals reconcile and contain only public aggregate fields", () => {
  const records = JSON.parse(fs.readFileSync(new URL("../src/data/music.json", import.meta.url), "utf8")).filter((item) => item.verified);
  const entries = records.flatMap((item) => item.scenes.flatMap((slot) => slot.tracks
    .filter((entry) => entry.verified && entry.status !== "unknown" && entry.title && entry.artist)
    .map((entry) => ({ ...entry, status: "known", year: item.year, group: item.group, scene: slot.scene }))));
  const data = buildMusicInsights(entries, records);
  assert.equal(data.trackCount, entries.length);
  assert.ok(data.knownSlots <= data.totalSlots);
  assert.equal(data.totalSlots, records.length * 6);
  assert.equal(data.novelty.reduce((sum, item) => sum + item.total, 0), new Set(entries.map((entry) => `${artistKey(entry.artist)}|${entry.title.normalize("NFKC").toLowerCase().trim()}|${entry.year}|${entry.group}|${entry.scene}`)).size);
  assert.ok(data.returningSongs.every((song) => song.years.length > 1));
  assert.ok(data.artists.every((artist) => artist.count === artist.adoptions.length && artist.sceneCounts.reduce((sum, n) => sum + n, 0) === artist.count));
  assert.equal(JSON.stringify(data).includes('"source"'), false);
  assert.equal(JSON.stringify(data).includes('"sourceUrl"'), false);
});
