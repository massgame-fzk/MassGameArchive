export type GroupName = "太陽" | "月" | "赤" | "白" | "未整理" | "不明";

export type YearRecord = {
  year: number;
  label: string;
  groups: GroupName[];
  summary: string;
  source: string;
  sourceUrl: string;
  verified: boolean;
  lastChecked: string;
};

export type MusicEntry = {
  year: number;
  group: GroupName;
  legacyGroup: "Red" | "White";
  scene: string;
  title: string;
  artist: string;
  source: string;
  sourceUrl: string;
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
