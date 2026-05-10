# MassGame Archive

広大附属マスゲームの曲とYouTube動画を整理する非公式アーカイブです。年度、部門、場面、曲名、アーティスト、YouTube動画を、OB/OGが参照しやすい静的サイトとして公開します。

学校公式サイトではありません。本文レポート、写真、掲示板、メールアドレス、個人名、旧サイトへの公開リンクは掲載対象にしません。

## 現在の内容

- 年度データ: 1982-2026年度
- 曲データ: 86レコード、410曲
- YouTubeデータ: プレイリスト7件、動画113件
- 主な出典: 旧FC2サイトの保存HTML、YouTube検索・動画確認

公開UIでは `verified: true` のデータだけを使います。出典名、出典URL、確認メモは管理用データとして保持しますが、ページ上には表示しません。

## サイト構成

- `/`: トップページ
- `/about/`: サイトの公開方針
- `/contribute/`: 情報提供・訂正・削除依頼の案内
- `/years/`: 年度一覧
- `/years/[year]/`: 年度別の曲とYouTube
- `/records/music/`: 曲一覧。曲名・アーティスト検索、年度・部門絞り込み、列ソートに対応
- `/records/media/`: YouTube一覧。年度別に動画を並べ、必要な動画だけ埋め込み再生
- `/groups/sun/`: 太陽・赤の曲一覧
- `/groups/moon/`: 月・白の曲一覧

## 技術構成

- Astro + TypeScript
- 静的サイト出力
- Cloudflare Pages想定
- 公開データは `src/data/*.json` で管理
- 採取元HTMLは `sources/` に保存
- デザイン方針は `design.md` に記録

## 開発

```sh
npm install
npm run dev
```

確認用コマンド:

```sh
npm run validate:data
npm run build
npm run preview
```

`npm run build` は `astro check` と `astro build` を実行します。

## データファイル

- `src/data/years.json`: 年度ページの基本情報
- `src/data/music.json`: 年度、部門、場面ごとの曲情報
- `src/data/media.json`: YouTubeプレイリスト・動画情報
- `src/data/types.ts`: データ型定義
- `src/data/archive.ts`: verifiedデータの抽出、年度別集約、YouTube埋め込みURL生成

`src/data/music.json` は、年度・部門単位のレコードに `scenes` を持つ形式です。各レコードは `入場`、`一部`、`インター`、`二部`、`三部`、`退場` の6枠を持ち、確認済みの曲を `tracks` に入れます。

```json
{
  "year": 2026,
  "group": "太陽",
  "legacyGroup": "Red",
  "scenes": [
    { "scene": "入場", "tracks": [] },
    {
      "scene": "一部",
      "tracks": [
        {
          "title": "曲名",
          "artist": "アーティスト名",
          "source": "確認根拠",
          "sourceUrl": "",
          "verified": true
        }
      ]
    },
    { "scene": "インター", "tracks": [] },
    { "scene": "二部", "tracks": [] },
    { "scene": "三部", "tracks": [] },
    { "scene": "退場", "tracks": [] }
  ],
  "verified": true
}
```

`group` は `太陽`、`月`、`赤`、`白`、`未整理`、`不明` を使います。`legacyGroup` は旧サイトの赤白表記に合わせて `Red` または `White` を使います。

`src/data/media.json` の `kind` は `youtube-playlist` または `youtube-video` です。動画単体の `label` は `2026年度 太陽 一部` のように、年度、部門、場面が読み取れる形にします。

## 更新手順

1. 確認根拠を残す。
2. 必要に応じて `src/data/years.json`、`src/data/music.json`、`src/data/media.json` を更新する。
3. 公開してよいデータだけ `verified: true` にする。
4. 出典名や出典URLは管理用として残し、公開UIには出さない。
5. `npm run validate:data` で曲データの形式を確認する。
6. `npm run build` でサイト全体を確認する。

具体的なGitHub上の操作は [docs/github-operation.md](docs/github-operation.md) を参照してください。

## 新年度追加手順

1. `src/data/years.json` に年度レコードを追加する。
2. 曲が確認できる場合は `src/data/music.json` に年度・部門レコードを追加し、6つの場面枠に曲を入れる。
3. YouTubeが確認できる場合は `src/data/media.json` に追加する。
4. YouTube以外の外部リンクは公開データに入れない。
5. `npm run validate:data` と `npm run build` を通す。

## FC2データ再抽出

`sources/fc2-utf8/` に変換済みHTMLを置いたうえで実行します。

```sh
npm run extract:fc2
```

古いフラットな曲データを現在の `scenes` 形式に変換する場合は次を使います。

```sh
npm run normalize:music
```

## YouTube楽曲照合

YouTube再生リストの音声断片を `yt-dlp` と `ffmpeg` で切り出し、AudDまたはACRCloudで照合します。結果は公開データには直接反映せず、`tmp/music-recognition/` にJSONとMarkdownで出力します。

AudD:

```sh
AUDD_API_TOKEN=... npm run recognize:music -- --provider audd --limit 5
```

ACRCloud:

```sh
ACRCLOUD_HOST=identify-ap-southeast-1.acrcloud.com \
ACRCLOUD_ACCESS_KEY=... \
ACRCLOUD_ACCESS_SECRET=... \
npm run recognize:music -- --provider acrcloud --limit 5
```

対象の既定プレイリストは「広大附属 マスゲーム」です。全130本を一度に処理する前に、`--limit` や `--start-index` で小さく試してください。標準では各動画の30秒、45秒、60秒地点から最大12秒のサンプルを切り出します。短い動画では、動画の長さに収まる位置へ自動で丸めます。

API照合を行わず、プレイリスト一覧だけを保存する場合:

```sh
npm run recognize:music -- --metadata-only
```

未検出が多い動画だけ再試行する場合は、サンプル位置を増やします。

```sh
npm run recognize:music -- --provider acrcloud --start-index 10 --limit 1 --offsets 30,45,60,75,90
```

## 引き継ぎの流れ

このサイトはGitHubで管理し、担当者が変更ブランチを作ってPull Requestを出し、レビュー後にマージすると公開サイトへ反映される運用を想定しています。

1. 年度担当者がIssueまたは引き継ぎメモで更新内容を受け取る。
2. 担当者がGitHub上でブランチを作る。
3. データファイルを編集する。
4. Pull Requestを作る。
5. レビュー担当者が内容、YouTubeリンク、個人情報の混入を確認する。
6. マージ後、Cloudflare Pagesの自動デプロイでWebサイトが更新される。

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 22.12以上
