# 年度別動画数の全件点検

確認日: 2026-11-06（日本時間）

このレポートは初回点検時点（395本）の記録。以降の再抽出で2004年度の月・二部を1本追加し、2020年度は開催中止の例外として扱うことになった。最新の結果は [不足動画の再抽出](2026-11-06-post-2000-missing-videos.md) を参照。

## 対象と数え方

- `src/data/years.json` の確認済み45年度（1982〜2026年度）を対象に、`src/data/media.json` の確認済み個別動画395本を全件集計した。
- 基準は赤（太陽）・白（月）それぞれ「入場・一部・インター・二部・三部・退場」の6場面、合計12本。
- 「1部・2部・3部」は「一部・二部・三部」、「移動」は不足場面の照合上「インター」と同じ枠で数えた。元データの表記は変更していない。
- 再生リスト7件は個別動画数に含めない。撮影位置違い・音声版は、異なる動画IDなら別の1本として数えた。
- 全395本のURL形式・年度分類・場面分類を確認。同一年度内の動画ID重複はなかった。
- 登録データの点検であり、YouTube上の現在の公開状態・再生可否や、未登録動画の有無は今回確認していない。「不足」は個別動画の未登録を意味する。

## 結果

- 12本未満: 18年度（不足枠合計160場面）
- ちょうど12本: 25年度（すべて12場面がそろっている）
- 12本超: 2年度（いずれも12場面がそろい、別版を含む）

## 12本未満の年度

| 年度 | 登録動画数 | 不足数 | 赤・太陽の不足場面 | 白・月の不足場面 |
| --- | ---: | ---: | --- | --- |
| 1982 | 0 | 12 | 全6場面 | 全6場面 |
| 1983 | 0 | 12 | 全6場面 | 全6場面 |
| 1984 | 0 | 12 | 全6場面 | 全6場面 |
| 1985 | 0 | 12 | 全6場面 | 全6場面 |
| 1986 | 0 | 12 | 全6場面 | 全6場面 |
| 1987 | 0 | 12 | 全6場面 | 全6場面 |
| 1988 | 0 | 12 | 全6場面 | 全6場面 |
| 1990 | 0 | 12 | 全6場面 | 全6場面 |
| 1991 | 0 | 12 | 全6場面 | 全6場面 |
| 1993 | 0 | 12 | 全6場面 | 全6場面 |
| 2001 | 4 | 8 | インター、三部、退場 | 入場、一部、インター、三部、退場 |
| 2002 | 4 | 8 | 入場、インター、三部、退場 | 入場、インター、三部、退場 |
| 2004 | 9 | 3 | 退場 | 二部、退場 |
| 2005 | 9 | 3 | なし | 入場、インター、退場 |
| 2006 | 7 | 5 | 入場、インター、退場 | インター、退場 |
| 2013 | 11 | 1 | なし | インター |
| 2020 | 1 | 11 | 全6場面 | 入場、一部、インター、三部、退場 |
| 2021 | 11 | 1 | なし | 三部 |

2020年度は「月 二部」の1本のみ登録されている。開催事情などによる例外かどうかは、この登録データだけでは判定していない。

## 12本を超える年度

| 年度 | 登録動画数 | 場面数 | 内訳 |
| --- | ---: | ---: | --- |
| 1994 | 26 | 12 | 通常版12本＋櫓版12本＋白の一部・三部の音声版2本 |
| 2003 | 13 | 12 | 12場面＋赤（太陽）一部の俯瞰版1本 |

## 全45年度の集計

| 年度 | 登録動画数 | 登録場面数 / 12 | 判定 |
| --- | ---: | ---: | --- |
| 1982 | 0 | 0 / 12 | 不足 |
| 1983 | 0 | 0 / 12 | 不足 |
| 1984 | 0 | 0 / 12 | 不足 |
| 1985 | 0 | 0 / 12 | 不足 |
| 1986 | 0 | 0 / 12 | 不足 |
| 1987 | 0 | 0 / 12 | 不足 |
| 1988 | 0 | 0 / 12 | 不足 |
| 1989 | 12 | 12 / 12 | 12本・全場面あり |
| 1990 | 0 | 0 / 12 | 不足 |
| 1991 | 0 | 0 / 12 | 不足 |
| 1992 | 12 | 12 / 12 | 12本・全場面あり |
| 1993 | 0 | 0 / 12 | 不足 |
| 1994 | 26 | 12 / 12 | 別版を含み12本超 |
| 1995 | 12 | 12 / 12 | 12本・全場面あり |
| 1996 | 12 | 12 / 12 | 12本・全場面あり |
| 1997 | 12 | 12 / 12 | 12本・全場面あり |
| 1998 | 12 | 12 / 12 | 12本・全場面あり |
| 1999 | 12 | 12 / 12 | 12本・全場面あり |
| 2000 | 12 | 12 / 12 | 12本・全場面あり |
| 2001 | 4 | 4 / 12 | 不足 |
| 2002 | 4 | 4 / 12 | 不足 |
| 2003 | 13 | 12 / 12 | 別版を含み12本超 |
| 2004 | 9 | 9 / 12 | 不足 |
| 2005 | 9 | 9 / 12 | 不足 |
| 2006 | 7 | 7 / 12 | 不足 |
| 2007 | 12 | 12 / 12 | 12本・全場面あり |
| 2008 | 12 | 12 / 12 | 12本・全場面あり |
| 2009 | 12 | 12 / 12 | 12本・全場面あり |
| 2010 | 12 | 12 / 12 | 12本・全場面あり |
| 2011 | 12 | 12 / 12 | 12本・全場面あり |
| 2012 | 12 | 12 / 12 | 12本・全場面あり |
| 2013 | 11 | 11 / 12 | 不足 |
| 2014 | 12 | 12 / 12 | 12本・全場面あり |
| 2015 | 12 | 12 / 12 | 12本・全場面あり |
| 2016 | 12 | 12 / 12 | 12本・全場面あり |
| 2017 | 12 | 12 / 12 | 12本・全場面あり |
| 2018 | 12 | 12 / 12 | 12本・全場面あり |
| 2019 | 12 | 12 / 12 | 12本・全場面あり |
| 2020 | 1 | 1 / 12 | 不足 |
| 2021 | 11 | 11 / 12 | 不足 |
| 2022 | 12 | 12 / 12 | 12本・全場面あり |
| 2023 | 12 | 12 / 12 | 12本・全場面あり |
| 2024 | 12 | 12 / 12 | 12本・全場面あり |
| 2025 | 12 | 12 / 12 | 12本・全場面あり |
| 2026 | 12 | 12 / 12 | 12本・全場面あり |

## 登録済み動画が一部ある不足年度の内訳

### 2001年度（4本）

- [2001年度 太陽 入場](https://www.youtube.com/watch?v=AWoZcAoDqCQ)
- [2001年度 太陽 1部](https://www.youtube.com/watch?v=4LPLoBnZIVs)
- [2001年度 太陽 2部](https://www.youtube.com/watch?v=bZBd2vRPmJA)
- [2001年度 月 2部](https://www.youtube.com/watch?v=t0q0OCfEBvg)

### 2002年度（4本）

- [2002年度 太陽 1部](https://www.youtube.com/watch?v=SU7WYPbsZsM)
- [2002年度 太陽 2部](https://www.youtube.com/watch?v=2ML8WUIgV6s)
- [2002年度 月 1部](https://www.youtube.com/watch?v=BS6Sgg4CGMU)
- [2002年度 月 2部](https://www.youtube.com/watch?v=XB7wyFLM3EU)

### 2004年度（9本）

- [2004年度 太陽 入場](https://www.youtube.com/watch?v=Anm-2bJPw7U)
- [2004年度 太陽 1部](https://www.youtube.com/watch?v=rCyyucdyqOs)
- [2004年度 太陽 インター](https://www.youtube.com/watch?v=HqRNkeJDw0o)
- [2004年度 太陽 2部](https://www.youtube.com/watch?v=UJPkR-k1F3o)
- [2004年度 太陽 3部](https://www.youtube.com/watch?v=ElZXC1fi4k4)
- [2004年度 月 入場](https://www.youtube.com/watch?v=VXJIPVx4CMU)
- [2004年度 月 1部](https://www.youtube.com/watch?v=_Q50pVtkh34)
- [2004年度 月 インター](https://www.youtube.com/watch?v=IWMy3_6EwpA)
- [2004年度 月 3部](https://www.youtube.com/watch?v=XPtwRYGb-I0)

### 2005年度（9本）

- [2005年度 太陽 入場](https://www.youtube.com/watch?v=ta9bsH6ibLQ)
- [2005年度 太陽 1部](https://www.youtube.com/watch?v=o9yXXRtT5cg)
- [2005年度 太陽 インター](https://www.youtube.com/watch?v=ImwfQ56iOto)
- [2005年度 太陽 2部](https://www.youtube.com/watch?v=qS1ZrAWLjtI)
- [2005年度 太陽 3部](https://www.youtube.com/watch?v=OYczahTg0IU)
- [2005年度 太陽 退場](https://www.youtube.com/watch?v=RxeqjS2u374)
- [2005年度 月 1部](https://www.youtube.com/watch?v=JzGGhG3-rYw)
- [2005年度 月 2部](https://www.youtube.com/watch?v=2IcD3Nqkoa8)
- [2005年度 白 三部](https://www.youtube.com/watch?v=EsVNVNGoUKI)

### 2006年度（7本）

- [2006年度 太陽 1部](https://www.youtube.com/watch?v=GqU1qoOl_d0)
- [2006年度 太陽 2部](https://www.youtube.com/watch?v=pZ7B5IlSlpY)
- [2006年度 太陽 3部](https://www.youtube.com/watch?v=6B3fGg7Q-rA)
- [2006年度 月 入場](https://www.youtube.com/watch?v=-POljhK3Ar4)
- [2006年度 月 1部](https://www.youtube.com/watch?v=xQSMyagaZyU)
- [2006年度 月 2部](https://www.youtube.com/watch?v=ecCTFVBmTTQ)
- [2006年度 月 3部](https://www.youtube.com/watch?v=ymUFfyonzCk)

### 2013年度（11本）

- [2013年度 太陽 入場](https://www.youtube.com/watch?v=jcy4AQzAyEg)
- [2013年度 太陽 1部](https://www.youtube.com/watch?v=oGMlZUj3LUs)
- [2013年度 太陽 インター](https://www.youtube.com/watch?v=nips7NGWF_I)
- [2013年度 太陽 2部](https://www.youtube.com/watch?v=tbZL6yEd2JE)
- [2013年度 太陽 3部](https://www.youtube.com/watch?v=s6w5jmgDbDI)
- [2013年度 太陽 退場](https://www.youtube.com/watch?v=t4YEamZ33k4)
- [2013年度 月 入場](https://www.youtube.com/watch?v=urLpV775ptU)
- [2013年度 月 1部](https://www.youtube.com/watch?v=A3zJEYSnjbI)
- [2013年度 月 2部](https://www.youtube.com/watch?v=5fFkDszW0zk)
- [2013年度 月 3部](https://www.youtube.com/watch?v=3bwyekb72WI)
- [2013年度 月 退場](https://www.youtube.com/watch?v=oEPrICXytl8)

### 2020年度（1本）

- [2020年度 月 二部 女子（'20 returns・後日再収録）](https://www.youtube.com/watch?v=djugV02c0zI)

### 2021年度（11本）

- [2021年度 太陽 入場](https://www.youtube.com/watch?v=ULmvPN9Mtno)
- [2021年度 太陽 1部](https://www.youtube.com/watch?v=YJZtFSeIC0k)
- [2021年度 太陽 インター](https://www.youtube.com/watch?v=Hh3ex7DezYY)
- [2021年度 太陽 2部](https://www.youtube.com/watch?v=WESm-Oaf5pI)
- [2021年度 太陽 3部](https://www.youtube.com/watch?v=-2QtPKlrDOI)
- [2021年度 太陽 退場](https://www.youtube.com/watch?v=1shp-XSLsm4)
- [2021年度 月 入場](https://www.youtube.com/watch?v=kRxXW_RkcYg)
- [2021年度 月 1部](https://www.youtube.com/watch?v=MrkU8zkp0LE)
- [2021年度 月 インター](https://www.youtube.com/watch?v=Xjn7dTq6A_E)
- [2021年度 月 2部](https://www.youtube.com/watch?v=rzPeM499LVs)
- [2021年度 月 退場](https://www.youtube.com/watch?v=716GWXbSr2U)
