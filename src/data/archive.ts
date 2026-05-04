import musicData from "./music.json";
import yearsData from "./years.json";
import mediaData from "./media.json";
import type { MediaEntry, MusicEntry, MusicRecord, YearRecord } from "./types";

const allowedYoutubeHosts = new Set(["youtube.com", "www.youtube.com", "youtu.be"]);
const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const youtubePlaylistIdPattern = /^[A-Za-z0-9_-]+$/;

export const years = (yearsData as YearRecord[]).filter((entry) => entry.verified);
export const musicRecords = (musicData as MusicRecord[]).filter((entry) => entry.verified);
export const musicEntries = musicRecords.flatMap((record): MusicEntry[] =>
  record.scenes.flatMap((scene) =>
    scene.tracks
      .filter((track) => track.verified)
      .map((track) => ({
        ...track,
        year: record.year,
        group: record.group,
        legacyGroup: record.legacyGroup,
        scene: scene.scene,
      })),
  ),
);
export const mediaEntries = (mediaData as MediaEntry[]).filter(
  (entry) => entry.verified && isValidYoutubeEntry(entry),
);

function mediaMatchesYear(entry: MediaEntry, year: number) {
  const exactYear = entry.label.match(/^(\d{4})年度$/);
  if (exactYear) return Number(exactYear[1]) === year;

  const range = entry.label.match(/^(\d{4})-(\d{4})年度$/);
  if (range) {
    const first = Number(range[1]);
    const second = Number(range[2]);
    return year >= Math.min(first, second) && year <= Math.max(first, second);
  }

  const before = entry.label.match(/^(\d{4})年度以前$/);
  if (before) return year <= Number(before[1]);

  return entry.label.includes(String(year));
}

export function playlistId(url: string) {
  const parsed = parseYoutubeUrl(url);
  if (!parsed) return null;
  const id = parsed.searchParams.get("list");
  return id && youtubePlaylistIdPattern.test(id) ? id : null;
}

export function videoId(url: string) {
  const parsed = parseYoutubeUrl(url);
  if (!parsed) return null;
  if (parsed.hostname === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    return youtubeVideoIdPattern.test(id) ? id : null;
  }
  const id = parsed.searchParams.get("v");
  return id && youtubeVideoIdPattern.test(id) ? id : null;
}

function parseYoutubeUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !allowedYoutubeHosts.has(parsed.hostname)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isValidYoutubeEntry(entry: MediaEntry) {
  if (entry.kind === "youtube-playlist") return Boolean(playlistId(entry.url));
  if (entry.kind === "youtube-video") return Boolean(videoId(entry.url));
  return false;
}

export function youtubeEmbedUrl(entry: MediaEntry) {
  if (entry.kind === "youtube-playlist") {
    const id = playlistId(entry.url);
    return id ? `https://www.youtube.com/embed/videoseries?list=${id}` : "";
  }
  const id = videoId(entry.url);
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

export function entriesForYear(year: number) {
  return {
    year: years.find((entry) => entry.year === year),
    musicRecords: musicRecords.filter((entry) => entry.year === year),
    music: musicEntries.filter((entry) => entry.year === year),
    media: mediaEntries.filter((entry) => mediaMatchesYear(entry, year)),
  };
}
