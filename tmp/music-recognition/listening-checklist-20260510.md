# 試聴チェックリスト（music.json更新前）

ACRCloud結果のうち、信頼度の高い候補を絞り込んだもの。
各エントリの「動画URL」は **ACRCloudが一番強くヒットしたタイムスタンプ** に飛ぶように `?t=` が付いてます。30秒くらい聴いて、候補曲とフレーズが一致してるかを確認してください。

判定欄に `OK / NG / ?` を書き込んでもらえれば、OKだけ music.json に取り込みます。

---

## グループA：Music一致（score 100、複数サンプルでヒット） — ほぼ確定

| 判定 | 年/組/scene | 動画（試聴ポイント） | 候補曲 | 候補曲を聴く |
|---|---|---|---|---|
| OK | 2024/月/入場 | [Jrm7VWKwsAc @0:28](https://youtu.be/Jrm7VWKwsAc?t=28) | **Onlap – Everywhere I Go**（2017, *Running (Deluxe Edition)*） | [YouTube検索](https://www.youtube.com/results?search_query=Onlap+Everywhere+I+Go) |
| OK | 2016/月/インター | [nCZ4ql9qhHQ @0:12](https://youtu.be/nCZ4ql9qhHQ?t=12) | **アークシステムワークス – Till Next Time -Staff Roll 1-** | [YouTube検索](https://www.youtube.com/results?search_query=Till+Next+Time+Staff+Roll+ArcSystemWorks) |
| OK | 2015/月/二部 | [IIKxi2fG0jE @0:50](https://youtu.be/IIKxi2fG0jE?t=50) | **i-dep – マジック フィーチャリング カナ** | [YouTube検索](https://www.youtube.com/results?search_query=i-dep+マジック+カナ) |
| OK | 2012/月/入場 | [StQGOVzEtUE @0:31](https://youtu.be/StQGOVzEtUE?t=31) | **Wig Wam – After the Nine O'clock News** | [YouTube検索](https://www.youtube.com/results?search_query=Wig+Wam+After+the+Nine+O%27clock+News) |
| OK | 2025/太陽/インター | [toEAWfdjndE @0:09](https://youtu.be/toEAWfdjndE?t=9) | **土屋裕一 – BUMP!** | [YouTube検索](https://www.youtube.com/results?search_query=土屋裕一+BUMP) |
| OK | 2024/太陽/インター | [HOe9kIPFLRE @0:14](https://youtu.be/HOe9kIPFLRE?t=14) | **目黒将司 – The Ultimate (Naked mix)**（ペルソナ系？） | [YouTube検索](https://www.youtube.com/results?search_query=目黒将司+The+Ultimate+Naked) |
| OK | 2022/太陽/インター | [qSujD_7EYSE @0:15](https://youtu.be/qSujD_7EYSE?t=15) | **V.A – Mounting The V-Watch** | [YouTube検索](https://www.youtube.com/results?search_query=Mounting+The+V-Watch) |
| OK | 2014/太陽/入場 | [lvled2vYTPA @0:28](https://youtu.be/lvled2vYTPA?t=28) | **Treat (トリート) – I Burn For You** | [YouTube検索](https://www.youtube.com/results?search_query=Treat+I+Burn+For+You) |
| OK | 2014/太陽/三部 | [yoxZn3rewt8 @0:38](https://youtu.be/yoxZn3rewt8?t=38) | **Glee Cast – Any Way You Want It / Lovin' Touchin' Squeezin' (Glee Cast Version)** | [YouTube検索](https://www.youtube.com/results?search_query=Glee+Any+Way+You+Want+It+Lovin+Touchin+Squeezin) |
| OK | 2012/太陽/三部 | [55uBcmcWjLM @0:40](https://youtu.be/55uBcmcWjLM?t=40) | **Departure – Fair Warning** | [YouTube検索](https://www.youtube.com/results?search_query=Departure+Fair+Warning+band) |
| OK | 2012/太陽/退場 | [yZ03aCsyyiI @1:02](https://youtu.be/yZ03aCsyyiI?t=62) | **91 Suite – Stand Beside You** | [YouTube検索](https://www.youtube.com/results?search_query=91+Suite+Stand+Beside+You) |

---

## グループB：Music一致だがscoreが100未満 or 競合候補あり — 要慎重

| 判定 | 年/組/scene | 動画 | 候補曲 | 備考 |
|---|---|---|---|---|
| NG | 2022/月/インター | [CVuxpJDaMlQ @0:13](https://youtu.be/CVuxpJDaMlQ?t=13) | **Nicolas Blache – Save Me**（×5, 100） | 競合：Kid Sexy – The 300（×4, 100）も並んでいる。両方聴き比べ推奨 |
| OK | 2019/月/インター | [8Pf2pGqKMXk @0:14](https://youtu.be/8Pf2pGqKMXk?t=14) | **Jimi & Doma Studio – Chasing The Moonlight (Feat. 김세황)**（×5, 46） | scoreは46だが5サンプル全てで一致。フレーズが合えばOK |
| OK | 2021/太陽/インター | [Hh3ex7DezYY @0:12](https://youtu.be/Hh3ex7DezYY?t=12) | **Aragon – Ignition**（2015, ×5, 94） | スコア94×5でほぼ確定だがglossy productionか確認 |
| OK | 2018/太陽/一部 | [jP7BzIdPaZY @1:02](https://youtu.be/jP7BzIdPaZY?t=62) | **Derdian feat. Henning Basse – Burn**（×3, 94） | 5サンプル中3一致。曲全体が同じ曲か、メドレー混在の可能性 |

---

## グループC：Humming一致（score ≥ 0.96、複数サンプル） — Music DBにはない／カバー演奏の可能性

humming一致なのでオリジナル演奏ではない or 公式音源がDBにない曲です。フレーズが合っていればOK。

| 判定 | 年/組/scene | 動画 | 候補曲 | 備考 |
|---|---|---|---|---|
| OK | 2025/月/三部 | [oqxhZH06Lt4 @0:38](https://youtu.be/oqxhZH06Lt4?t=38) | **Simple Plan, State Champs – Where I Belong (feat. We the Kings)**（×5, 0.96） | 5サンプル全部0.96で一致、ほぼ確実 |
| OK | 2024/月/一部 | [JGmcQRVpDko @0:58](https://youtu.be/JGmcQRVpDko?t=58) | **Fellowship – Oak And Ash** | 2サンプル0.96で一致。25年1stと同じFellowshipなので並びとして自然 |
| OK | 2022/太陽/退場 | [FDU7WP2YUrw @0:40](https://youtu.be/FDU7WP2YUrw?t=40) | **Simple Plan – The Antidote**（×4, 0.96） | 4サンプル一致 |
| OK | 2017/太陽/入場 | [W8yZB1PbJwk @0:37](https://youtu.be/W8yZB1PbJwk?t=37) | **Dynazty – Land Of Broken Dreams**（×4, 0.96） | 4サンプル一致 |
| ACE+ - You Will Know Our Name | 2017/太陽/インター | [y3XCzJP3rRQ @0:14](https://youtu.be/y3XCzJP3rRQ?t=14) | **RichaadEB – You Will Know Our Names**（×1, 0.96） | **1サンプルのみ**。要慎重。原曲はゼノブレイドのMetal Cover |

---

## 採用しない方針のもの（参考）

以下は弱い候補（humming 0.8前後の単発、または競合多数）なので、**music.jsonには入れない予定**です。後で別ソースで判明したらその時追加でOK。

OK - 2025/月/インター（JjKwVU77g8g） — Evan – Blue Lightning ×2, 0.8
? - 2024/月/インター（HdAmClHPB14） — No match
NG - 2023/月/インター（-bH8FqXPb7Y） — Van Canto – Paranoid ×1, 0.83
? - 2021/月/インター（Xjn7dTq6A_E） — KellySIMONZ ×2, 0.8
OK - 2018/月/インター（RtJ0g8bd2k8） — Arc System Works "Blue Water Blue Sky" ×3, 0.85（参考）
? - 2017/月/インター（uBfJ8XBCfy0） — No match
? - 2015/月/インター（Bj8oP2xUFmw） — Alcatrazz / Testament ×1, 0.8
? - 2014/月/二部（DyzmN-zRJOo） — No match
? - 2012/月/インター（TpQLbCQKOww） — No match
OK - 2024/太陽/入場（PwR0vZzBEpc） — Onlap "Rock Ain't Dead" ×3, 0.8（境界線。気になるなら追加判定可）
? - 2023/太陽/インター（3IwG1BJ_rdY） — Lame Genie ×1, 0.8
? - 2019/太陽/インター（mn2A8uk8UY0） — No match
? - 2018/太陽/インター（GWvg91GhT9g） — No match
? - 2013/太陽/インター（nips7NGWF_I） — No match
? - 2012/太陽/インター（kHiENfANObQ） — Natsumi Kon ×1, 0.8

---

## 試聴後の渡し方

判定が終わったら、このファイルに `OK/NG/?` を書き込んで僕に渡すでも、チャットで「グループAは全OK、Bは#21だけNG、Cは全部OK」みたいな伝え方でも、どっちでもOKです。

採用が決まったエントリだけ、music.jsonに以下のフォーマットで追記します：

```json
{
  "title": "曲名",
  "artist": "アーティスト",
  "source": "ACRCloud音源認識: 動画タイトル",
  "sourceUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "verified": true
}
```

`source` の文言と `verified` の扱いについて方針が決まれば、そっちに合わせます。
