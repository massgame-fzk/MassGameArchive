import type { MusicEntry, MusicRecord, MusicScene } from "../data/types";

export const insightScenes: MusicScene[] = ["入場", "一部", "インター", "二部", "三部", "退場"];
const collator = new Intl.Collator("ja", { sensitivity: "base", numeric: true });
const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase("ja").replace(/\s+/g, " ").trim();
// Only explicit, unambiguous spacing variants are merged beyond case/width.
const artistAliases = new Map([
  ["dragon force", "dragonforce"],
  ["white snake", "whitesnake"],
  ["fabredrive", "fabre drive"],
]);
const canonicalNames = new Map([
  ["dragonforce", "DragonForce"], ["whitesnake", "Whitesnake"],
  ["we the kings", "We The Kings"], ["boys like girls", "Boys Like Girls"],
  ["simple plan", "Simple Plan"], ["fair warning", "Fair Warning"],
  ["gamma ray", "Gamma Ray"], ["ashes remain", "Ashes Remain"],
]);
export const artistKey = (name: string) => artistAliases.get(normalize(name)) ?? normalize(name);
const slotKey = (entry: Pick<MusicEntry, "year" | "group" | "scene">) => `${entry.year}|${entry.group}|${entry.scene}`;

export type Adoption = { year: number; group: string; scene: MusicScene; titles: string[] };
export type ArtistInsight = {
  id: string; name: string; count: number; years: number[]; firstYear: number; lastYear: number;
  sceneCounts: number[]; sunCount: number; moonCount: number; adoptions: Adoption[];
};
export type ReturningSong = {
  title: string; artist: string; years: number[]; count: number;
  appearances: { year: number; group: string; scene: MusicScene }[];
};
export type MusicInsights = ReturnType<typeof buildMusicInsights>;

export function rankArtists(artists: ArtistInsight[], metric: "count" | "years" = "count") {
  const value = (artist: ArtistInsight) => metric === "years" ? artist.years.length : artist.count;
  const sorted = [...artists].sort((a, b) => value(b) - value(a) || collator.compare(a.name, b.name));
  return sorted.map((artist) => ({
    ...artist,
    rank: sorted.findIndex((candidate) => value(candidate) === value(artist)) + 1,
    value: value(artist),
  }));
}

export function buildMusicInsights(entries: MusicEntry[], records: MusicRecord[]) {
  const known = entries.filter((entry) => entry.verified && entry.status === "known" && entry.title && entry.artist);
  const artistGroups = new Map<string, MusicEntry[]>();
  const songGroups = new Map<string, MusicEntry[]>();
  for (const entry of known) {
    const id = artistKey(entry.artist);
    if (!artistGroups.has(id)) artistGroups.set(id, []);
    artistGroups.get(id)!.push(entry);
    const songId = `${id}|${normalize(entry.title)}`;
    if (!songGroups.has(songId)) songGroups.set(songId, []);
    songGroups.get(songId)!.push(entry);
  }
  const artists: ArtistInsight[] = [...artistGroups].map(([id, tracks]) => {
    const slots = new Map<string, Adoption>();
    for (const track of tracks) {
      const key = slotKey(track);
      if (!slots.has(key)) slots.set(key, { year: track.year, group: track.group, scene: track.scene, titles: [] });
      const titles = slots.get(key)!.titles;
      if (!titles.includes(track.title)) titles.push(track.title);
    }
    const adoptions = [...slots.values()].sort((a, b) => b.year - a.year || collator.compare(a.group, b.group) || insightScenes.indexOf(a.scene) - insightScenes.indexOf(b.scene));
    const years = [...new Set(adoptions.map((entry) => entry.year))].sort((a, b) => a - b);
    return {
      id, name: canonicalNames.get(id) ?? tracks[0].artist,
      count: adoptions.length, years, firstYear: years[0], lastYear: years.at(-1)!,
      sceneCounts: insightScenes.map((scene) => adoptions.filter((entry) => entry.scene === scene).length),
      sunCount: adoptions.filter((entry) => entry.group === "太陽" || entry.group === "赤").length,
      moonCount: adoptions.filter((entry) => entry.group === "月" || entry.group === "白").length,
      adoptions,
    };
  });
  const artistNames = new Map(artists.map((artist) => [artist.id, artist.name]));
  const returningSongs: ReturningSong[] = [...songGroups.values()].map((tracks) => {
    const appearances = [...new Map(tracks.map((track) => [slotKey(track), { year: track.year, group: track.group, scene: track.scene }])).values()]
      .sort((a, b) => a.year - b.year || collator.compare(a.group, b.group));
    const years = [...new Set(appearances.map((entry) => entry.year))];
    return { title: tracks[0].title, artist: artistNames.get(artistKey(tracks[0].artist))!, years, count: appearances.length, appearances };
  }).filter((song) => song.years.length > 1)
    .sort((a, b) => b.years.length - a.years.length || (b.years.at(-1)! - b.years[0]) - (a.years.at(-1)! - a.years[0]) || collator.compare(a.title, b.title));

  const knownYears = [...new Set(known.map((entry) => entry.year))].sort((a, b) => a - b);
  const decades = [...new Set(knownYears.map((year) => Math.floor(year / 10) * 10))].map((decade) => {
    const decadeArtists = artists.map((artist) => {
      const adoptions = artist.adoptions.filter((entry) => entry.year >= decade && entry.year < decade + 10);
      return { ...artist, count: adoptions.length, years: [...new Set(adoptions.map((entry) => entry.year))] };
    }).filter((artist) => artist.count > 0);
    const firstYear = Math.min(...knownYears.filter((year) => year >= decade && year < decade + 10));
    const lastYear = Math.max(...knownYears.filter((year) => year >= decade && year < decade + 10));
    const top = rankArtists(decadeArtists).filter((artist) => artist.rank <= 3);
    return { decade, firstYear, lastYear, top, trackCount: known.filter((entry) => entry.year >= decade && entry.year < decade + 10).length };
  });
  const coverage = records.filter((record) => record.verified).map((record) => ({
    year: record.year,
    total: insightScenes.length,
    known: insightScenes.filter((scene) => known.some((entry) => entry.year === record.year && entry.group === record.group && entry.scene === scene)).length,
  }));
  const knownSlots = coverage.reduce((sum, record) => sum + record.known, 0);
  const totalSlots = coverage.reduce((sum, record) => sum + record.total, 0);
  const novelty = decades.map(({ decade }) => {
    let first = 0;
    let returning = 0;
    // First appearance is relative to the complete verified archive, never the current decade.
    for (const tracks of songGroups.values()) {
      const firstYear = Math.min(...tracks.map((track) => track.year));
      const slots = new Map(tracks.map((track) => [slotKey(track), track]));
      for (const track of slots.values()) {
        if (track.year < decade || track.year >= decade + 10) continue;
        if (track.year === firstYear) first++;
        else returning++;
      }
    }
    return { decade, first, returning, total: first + returning };
  });
  const longevity = [...artists].filter((artist) => artist.years.length > 1)
    .sort((a, b) => (b.lastYear - b.firstYear) - (a.lastYear - a.firstYear) || b.years.length - a.years.length || collator.compare(a.name, b.name))
    .slice(0, 5);
  return {
    trackCount: known.length, uniqueTrackCount: songGroups.size, knownYears, artists,
    knownSlots, totalSlots, decades, returningSongs, longevity, novelty,
    sunTotal: artists.reduce((sum, artist) => sum + artist.sunCount, 0),
    moonTotal: artists.reduce((sum, artist) => sum + artist.moonCount, 0),
  };
}
