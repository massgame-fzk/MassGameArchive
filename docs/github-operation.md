# GitHub更新手順

年度担当者が曲情報やYouTubeリンクを更新し、Pull Requestで反映するための手順です。

## 前提

- GitHubリポジトリにアクセスできること。
- 編集内容の確認根拠があること。
- 公開してよい情報だけを扱うこと。
- YouTube以外の外部リンクを公開データに入れないこと。
- 個人名、写真、本文レポート、メールアドレス、掲示板リンクを入れないこと。

## GitHub画面だけで更新する方法

1. GitHubでリポジトリを開く。
2. 更新するファイルを開く。
3. 右上の鉛筆アイコンを押す。
4. ファイルを編集する。
5. 画面下部の `Commit changes` で、新しいブランチを作ってコミットする。
6. 表示される案内からPull Requestを作る。
7. レビュー担当者に確認を依頼する。

この方法は、曲を数件追加する程度の小さな変更に向いています。

## ローカルで更新する方法

```sh
git clone <repository-url>
cd massgame-archive
npm install
git checkout -b update/2026-music
npm run dev
```

編集後に確認します。

```sh
npm run build
git status
git add src/data/years.json src/data/music.json src/data/media.json
git commit -m "Add 2026 archive entries"
git push -u origin update/2026-music
```

GitHub上でPull Requestを作り、レビューを依頼します。

## 年度情報を追加する

`src/data/years.json` に1件追加します。

```json
{
  "year": 2026,
  "label": "2026年度",
  "groups": ["未整理"],
  "summary": "曲とYouTubeは未整理。",
  "source": "内部確認メモ",
  "sourceUrl": "",
  "verified": true,
  "lastChecked": "2026-05-04"
}
```

`source` と `sourceUrl` は公開UIには出ませんが、管理上の根拠として残します。URLがない場合は `sourceUrl` を空文字にして、Pull Request本文に確認経緯を書いてください。

## 曲を追加する

`src/data/music.json` に追加します。

```json
{
  "year": 2026,
  "group": "太陽",
  "legacyGroup": "Red",
  "scene": "入場",
  "title": "曲名",
  "artist": "アーティスト名",
  "source": "内部確認メモ",
  "sourceUrl": "",
  "verified": true
}
```

`group` は `太陽`、`月`、`赤`、`白` のいずれかを使います。`legacyGroup` は旧表記の都合で `Red` または `White` を入れます。

## YouTubeを追加する

`src/data/media.json` に追加します。

```json
{
  "label": "2026年度",
  "kind": "youtube-playlist",
  "url": "https://www.youtube.com/playlist?list=PLAYLIST_ID",
  "source": "内部確認メモ",
  "sourceUrl": "",
  "verified": true
}
```

範囲プレイリストは `2006-2000年度` のように書くと、該当する各年度ページにも表示されます。`1999年度以前` のような表記も使えます。

動画単体を追加する場合は `"kind": "youtube-video"` にして、`url` に `https://www.youtube.com/watch?v=...` を入れます。

## Pull Requestに書くこと

- 追加・修正した年度
- 追加・修正した曲数
- YouTubeリンクの有無
- 確認根拠
- 個人情報や写真が含まれていないこと

## レビュー観点

- `npm run build` が通るか
- YouTube以外の外部リンクが公開データに入っていないか
- 個人名、写真、本文レポートが混ざっていないか
- 年度、部門、場面、曲名、アーティストが正しいか
- Pull Request本文に確認根拠があるか

## マージ後

Pull Requestをマージすると、Cloudflare Pagesが自動ビルドします。デプロイが成功したら、公開サイトで対象年度、曲一覧、動画ページを確認してください。
