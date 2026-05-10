import crypto from "node:crypto";
import { openAsBlob } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const defaultPlaylistUrl =
  "https://youtube.com/playlist?list=PLnOxQXsNjVVbfVgEZQaWa_GFc8ErPkqZ4&si=nbe6aITsN-ajnNx_";
const workDir = "tmp/music-recognition";
const sampleDir = path.join(workDir, "samples");
const rawDir = path.join(workDir, "raw");
const defaultMusicDataPath = "src/data/music.json";

function parseArgs(argv) {
  const args = {
    provider: "audd",
    playlistUrl: defaultPlaylistUrl,
    limit: null,
    startIndex: 1,
    sampleLength: 12,
    // 5 sample points expressed as ratios of the video duration.
    // For a 240s video this is 48, 84, 120, 156, 192s. Override with
    // --offsets (mix of ratios 0-1 and absolute seconds) or
    // --offset-percents (whole-number percents like 20,35,50,65,80).
    offsets: [0.2, 0.35, 0.5, 0.65, 0.8],
    skipDownload: false,
    metadataOnly: false,
    filterUnknown: false,
    includeEmptyScenes: false,
    musicDataPath: defaultMusicDataPath,
    hummingMinScore: 0.9,
    topN: 5,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--provider") {
      args.provider = next;
      i += 1;
    } else if (arg === "--playlist-url") {
      args.playlistUrl = next;
      i += 1;
    } else if (arg === "--limit") {
      args.limit = Number(next);
      i += 1;
    } else if (arg === "--start-index") {
      args.startIndex = Number(next);
      i += 1;
    } else if (arg === "--sample-length") {
      args.sampleLength = Number(next);
      i += 1;
    } else if (arg === "--offsets") {
      args.offsets = next.split(",").map((value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) throw new Error(`Invalid offset: ${value}`);
        return numeric > 0 && numeric < 1 ? numeric : Math.max(0, numeric);
      });
      i += 1;
    } else if (arg === "--offset-percents") {
      args.offsets = next.split(",").map((value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0 || numeric >= 100) {
          throw new Error(`Invalid percent: ${value}. Use whole numbers between 0 and 100.`);
        }
        return numeric / 100;
      });
      i += 1;
    } else if (arg === "--skip-download") {
      args.skipDownload = true;
    } else if (arg === "--metadata-only") {
      args.metadataOnly = true;
    } else if (arg === "--filter-unknown") {
      args.filterUnknown = true;
    } else if (arg === "--include-empty-scenes") {
      args.includeEmptyScenes = true;
    } else if (arg === "--music-data") {
      args.musicDataPath = next;
      i += 1;
    } else if (arg === "--humming-min-score") {
      args.hummingMinScore = Number(next);
      i += 1;
    } else if (arg === "--top-n") {
      args.topN = Number(next);
      i += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!["audd", "acrcloud"].includes(args.provider)) {
    throw new Error("--provider must be audd or acrcloud");
  }
  if (!Number.isInteger(args.startIndex) || args.startIndex < 1) {
    throw new Error("--start-index must be a positive integer");
  }
  if (args.limit !== null && (!Number.isInteger(args.limit) || args.limit < 1)) {
    throw new Error("--limit must be a positive integer");
  }
  if (!Number.isFinite(args.sampleLength) || args.sampleLength <= 0 || args.sampleLength > 12) {
    throw new Error("--sample-length must be 1-12 seconds");
  }
  if (!Number.isFinite(args.hummingMinScore) || args.hummingMinScore < 0 || args.hummingMinScore > 1) {
    throw new Error("--humming-min-score must be between 0 and 1");
  }
  if (!Number.isInteger(args.topN) || args.topN < 1) {
    throw new Error("--top-n must be a positive integer");
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/recognize-youtube-playlist-music.mjs --provider audd [options]
  node scripts/recognize-youtube-playlist-music.mjs --provider acrcloud [options]

Options:
  --playlist-url URL        YouTube playlist URL. Defaults to the main MassGame playlist.
  --provider NAME           audd or acrcloud. Default: audd
  --limit N                 Process only N videos.
  --start-index N           1-based playlist item index. Default: 1
  --offsets LIST            Comma-separated sample starts. Each value is either an
                            absolute seconds count (>=1) or a ratio of the video
                            duration (0 < x < 1). Default: 0.2,0.35,0.5,0.65,0.8
                            (= 20,35,50,65,80% of each video).
  --offset-percents LIST    Comma-separated whole-number percentages (e.g.
                            20,35,50,65,80). Equivalent to --offsets with values
                            divided by 100; provided for readability.
  --sample-length N         Seconds per sample. Max 12. Default: 12
  --skip-download           Reuse existing sample files.
  --metadata-only           Only save playlist metadata; no recognition calls.
  --filter-unknown          Process only videos whose (year, group, [scene]) has at
                            least one track with status="unknown" in the music data
                            file. When the video title clearly indicates a scene
                            (opening/1st/inter/2nd/3rd/ending), matching is scoped
                            to that scene; otherwise it falls back to (year, group).
  --include-empty-scenes    Treat scenes with empty tracks ([]) as "needs filling"
                            in addition to status:"unknown". Recommended when the
                            playlist covers years where music.json has blanks
                            stored as empty arrays rather than explicit unknowns.
  --music-data PATH         Path to music.json. Default: src/data/music.json
  --humming-min-score N     Minimum humming score (0-1) to consider for bestMatch
                            fallback. Default: 0.9
  --top-n N                 How many top music/humming candidates to keep per sample.
                            Default: 5
  --dry-run                 Skip recognition API calls; produce a report from any
                            existing raw responses already saved under tmp/.../raw.

Environment:
  AUDD_API_TOKEN            Required for --provider audd
  ACRCLOUD_HOST             Required for --provider acrcloud
  ACRCLOUD_ACCESS_KEY       Required for --provider acrcloud
  ACRCLOUD_ACCESS_SECRET    Required for --provider acrcloud
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await fs.mkdir(sampleDir, { recursive: true });
  await fs.mkdir(rawDir, { recursive: true });

  if (!args.dryRun) requireCommand("yt-dlp");
  if (!args.metadataOnly && !args.dryRun) {
    if (!args.skipDownload) requireCommand("ffmpeg");
    requireProviderEnv(args.provider);
  }

  const playlist = await loadPlaylist(args.playlistUrl, args.dryRun);
  if (args.metadataOnly) {
    await writePlaylistSummary(playlist);
    console.log(`Playlist: ${playlist.title} (${playlist.entries.length} videos)`);
    console.log(`Wrote ${path.join(workDir, "playlist-summary.md")}`);
    return;
  }

  let musicData = null;
  if (args.filterUnknown) {
    musicData = await loadMusicData(args.musicDataPath);
    console.log(`Loaded music data: ${args.musicDataPath} (${musicData.length} year-group records)`);
  }

  const allEntries = playlist.entries.filter((entry) => entry?.id && entry?.url);
  const slicedEntries = allEntries.slice(
    args.startIndex - 1,
    args.limit === null ? undefined : args.startIndex - 1 + args.limit,
  );

  const queue = [];
  const skipped = [];
  for (const [entryOffset, entry] of slicedEntries.entries()) {
    const playlistIndex = args.startIndex + entryOffset;
    const parsed = parseVideoTitle(entry.title ?? "");
    const unknownInfo = args.filterUnknown
      ? evaluateUnknownStatus(parsed, musicData, args.includeEmptyScenes)
      : null;

    if (args.filterUnknown && (!unknownInfo || !unknownInfo.hasUnknown)) {
      skipped.push({
        playlistIndex,
        videoId: entry.id,
        title: entry.title,
        url: entry.url,
        parsed,
        reason: unknownInfo?.reason ?? "no-parse",
      });
      continue;
    }

    queue.push({ entry, playlistIndex, parsed, unknownInfo });
  }

  const results = [];
  console.log(`Playlist: ${playlist.title} (${playlist.entries.length} videos)`);
  console.log(
    `Processing ${queue.length} of ${slicedEntries.length} videos with ${args.provider}` +
      (args.filterUnknown ? ` (--filter-unknown skipped ${skipped.length})` : ""),
  );

  for (const item of queue) {
    const { entry, playlistIndex, parsed, unknownInfo } = item;
    console.log(
      `\n[${playlistIndex}] ${entry.title}` +
        (parsed
          ? ` (parsed: ${parsed.year ?? "?"}/${parsed.legacyGroup ?? "?"}/${parsed.scene ?? `part${parsed.part ?? "?"}`})`
          : ""),
    );
    if (unknownInfo?.hasUnknown) {
      console.log(
        `  unknown scenes: ${unknownInfo.unknownScenes.join(", ") || "(any)"}`,
      );
    }

    const sampleStarts = startsForEntry(entry, args.offsets, args.sampleLength);
    const sampleResults = [];
    for (const sampleStart of sampleStarts) {
      const samplePath = await ensureSample(
        entry,
        sampleStart,
        args.sampleLength,
        args.skipDownload || args.dryRun,
        args.dryRun,
      );
      const recognition = await recognizeSample(
        args.provider,
        samplePath,
        entry,
        sampleStart,
        args,
      );
      sampleResults.push({
        offset: sampleStart,
        sample: samplePath,
        ...recognition,
      });

      logSampleResult(sampleStart, recognition);
    }

    results.push({
      playlistIndex,
      videoId: entry.id,
      title: entry.title,
      url: entry.url,
      duration: entry.duration ?? null,
      parsed,
      unknownInfo,
      samples: sampleResults,
      bestMatch: chooseBestMatch(sampleResults, args.hummingMinScore),
    });
  }

  const output = {
    provider: args.provider,
    playlist: {
      id: playlist.id,
      title: playlist.title,
      url: playlist.webpage_url ?? args.playlistUrl,
      count: playlist.entries.length,
    },
    options: {
      offsets: args.offsets,
      sampleLength: args.sampleLength,
      filterUnknown: args.filterUnknown,
      includeEmptyScenes: args.includeEmptyScenes,
      hummingMinScore: args.hummingMinScore,
      topN: args.topN,
      dryRun: args.dryRun,
    },
    generatedAt: new Date().toISOString(),
    skipped: args.filterUnknown ? skipped : undefined,
    results,
  };

  const runLabel = buildRunLabel(args, queue);
  const jsonPath = path.join(workDir, `${args.provider}-results-${runLabel}.json`);
  const markdownPath = path.join(workDir, `${args.provider}-results-${runLabel}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(output, null, 2)}\n`);
  await fs.writeFile(markdownPath, renderMarkdown(output));
  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
}

function logSampleResult(offset, recognition) {
  const hasMusic = (recognition.music ?? []).length > 0;
  const hasHumming = (recognition.humming ?? []).length > 0;
  const top = hasMusic ? recognition.music[0] : hasHumming ? recognition.humming[0] : null;
  const sourceTag = hasMusic ? "music" : hasHumming ? "humming" : "no match";
  const label = top
    ? `${top.artist ?? "Unknown artist"} - ${top.title ?? "Unknown title"} ` +
      `(${sourceTag} score=${top.score})`
    : "no match";
  console.log(`  ${formatSeconds(offset)}: ${label}`);
}

function requireCommand(command) {
  const versionArg = command === "ffmpeg" ? "-version" : "--version";
  const result = spawnSync(command, [versionArg], { stdio: "ignore" });
  if (result.status !== 0) {
    throw new Error(`${command} is required. Install it and retry.`);
  }
}

function requireProviderEnv(provider) {
  if (provider === "audd" && !process.env.AUDD_API_TOKEN) {
    throw new Error("AUDD_API_TOKEN is required for --provider audd");
  }
  if (provider === "acrcloud") {
    for (const name of ["ACRCLOUD_HOST", "ACRCLOUD_ACCESS_KEY", "ACRCLOUD_ACCESS_SECRET"]) {
      if (!process.env[name]) throw new Error(`${name} is required for --provider acrcloud`);
    }
  }
}

async function loadPlaylist(playlistUrl, dryRun = false) {
  const cachePath = path.join(workDir, "playlist.json");
  if (dryRun) {
    const cached = await fs.readFile(cachePath, "utf8").catch((error) => {
      if (error.code === "ENOENT") {
        throw new Error(
          `--dry-run requires a cached ${cachePath}. Run once without --dry-run first.`,
        );
      }
      throw error;
    });
    return JSON.parse(cached);
  }
  const json = await run("yt-dlp", ["--flat-playlist", "--dump-single-json", playlistUrl], {
    maxBufferBytes: 50 * 1024 * 1024,
  });
  await fs.writeFile(cachePath, json);
  return JSON.parse(json);
}

async function loadMusicData(musicDataPath) {
  const text = await fs.readFile(musicDataPath, "utf8");
  return JSON.parse(text);
}

async function writePlaylistSummary(playlist) {
  const lines = [
    `# ${playlist.title}`,
    "",
    `URL: ${playlist.webpage_url ?? playlist.original_url ?? ""}`,
    `Videos: ${playlist.entries.length}`,
    "",
    "| # | Title | Duration | URL |",
    "|---:|---|---:|---|",
  ];

  playlist.entries.forEach((entry, index) => {
    lines.push(
      `| ${index + 1} | ${escapePipes(entry.title ?? "")} | ${entry.duration ?? ""} | ${entry.url ?? ""} |`,
    );
  });

  await fs.writeFile(path.join(workDir, "playlist-summary.md"), `${lines.join("\n")}\n`);
}

function startsForEntry(entry, offsets, sampleLength) {
  const duration = Number(entry.duration ?? 0);
  const maxStart = Math.max(0, duration - sampleLength - 1);
  const starts = offsets.map((offset) => {
    if (offset > 0 && offset < 1 && duration > 0) return Math.floor(duration * offset);
    return Math.floor(offset);
  });
  return [...new Set(starts.map((start) => Math.min(Math.max(0, start), maxStart)))].sort(
    (a, b) => a - b,
  );
}

async function ensureSample(entry, start, length, skipDownload, dryRun) {
  const baseName = `${String(entry.id).replace(/[^A-Za-z0-9_-]/g, "_")}_${String(start).padStart(4, "0")}`;
  const existing = await findSample(baseName);
  if (existing) return existing;
  if (dryRun) return null; // dry-run: no sample needed if we won't call API
  if (skipDownload) throw new Error(`Missing sample for ${entry.id} at ${start}s`);

  const outputTemplate = path.join(sampleDir, `${baseName}.%(ext)s`);
  await run("yt-dlp", [
    "--quiet",
    "--no-progress",
    "--force-keyframes-at-cuts",
    "--download-sections",
    `*${formatTimestamp(start)}-${formatTimestamp(start + length)}`,
    "-f",
    "bestaudio/best",
    "-o",
    outputTemplate,
    entry.url,
  ]);

  const downloaded = await findSample(baseName);
  if (!downloaded) throw new Error(`yt-dlp did not create a sample for ${entry.id} at ${start}s`);
  return downloaded;
}

async function findSample(baseName) {
  const files = await fs.readdir(sampleDir);
  const match = files.find((file) => file.startsWith(`${baseName}.`));
  return match ? path.join(sampleDir, match) : null;
}

async function recognizeSample(provider, samplePath, entry, offset, args) {
  if (provider === "audd") return recognizeWithAudD(samplePath, entry, offset, args);
  return recognizeWithAcrCloud(samplePath, entry, offset, args);
}

async function recognizeWithAudD(samplePath, entry, offset, args) {
  if (args.dryRun) {
    const cached = await readCachedRaw("audd", entry.id, offset);
    return parseAudDResult(cached ?? {}, args);
  }

  const form = new FormData();
  const blob = await openAsBlob(samplePath);
  form.append("api_token", process.env.AUDD_API_TOKEN);
  form.append("return", "apple_music,spotify,musicbrainz");
  form.append("file", blob, path.basename(samplePath));

  const response = await fetch("https://api.audd.io/", { method: "POST", body: form });
  const raw = await response.json();
  await writeRaw("audd", entry.id, offset, raw);
  return parseAudDResult(raw, args, response.ok);
}

function parseAudDResult(raw, args, responseOk = true) {
  const result = raw?.result;
  const candidate = result
    ? {
        title: result.title ?? null,
        artist: result.artist ?? null,
        album: result.album ?? null,
        releaseDate: result.release_date ?? null,
        isrc: result.song_link?.isrc ?? result.isrc ?? null,
        score: 1,
        providerIds: {
          musicbrainz: result.musicbrainz?.id ?? null,
          spotify: result.spotify?.external_ids?.isrc ?? null,
        },
      }
    : null;
  return {
    status: raw?.status ?? (responseOk ? "ok" : "error"),
    score: candidate ? 1 : 0,
    match: candidate,
    music: candidate ? [candidate] : [],
    humming: [],
  };
}

async function recognizeWithAcrCloud(samplePath, entry, offset, args) {
  if (args.dryRun) {
    const cached = await readCachedRaw("acrcloud", entry.id, offset);
    return parseAcrCloudResult(cached ?? {}, args);
  }

  const sample = await fs.readFile(samplePath);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signatureVersion = "1";
  const dataType = "audio";
  const accessKey = process.env.ACRCLOUD_ACCESS_KEY;
  const stringToSign = ["POST", "/v1/identify", accessKey, dataType, signatureVersion, timestamp].join("\n");
  const signature = crypto
    .createHmac("sha1", process.env.ACRCLOUD_ACCESS_SECRET)
    .update(stringToSign)
    .digest("base64");

  const form = new FormData();
  form.append("sample", new Blob([sample]), path.basename(samplePath));
  form.append("sample_bytes", String(sample.length));
  form.append("access_key", accessKey);
  form.append("data_type", dataType);
  form.append("signature_version", signatureVersion);
  form.append("signature", signature);
  form.append("timestamp", timestamp);

  const host = process.env.ACRCLOUD_HOST.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const response = await fetch(`https://${host}/v1/identify`, { method: "POST", body: form });
  const raw = await response.json();
  await writeRaw("acrcloud", entry.id, offset, raw);
  return parseAcrCloudResult(raw, args, response.ok);
}

function parseAcrCloudResult(raw, args, responseOk = true) {
  const meta = raw?.metadata ?? {};
  const music = (meta.music ?? []).map(normalizeAcrCandidate).slice(0, args.topN);
  const humming = (meta.humming ?? []).map(normalizeAcrCandidate).slice(0, args.topN);
  const topMusic = music[0] ?? null;
  return {
    status: raw?.status?.msg ?? (responseOk ? "ok" : "error"),
    score: topMusic?.score ?? 0,
    match: topMusic,
    music,
    humming,
  };
}

function normalizeAcrCandidate(entry) {
  return {
    title: entry?.title ?? null,
    artist: entry?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") || null,
    album: entry?.album?.name ?? null,
    releaseDate: entry?.release_date ?? null,
    isrc: entry?.external_ids?.isrc ?? null,
    score: entry?.score ?? 0,
    label: entry?.label ?? null,
    durationMs: entry?.duration_ms ?? null,
    playOffsetMs: entry?.play_offset_ms ?? null,
    providerIds: {
      acrid: entry?.acrid ?? null,
      spotify: entry?.external_metadata?.spotify?.track?.id ?? null,
      youtube: entry?.external_metadata?.youtube?.vid ?? null,
    },
  };
}

async function readCachedRaw(provider, videoId, offset) {
  const file = path.join(rawDir, `${provider}-${videoId}-${String(offset).padStart(4, "0")}.json`);
  try {
    const text = await fs.readFile(file, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeRaw(provider, videoId, offset, raw) {
  const file = path.join(rawDir, `${provider}-${videoId}-${String(offset).padStart(4, "0")}.json`);
  await fs.writeFile(file, `${JSON.stringify(raw, null, 2)}\n`);
}

function chooseBestMatch(samples, hummingMinScore) {
  const byKey = new Map();
  for (const sample of samples) {
    for (const candidate of sample.music ?? []) {
      addCandidate(byKey, "music", candidate);
    }
    for (const candidate of sample.humming ?? []) {
      if (Number(candidate.score) < hummingMinScore) continue;
      addCandidate(byKey, "humming", candidate);
    }
  }
  if (byKey.size === 0) return null;

  const ordered = [...byKey.values()].sort((a, b) => {
    // music beats humming
    if (a.source !== b.source) return a.source === "music" ? -1 : 1;
    if (b.count !== a.count) return b.count - a.count;
    return b.scoreSum - a.scoreSum;
  });
  const winner = ordered[0];
  return {
    source: winner.source,
    count: winner.count,
    score: winner.scoreSum / winner.count,
    title: winner.match.title,
    artist: winner.match.artist,
    album: winner.match.album,
    releaseDate: winner.match.releaseDate,
    isrc: winner.match.isrc,
    providerIds: winner.match.providerIds,
  };
}

function addCandidate(byKey, source, candidate) {
  const key = `${source}|${(candidate.artist ?? "").toLowerCase()}|${(candidate.title ?? "").toLowerCase()}`;
  const current = byKey.get(key) ?? { source, count: 0, scoreSum: 0, match: candidate };
  current.count += 1;
  current.scoreSum += Number(candidate.score ?? 0);
  byKey.set(key, current);
}

// Decide whether a video should be processed based on whether its mapped
// (year, group, [scene]) has unfilled tracks in music.json. Behaviour:
//  - If the parsed title has a specific scene, only that scene is considered.
//  - If no scene was extracted, fall back to any scene in (year, group).
//  - "Unfilled" = status:"unknown" OR title:null. With --include-empty-scenes,
//    scenes with tracks:[] also count as unfilled.
function evaluateUnknownStatus(parsed, musicData, includeEmptyScenes) {
  if (!parsed || !parsed.year || !parsed.legacyGroup) {
    return { hasUnknown: false, reason: "unparsed-title", unknownScenes: [] };
  }
  const records = musicData.filter(
    (record) => record.year === parsed.year && record.legacyGroup === parsed.legacyGroup,
  );
  if (records.length === 0) {
    return { hasUnknown: false, reason: "no-music-record", unknownScenes: [] };
  }

  const isUnfilledTracks = (tracks) => {
    if (!tracks || tracks.length === 0) return includeEmptyScenes;
    return tracks.some(
      (track) => track.status === "unknown" || track.title === null || track.title === undefined,
    );
  };

  const unknownScenes = [];
  let sceneFound = false;
  for (const record of records) {
    for (const scene of record.scenes ?? []) {
      if (parsed.scene && scene.scene !== parsed.scene) continue;
      if (parsed.scene) sceneFound = true;
      if (isUnfilledTracks(scene.tracks ?? [])) {
        unknownScenes.push(scene.scene);
      }
    }
  }

  if (parsed.scene && !sceneFound) {
    return {
      hasUnknown: false,
      reason: "scene-not-in-music-json",
      unknownScenes: [],
      matchedScene: parsed.scene,
    };
  }

  if (unknownScenes.length === 0) {
    const reason = parsed.scene ? "scene-known" : "all-known";
    return {
      hasUnknown: false,
      reason,
      unknownScenes: [],
      matchedScene: parsed.scene ?? null,
    };
  }

  return {
    hasUnknown: true,
    reason: parsed.scene ? "scene-target" : "year-group-target",
    unknownScenes,
    matchedScene: parsed.scene ?? null,
  };
}

function parseVideoTitle(rawTitle) {
  if (!rawTitle) return null;
  // Strip leading bracket annotations like [...] / 【...】
  let title = rawTitle.replace(/^[【\[][^】\]]*[】\]]\s*/u, "").trim();

  const year = extractYear(title);
  const legacyGroup = extractGroup(title);
  const part = extractPart(title);
  const scene = extractScene(title, part);
  return { year, legacyGroup, part, scene };
}

function extractYear(title) {
  // 4-digit explicit year (1980-2099)
  const four = title.match(/(19[89]\d|20\d\d)/);
  if (four) return Number(four[1]);
  // 2-digit year cues: NN before sun/moon/red/white/R/W or massgame
  const two = title.match(/(\d{2})(?=(?:R[\s\-_]?[12]|W[\s\-_]?[12]|sun|moon|red|white|RED|WHITE|massgame|MASSGAME|MassGame))/i);
  if (two) {
    const yy = Number(two[1]);
    return (yy >= 80 ? 1900 : 2000) + yy;
  }
  return null;
}

function extractGroup(title) {
  // Match keywords case-insensitively. Compact codes like "08R-2" or "01R 1"
  // appear right after the year digits, so use a digit-prefix shortcut.
  const hasRed =
    /sun|red|赤軍|赤|太陽/i.test(title) ||
    /\d+R(?:[\s\-_]|$)/.test(title) ||
    /\bR[\s\-_]?[12]\b/i.test(title);
  const hasWhite =
    /moon|white|白軍|白|月/i.test(title) ||
    /\d+W(?:[\s\-_]|$)/.test(title) ||
    /\bW[\s\-_]?[12]\b/i.test(title);
  if (hasRed && !hasWhite) return "Red";
  if (hasWhite && !hasRed) return "White";
  return null;
}

function extractPart(title) {
  // Detect 1st vs 2nd cues. Order patterns from most specific to least to
  // avoid false positives from year digits.
  const matches = {
    1: /1st|1部|Ⅰ部|I部|stage1|scene1|[RW][\s\-_]?1\b|[RW]1\b|１st|１部|-1\b|_1\b|\s1\s|\s1$/i,
    2: /2nd|2部|Ⅱ部|II部|stage2|scene2|[RW][\s\-_]?2\b|[RW]2\b|２nd|２部|-2\b|_2\b|\s2\s|\s2$/i,
  };
  const has1 = matches[1].test(title);
  const has2 = matches[2].test(title);
  if (has1 && !has2) return 1;
  if (has2 && !has1) return 2;
  if (has1 && has2) {
    // Prefer the later occurrence as the actual part (titles often include both numbers)
    const idx1 = title.search(matches[1]);
    const idx2 = title.search(matches[2]);
    return idx2 > idx1 ? 2 : 1;
  }
  return null;
}

// Map title cues to a specific MusicScene name.
// Recognized variants:
//   入場    : "opening", "入場", "...-O", " O" (rare suffix)
//   一部    : "1st", "Ⅰ部", "１部", "1部", "R-1", "W 1", "01R 1", etc.
//   インター : "inter", "intermission", "インター"
//   二部    : "2nd", "Ⅱ部", "２部", "2部", "R-2", etc.
//   三部    : "3rd", "Ⅲ部", "３部", "3部", " 3"
//   退場    : "ending", "退場", "...-E", " E"
function extractScene(title, part) {
  if (/opening|entrance|入場/i.test(title)) return "入場";
  if (/ending|退場/i.test(title)) return "退場";
  if (/intermission|interval|インター|inter\b/i.test(title)) return "インター";
  if (/3rd|Ⅲ部|３部|3部|\s3\b|\s3$|[\-_]3\b/i.test(title)) return "三部";

  // Suffix codes used in older title styles: e.g. "03W-E" (ending), "00R E" (ending)
  if (/[\-_\s][Ee]\b|[\-_\s][Ee]$/.test(title) && !/ending/i.test(title)) {
    return "退場";
  }

  // Fall back to part number → scene mapping. 1→一部, 2→二部.
  if (part === 1) return "一部";
  if (part === 2) return "二部";
  return null;
}

function renderMarkdown(output) {
  const lines = [
    `# ${output.playlist.title} music recognition`,
    "",
    `Provider: ${output.provider}`,
    `Generated: ${output.generatedAt}`,
    `Offsets: ${formatOffsetsForReport(output.options.offsets)}`,
    `Filter unknown only: ${output.options.filterUnknown ? "yes" : "no"}`,
    `Include empty scenes: ${output.options.includeEmptyScenes ? "yes" : "no"}`,
    `Humming min score (bestMatch fallback): ${output.options.hummingMinScore}`,
    `Dry run: ${output.options.dryRun ? "yes" : "no"}`,
    "",
  ];

  if (output.skipped && output.skipped.length > 0) {
    lines.push(`## Skipped (${output.skipped.length})`);
    lines.push("");
    lines.push("| # | Video | Parsed | Reason |");
    lines.push("|---:|---|---|---|");
    for (const s of output.skipped) {
      const parsed = s.parsed
        ? `${s.parsed.year ?? "?"}/${s.parsed.legacyGroup ?? "?"}/${s.parsed.scene ?? `part${s.parsed.part ?? "?"}`}`
        : "(unparsed)";
      lines.push(
        `| ${s.playlistIndex} | [${escapePipes(s.title ?? "")}](${s.url ?? ""}) | ${parsed} | ${s.reason} |`,
      );
    }
    lines.push("");
  }

  lines.push(`## Recognition results (${output.results.length})`);
  lines.push("");
  lines.push(
    "| # | Video | Parsed | Best match | Source | Music候補 | Humming候補(高 ≥0.9) | Humming候補(中 0.8-0.9) |",
  );
  lines.push("|---:|---|---|---|---|---|---|---|");

  for (const result of output.results) {
    const parsed = result.parsed
      ? `${result.parsed.year ?? "?"}/${result.parsed.legacyGroup ?? "?"}/${result.parsed.scene ?? `part${result.parsed.part ?? "?"}`}`
      : "(unparsed)";
    const best = result.bestMatch
      ? `${escapePipes(result.bestMatch.artist ?? "")} - ${escapePipes(result.bestMatch.title ?? "")}`
      : "No match";
    const source = result.bestMatch ? result.bestMatch.source : "-";

    const musicAgg = aggregateCandidatesByKind(result.samples, "music");
    const hummingAgg = aggregateCandidatesByKind(result.samples, "humming");
    const musicCol = formatCandidateList(musicAgg);
    const highHumming = formatCandidateList(hummingAgg.filter((c) => c.scoreMax >= 0.9));
    const midHumming = formatCandidateList(
      hummingAgg.filter((c) => c.scoreMax >= 0.8 && c.scoreMax < 0.9),
    );

    lines.push(
      `| ${result.playlistIndex} | [${escapePipes(result.title)}](${result.url}) | ${parsed} | ${best} | ${source} | ${musicCol} | ${highHumming} | ${midHumming} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function aggregateCandidatesByKind(samples, kind) {
  const byKey = new Map();
  for (const sample of samples) {
    const list = sample[kind] ?? [];
    for (const candidate of list) {
      const key = `${(candidate.artist ?? "").toLowerCase()}|${(candidate.title ?? "").toLowerCase()}`;
      const cur = byKey.get(key) ?? {
        artist: candidate.artist,
        title: candidate.title,
        count: 0,
        scoreMax: 0,
      };
      cur.count += 1;
      cur.scoreMax = Math.max(cur.scoreMax, Number(candidate.score ?? 0));
      byKey.set(key, cur);
    }
  }
  return [...byKey.values()].sort((a, b) => b.scoreMax - a.scoreMax || b.count - a.count);
}

function formatCandidateList(candidates) {
  if (candidates.length === 0) return "-";
  return candidates
    .slice(0, 5)
    .map(
      (c) =>
        `${escapePipes(c.artist ?? "")} - ${escapePipes(c.title ?? "")} (×${c.count}, ${c.scoreMax})`,
    )
    .join("<br>");
}

function buildRunLabel(args, queue) {
  const first = queue.length > 0 ? queue[0].playlistIndex : args.startIndex;
  const last = queue.length > 0 ? queue[queue.length - 1].playlistIndex : args.startIndex;
  const timestamp = new Date()
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replaceAll(":", "")
    .replaceAll("-", "");
  const filterTag = args.filterUnknown ? "-unknown" : "";
  const dryTag = args.dryRun ? "-dry" : "";
  return `${String(first).padStart(3, "0")}-${String(last).padStart(3, "0")}${filterTag}${dryTag}-${timestamp}`;
}

function escapePipes(value) {
  return String(value).replaceAll("|", "\\|");
}

function formatSeconds(seconds) {
  return `${Math.floor(seconds)}s`;
}

function formatOffsetsForReport(offsets) {
  return offsets
    .map((value) => (value > 0 && value < 1 ? `${Math.round(value * 100)}%` : `${value}s`))
    .join(", ");
}

function formatTimestamp(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks = [];
    const errorChunks = [];
    let outputBytes = 0;
    const maxBufferBytes = options.maxBufferBytes ?? 10 * 1024 * 1024;

    child.stdout.on("data", (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > maxBufferBytes) {
        child.kill("SIGTERM");
        reject(new Error(`${command} output exceeded ${maxBufferBytes} bytes`));
        return;
      }
      chunks.push(chunk);
    });
    child.stderr.on("data", (chunk) => errorChunks.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks).toString("utf8"));
      } else {
        reject(
          new Error(
            `${command} exited with ${code}\n${Buffer.concat(errorChunks).toString("utf8").trim()}`,
          ),
        );
      }
    });
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
