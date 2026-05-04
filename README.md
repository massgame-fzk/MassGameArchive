# MassGame Archive

広大附属マスゲームの曲と動画を整理する非公式アーカイブです。年度、部門、場面、曲名、アーティスト、YouTube動画をサイト内で閲覧できる資料として管理します。

## 技術構成

- Astro + TypeScript
- 静的サイト出力
- Cloudflare Pages想定
- 公開データは `src/data/*.json` で管理
- 採取元HTMLは `sources/` に保存

## 開発

```sh
npm install
npm run dev
npm run build
```

## 引き継ぎの流れ

このサイトはGitHubで管理し、担当者が変更ブランチを作ってPull Requestを出し、レビュー後にマージすると公開サイトへ反映される運用を想定しています。

1. 年度担当者がIssueまたは引き継ぎメモで更新内容を受け取る。
2. 担当者がGitHub上でブランチを作る。
3. `src/data/years.json`、`src/data/music.json`、`src/data/media.json` を編集する。
4. Pull Requestを作る。
5. レビュー担当者が内容、YouTubeリンク、個人情報の混入を確認する。
6. マージ後、Cloudflare Pagesの自動デプロイでWebサイトが更新される。

具体的な操作は [docs/github-operation.md](docs/github-operation.md) を参照してください。

## 公開対象

- 年度
- 部門
- 場面
- 曲名
- アーティスト
- YouTubeプレイリストまたは動画URL

本文レポート、写真、掲示板、メールアドレス、個人名、旧サイトへの公開リンクは公開対象にしません。

## 更新手順

1. 確認根拠を残す。
2. `src/data/years.json`、`src/data/music.json`、`src/data/media.json` の該当データを更新する。
3. `verified: true` と `lastChecked` を付ける。
4. 採取元URLや抽出メモは内部管理として保持し、公開UIには出さない。
5. `npm run build` で確認する。

## 担当者が編集する主なファイル

- `src/data/years.json`: 年度ページの基本情報
- `src/data/music.json`: 曲名、アーティスト、場面
- `src/data/media.json`: YouTubeプレイリスト
- `src/pages/*.astro`: ページ構造を変える場合のみ
- `src/styles/global.css`: デザインを変える場合のみ

## 新年度追加手順

1. `src/data/years.json` に年度レコードを追加する。
2. 曲が確認できる場合は `src/data/music.json` に年度、部門、場面、曲名、アーティストを追加する。
3. YouTubeが確認できる場合は `src/data/media.json` に追加する。
4. YouTube以外の外部リンクは公開データに入れない。

## デザイン

`design.md` に定義した「Apple風トップ + 資料閲覧型アーカイブ」方針を適用しています。トップは明確な導線を持つランディング、下層は曲と動画を探しやすい資料ページとして扱います。

## FC2データ再抽出

`sources/fc2-utf8/` に変換済みHTMLを置いたうえで実行します。

```sh
npm run extract:fc2
```

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 20以上
