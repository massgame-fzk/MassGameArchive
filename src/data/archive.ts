import musicData from "./music.json";
import yearsData from "./years.json";
import mediaData from "./media.json";
import type { MediaEntry, MusicEntry, YearRecord } from "./types";

export const years = (yearsData as YearRecord[]).filter((entry) => entry.verified);
export const musicEntries = (musicData as MusicEntry[]).filter((entry) => entry.verified);
export const mediaEntries = (mediaData as MediaEntry[]).filter(
  (entry) => entry.verified && (entry.kind === "youtube-playlist" || entry.kind === "youtube-video"),
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
  return new URL(url).searchParams.get("list");
}

export function videoId(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname === "youtu.be") return parsed.pathname.replace("/", "");
  return parsed.searchParams.get("v");
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
    music: musicEntries.filter((entry) => entry.year === year),
    media: mediaEntries.filter((entry) => mediaMatchesYear(entry, year)),
  };
}
