import musicData from "./music.json";
import yearsData from "./years.json";
import mediaData from "./media.json";
import type { MediaEntry, MusicEntry, MusicRecord, MusicSlotEntry, YearRecord } from "./types";

const expectedMusicScenes = ["入場", "一部", "インター", "二部", "三部", "退場"] as const;
const allowedYoutubeHosts = new Set(["youtube.com", "www.youtube.com", "youtu.be"]);
const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const youtubePlaylistIdPattern = /^[A-Za-z0-9_-]+$/;

export const years = (yearsData as YearRecord[]).filter((entry) => entry.verified);
export const musicRecords = (musicData as MusicRecord[]).filter((entry) => entry.verified);
export const musicEntries = musicRecords.flatMap((record): MusicEntry[] =>
  record.scenes.flatMap((scene) =>
    scene.tracks
      .filter((track) => isKnownTrack(track))
      .map((track) => ({
        ...track,
        title: track.title ?? "",
        artist: track.artist ?? "",
        status: "known" as const,
        year: record.year,
        group: record.group,
        legacyGroup: record.legacyGroup,
        scene: scene.scene,
      })),
  ),
);
export const musicSlotEntries = musicRecords.flatMap((record): MusicSlotEntry[] =>
  expectedMusicScenes.flatMap((expectedScene): MusicSlotEntry[] => {
    const slot = record.scenes.find((item) => item.scene === expectedScene);
    const tracks = slot?.tracks ?? [];
    const visibleTracks = tracks.filter((track) => track.verified);

    if (visibleTracks.length === 0) {
      return [
        {
          year: record.year,
          group: record.group,
          legacyGroup: record.legacyGroup,
          scene: expectedScene,
          title: "調査中",
          artist: "調査中",
          status: "unknown",
          verified: true,
        },
      ];
    }

    return visibleTracks.map((track) => {
      const known = isKnownTrack(track);
      return {
        year: record.year,
        group: record.group,
        legacyGroup: record.legacyGroup,
        scene: expectedScene,
        title: known ? (track.title ?? "") : (track.title ?? "調査中"),
        artist: known ? (track.artist ?? "") : (track.artist ?? "調査中"),
        status: known ? "known" : "unknown",
        source: track.source,
        sourceUrl: track.sourceUrl,
        verified: track.verified,
      };
    });
  }),
);
export const mediaEntries = (mediaData as MediaEntry[]).filter(
  (entry) => entry.verified && isValidYoutubeEntry(entry),
);

function isKnownTrack(track: MusicRecord["scenes"][number]["tracks"][number]) {
  return track.verified && track.status !== "unknown" && Boolean(track.title) && Boolean(track.artist);
}

export function formatEventDate(date?: string) {
  if (!date) return "";
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return date;

  const [, year, month, day] = match;
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

export function missingMusicComment(year: number) {
  const records = musicRecords.filter((entry) => entry.year === year);
  if (records.length === 0) return "曲データ未整理";

  const missingByGroup = records
    .map((record) => {
      const missingScenes = expectedMusicScenes.filter((scene) => {
        const slot = record.scenes.find((item) => item.scene === scene);
        return !slot || !slot.tracks.some((track) => isKnownTrack(track));
      });

      return {
        group: record.group,
        missingScenes,
      };
    })
    .filter((entry) => entry.missingScenes.length > 0);

  if (missingByGroup.length === 0) return "";

  const details = missingByGroup
    .map((entry) => `${entry.group}: ${entry.missingScenes.join("、")}`)
    .join(" / ");

  return `曲データ不足: ${details}`;
}

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
  const yearRecord = years.find((entry) => entry.year === year);

  return {
    year: yearRecord,
    musicRecords: musicRecords.filter((entry) => entry.year === year),
    music: musicEntries.filter((entry) => entry.year === year),
    musicSlots: musicSlotEntries.filter((entry) => entry.year === year),
    media: mediaEntries.filter((entry) => mediaMatchesYear(entry, year)),
    eventDateLabel: formatEventDate(yearRecord?.eventDate),
    missingMusicComment: missingMusicComment(year),
  };
}
