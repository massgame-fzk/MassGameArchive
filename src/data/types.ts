export type GroupName = "太陽" | "月" | "赤" | "白" | "未整理" | "不明";
export type MusicScene = "入場" | "一部" | "インター" | "二部" | "三部" | "退場";

export type YearRecord = {
  year: number;
  label: string;
  groups: GroupName[];
  summary: string;
  eventDate?: string;
  source: string;
  sourceUrl: string;
  verified: boolean;
  lastChecked: string;
};

export type MusicTrack = {
  title?: string | null;
  artist?: string | null;
  source: string;
  sourceUrl: string;
  verified: boolean;
  sourceScene?: string;
  status?: "known" | "unknown";
};

export type MusicSceneSlot = {
  scene: MusicScene;
  tracks: MusicTrack[];
};

export type MusicRecord = {
  year: number;
  group: GroupName;
  legacyGroup: "Red" | "White";
  scenes: MusicSceneSlot[];
  unassignedTracks?: MusicTrack[];
  verified: boolean;
};

export type MusicEntry = MusicTrack & {
  year: number;
  group: GroupName;
  legacyGroup: "Red" | "White";
  scene: MusicScene;
  title: string;
  artist: string;
  status: "known";
};

export type MusicSlotEntry = {
  year: number;
  group: GroupName;
  legacyGroup: "Red" | "White";
  scene: MusicScene;
  title: string;
  artist: string;
  status: "known" | "unknown";
  source?: string;
  sourceUrl?: string;
  verified: boolean;
};

export type MediaEntry = {
  label: string;
  kind: "youtube-playlist" | "youtube-video";
  url: string;
  source: string;
  sourceUrl: string;
  verified: boolean;
  note?: string;
};
