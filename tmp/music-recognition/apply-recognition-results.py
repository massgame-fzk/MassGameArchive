#!/usr/bin/env python3
"""Apply ACRCloud recognition OK entries to src/data/music.json.

Reads /Users/home/massgame-archive/src/data/music.json, locates each
(year, legacyGroup, scene) entry, and appends a track if not already present.
"""

import json
import sys
from pathlib import Path

ROOT = Path("/sessions/charming-optimistic-mendel/mnt/massgame-archive")
MUSIC_JSON = ROOT / "src/data/music.json"

# (year, legacyGroup, scene, title, artist, video_title, video_id)
ADDITIONS = [
    # Group A — Music一致 score 100
    (2024, "White", "入場", "Everywhere I Go", "Onlap", "24moonmassgame opening", "Jrm7VWKwsAc"),
    (2016, "White", "インター", "Till Next Time -Staff Roll 1-", "アークシステムワークス", "16moonmassgame  inter", "nCZ4ql9qhHQ"),
    (2015, "White", "二部", "マジック フィーチャリング カナ", "i-dep", "2015MoonMassGame-2nd stage", "IIKxi2fG0jE"),
    (2012, "White", "入場", "After the Nine O'clock News", "Wig Wam", "2012massgame white-Opening", "StQGOVzEtUE"),
    (2025, "Red", "インター", "BUMP!", "土屋裕一", "25sunmassgame inter", "toEAWfdjndE"),
    (2024, "Red", "インター", "The Ultimate (Naked mix)", "目黒将司", "24sunmassgame inter", "HOe9kIPFLRE"),
    (2022, "Red", "インター", "Mounting The V-Watch", "V.A", "広大附属 太陽マスゲーム 2022 インター", "qSujD_7EYSE"),
    (2014, "Red", "入場", "I Burn For You", "Treat", "2014 sunmass opening", "lvled2vYTPA"),
    (2014, "Red", "三部", "Any Way You Want It / Lovin' Touchin' Squeezin' (Glee Cast Version)", "Glee Cast", "2014 sunmass 3rd stage", "yoxZn3rewt8"),
    (2012, "Red", "三部", "Fair Warning", "Departure", "2012massgame Red-3rd stage", "55uBcmcWjLM"),
    (2012, "Red", "退場", "Stand Beside You", "91 Suite", "2012massgame Red-Ending", "yZ03aCsyyiI"),

    # Group B (NG entry skipped: 2022/月/インター)
    (2019, "White", "インター", "Chasing The Moonlight (Feat. 김세황)", "Jimi & Doma Studio", "19moonmassgame inter", "8Pf2pGqKMXk"),
    (2021, "Red", "インター", "Ignition", "Aragon", "21sunmassgame inter", "Hh3ex7DezYY"),
    (2018, "Red", "一部", "Burn (feat. Henning Basse)", "Derdian", "18sunmassgame 1st stage", "jP7BzIdPaZY"),

    # Group C — Humming一致 score ≥ 0.96
    (2025, "White", "三部", "Where I Belong (feat. We the Kings)", "Simple Plan, State Champs", "25moonmassgame 3rd", "oqxhZH06Lt4"),
    (2024, "White", "一部", "Oak And Ash", "Fellowship", "24moonmassgame 1st", "JGmcQRVpDko"),
    (2022, "Red", "退場", "The Antidote", "Simple Plan", "広大附属 太陽マスゲーム 2022 退場", "FDU7WP2YUrw"),
    (2017, "Red", "入場", "Land Of Broken Dreams", "Dynazty", "17sunmassgame opening", "W8yZB1PbJwk"),
    # User-corrected: original is ACE+ (Xenoblade Chronicles), not the RichaadEB metal cover
    (2017, "Red", "インター", "You Will Know Our Names", "ACE+", "17sunmassgame inter", "y3XCzJP3rRQ"),

    # 採用しない方針からOK判定された3件
    (2025, "White", "インター", "Blue Lightning", "Evan", "25moonmassgame inter", "JjKwVU77g8g"),
    (2018, "White", "インター", "Blue Water Blue Sky -May's Theme-", "Arc System Works", "18moonmassgame interval", "RtJ0g8bd2k8"),
    (2024, "Red", "入場", "Rock Ain't Dead", "Onlap", "24sunmassgame opening", "PwR0vZzBEpc"),
]


def main() -> int:
    data = json.loads(MUSIC_JSON.read_text(encoding="utf-8"))

    # Build index: (year, legacyGroup, scene) -> tracks list
    index: dict[tuple[int, str, str], list] = {}
    for year_entry in data:
        year = year_entry["year"]
        legacy = year_entry["legacyGroup"]
        for scene_entry in year_entry["scenes"]:
            index[(year, legacy, scene_entry["scene"])] = scene_entry["tracks"]

    added = 0
    skipped = 0
    errors: list[str] = []

    for year, legacy, scene, title, artist, video_title, video_id in ADDITIONS:
        key = (year, legacy, scene)
        if key not in index:
            errors.append(f"NOT FOUND: {year}/{legacy}/{scene}")
            continue

        tracks = index[key]

        # Skip if a track with this title+artist already exists
        if any(t.get("title") == title and t.get("artist") == artist for t in tracks):
            print(f"  SKIP (already exists): {year}/{legacy}/{scene} — {artist} – {title}")
            skipped += 1
            continue

        new_track = {
            "title": title,
            "artist": artist,
            "source": f"ACRCloud音源認識: {video_title}",
            "sourceUrl": f"https://www.youtube.com/watch?v={video_id}",
            "verified": True,
        }
        tracks.append(new_track)
        print(f"  ADD: {year}/{legacy}/{scene} — {artist} – {title}")
        added += 1

    if errors:
        print("\nERRORS:", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        return 1

    # Write back with same formatting as original (2-space indent, no ASCII escape)
    serialized = json.dumps(data, indent=2, ensure_ascii=False)
    MUSIC_JSON.write_text(serialized + "\n", encoding="utf-8")

    print(f"\n追加: {added}件, スキップ(既存): {skipped}件")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
