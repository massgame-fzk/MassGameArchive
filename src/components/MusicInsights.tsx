import { useId, useState } from "react";
import { ArrowDownUp, ArrowUpRight, CalendarDays, Disc3, Music2, Repeat2, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { insightScenes, rankArtists, type ArtistInsight, type MusicInsights as InsightData } from "../lib/music-insights";

function Bar({ value, max, tone = "primary" }: { value: number; max: number; tone?: string }) {
  return <svg className={`insight-bar insight-bar-${tone}`} viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
    <rect width="100" height="8" rx="0.6" ry="4" className="bar-track" />
    <rect width={max > 0 ? value / max * 100 : 0} height="8" rx="0.6" ry="4" className="bar-fill" />
  </svg>;
}

function Chapter({ number, title, description, id }: { number: string; title: string; description: string; id: string }) {
  return <div className="insight-chapter-heading" id={id}>
    <span className="insight-chapter-number">{number}</span>
    <div><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div>
  </div>;
}

function ArtistDetail({ artist }: { artist: ArtistInsight }) {
  return <Card className="insight-card artist-detail">
    <CardHeader>
      <span className="insight-kicker">Artist spotlight</span>
      <h3>{artist.name}</h3>
      <p className="insight-caption">{artist.firstYear}〜{artist.lastYear}年度の記録</p>
    </CardHeader>
    <CardContent>
      <div className="artist-detail-stats"><span><strong>{artist.count}</strong> 採用枠</span><span><strong>{artist.years.length}</strong> 年度</span></div>
      <p className="insight-small-heading">どのシーンで選ばれた？</p>
      <div className="scene-profile">
        {insightScenes.map((scene, index) => <div key={scene}>
          <span>{scene}</span><Bar value={artist.sceneCounts[index]} max={Math.max(...artist.sceneCounts, 1)} /><strong>{artist.sceneCounts[index]}</strong>
        </div>)}
      </div>
      <details className="artist-records">
        <summary>採用記録を見る <span>{artist.count}枠</span></summary>
        <ul>{artist.adoptions.map((entry) => <li key={`${entry.year}-${entry.group}-${entry.scene}`}>
          <a href={`/years/${entry.year}/#music`}><span>{entry.year}年度・{entry.group}・{entry.scene}</span><ArrowUpRight size={14} aria-hidden="true" /></a>
          <span>{entry.titles.join(" / ")}</span>
        </li>)}</ul>
      </details>
    </CardContent>
  </Card>;
}

export default function MusicInsights({ data }: { data: InsightData }) {
  const id = useId();
  const [metric, setMetric] = useState<"count" | "years">("count");
  const [selectedId, setSelectedId] = useState(rankArtists(data.artists)[0]?.id ?? "");
  const [scene, setScene] = useState(insightScenes[0]);
  const ranked = rankArtists(data.artists, metric);
  const rankingTies = ranked.slice(10).filter((artist) => artist.value === ranked[9]?.value);
  const selected = data.artists.find((artist) => artist.id === selectedId);
  const sceneIndex = insightScenes.indexOf(scene);
  const sceneLeaders = rankArtists(data.artists.map((artist) => ({ ...artist, count: artist.sceneCounts[sceneIndex] })).filter((artist) => artist.count > 0)).slice(0, 5);
  const topArtists = rankArtists(data.artists).slice(0, 8);
  const overallLeaders = rankArtists(data.artists).filter((artist) => artist.rank === 1);
  const specialists = data.artists.filter((artist) => artist.count >= 4 && artist.sceneCounts.filter(Boolean).length === 1)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja")).slice(0, 3);
  const sideArtists = topArtists.slice(0, 6);
  const sideMax = Math.max(...sideArtists.flatMap((artist) => [artist.sunCount, artist.moonCount]), 1);
  const decadeMax = Math.max(...data.decades.flatMap((decade) => decade.top.map((artist) => artist.count)), 1);
  const firstYear = data.knownYears[0];
  const lastYear = data.knownYears.at(-1)!;
  const yearX = (year: number) => 3 + (year - firstYear) / Math.max(lastYear - firstYear, 1) * 94;
  const units = metric === "count" ? "枠" : "年度";
  const coveragePercent = data.totalSlots ? Math.round(data.knownSlots / data.totalSlots * 100) : 0;

  return <div className="insights-dashboard">
    <div className="insight-summary-grid">
      {[
        { label: "確認済みの曲の記録", value: data.trackCount, unit: "件", note: `重複を除くと${data.uniqueTrackCount}曲`, icon: Disc3 },
        { label: "登場するアーティスト", value: data.artists.length, unit: "組", note: "表記ゆれを一部統合", icon: Users },
        { label: "曲の記録がある年度", value: data.knownYears.length, unit: "年度", note: `${firstYear}〜${lastYear}年度`, icon: CalendarDays },
        { label: "曲が判明しているシーン", value: coveragePercent, unit: "%", note: `登録済み${data.totalSlots}枠中${data.knownSlots}枠`, icon: Music2 },
      ].map(({ label, value, unit, note, icon: Icon }) => <Card className="insight-stat" key={label}>
        <div className="insight-stat-label">{label}<Icon size={16} aria-hidden="true" /></div>
        <p><strong>{value.toLocaleString("ja")}</strong><span>{unit}</span></p>
        <small>{note}</small>
      </Card>)}
    </div>
    <nav className="insight-chapter-nav" aria-label="特集の目次">
      <a href="#artists"><span>01</span> 選ばれる定番</a>
      <a href="#scenes"><span>02</span> シーンと部門</a>
      <a href="#generations"><span>03</span> 世代の変化</a>
      <a href="#returns"><span>04</span> 時を越える曲</a>
    </nav>

    <section className="insight-chapter" aria-labelledby="artists-title">
      <Chapter id="artists" number="01" title="世代を超えて愛される" description="一度に何曲も使われたアーティストと、長く受け継がれたアーティスト。二つのものさしで見てみます。" />
      {overallLeaders.length > 0 && <p className="insight-takeaway">現在の記録で採用枠数が最も多いのは、<strong>{overallLeaders.map((artist) => artist.name).join("、")}</strong>。{overallLeaders.length > 1 ? "それぞれ" : ""}<strong>{overallLeaders[0].count}枠</strong>で採用されています。</p>}
      <div className="insight-ranking-grid">
        <Card className="insight-card">
          <CardHeader>
            <div className="insight-panel-heading"><h3 id={`${id}-artists`}><Trophy size={17} aria-hidden="true" />アーティストランキング</h3><Badge variant="secondary">TOP 10</Badge></div>
            <div className="insight-segment" role="group" aria-label="ランキングの集計方法">
              <Button size="sm" variant={metric === "count" ? "default" : "ghost"} aria-pressed={metric === "count"} onClick={() => setMetric("count")}>採用枠数</Button>
              <Button size="sm" variant={metric === "years" ? "default" : "ghost"} aria-pressed={metric === "years"} onClick={() => setMetric("years")}>採用年度数</Button>
            </div>
            <p className="insight-caption">アーティストを選ぶと、シーンと採用記録が見られます。</p>
          </CardHeader>
          <CardContent>
            <ol className="insight-ranking" aria-label={`アーティストの${metric === "count" ? "採用枠数" : "採用年度数"}ランキング`} aria-live="polite">
              {ranked.slice(0, 10).map((artist) => <li key={artist.id}>
                <button type="button" aria-pressed={selectedId === artist.id} onClick={() => setSelectedId(artist.id)}>
                  <span className={`insight-rank${artist.rank === 1 ? " is-first" : ""}`}>{String(artist.rank).padStart(2, "0")}</span>
                  <span className="insight-rank-body"><span className="insight-rank-label"><span>{artist.name}</span><span><strong>{artist.value}</strong> {units}</span></span><Bar value={artist.value} max={ranked[0]?.value ?? 1} /></span>
                </button>
              </li>)}
            </ol>
            {rankingTies.length > 0 && <details className="insight-ties"><summary>同数のアーティストをさらに見る（{rankingTies.length}組）</summary><ol className="insight-ranking">
              {rankingTies.map((artist) => <li key={artist.id}><button type="button" aria-pressed={selectedId === artist.id} onClick={() => setSelectedId(artist.id)}>
                <span className="insight-rank">{String(artist.rank).padStart(2, "0")}</span><span className="insight-rank-body"><span className="insight-rank-label"><span>{artist.name}</span><span><strong>{artist.value}</strong> {units}</span></span><Bar value={artist.value} max={ranked[0]?.value ?? 1} /></span>
              </button></li>)}
            </ol></details>}
            <p className="insight-caption insight-chart-note">1年度・1部門・1シーンを1枠とし、同じ枠の同一アーティストは1回。採用年度数は同じ年度を1回と数えます。同数は同順位、表示順は名前順です。</p>
          </CardContent>
        </Card>
        {selected && <div aria-live="polite" aria-atomic="true"><ArtistDetail key={selected.id} artist={selected} /></div>}
      </div>
      <Card className="insight-card longevity-card">
        <CardHeader><h3>長く愛されているアーティスト</h3><p className="insight-caption">最初と最後の採用年度の間隔が長い5組。点は、実際に記録がある年度です。</p></CardHeader>
        <CardContent>
          <div className="longevity-axis"><span>{firstYear}年度</span><span>{lastYear}年度</span></div>
          <div className="longevity-list">{data.longevity.map((artist) => <div className="longevity-row" key={artist.id}>
            <div><strong>{artist.name}</strong><span>{artist.firstYear}〜{artist.lastYear} · {artist.years.length}年度で採用</span></div>
            <svg viewBox="0 0 100 12" preserveAspectRatio="none" role="img" aria-label={`${artist.name}：${artist.years.join("、")}年度で採用`}>
              <line x1="3" x2="97" y1="6" y2="6" className="timeline-track" />
              <line x1={yearX(artist.firstYear)} x2={yearX(artist.lastYear)} y1="6" y2="6" className="timeline-span" />
              {artist.years.map((year) => <circle key={year} cx={yearX(year)} cy="6" r="1.5" className="timeline-dot" />)}
            </svg>
          </div>)}</div>
          <p className="insight-caption insight-chart-note">帯の長さは採用期間の間隔を表します。連続して採用された期間ではありません。</p>
        </CardContent>
      </Card>
    </section>

    <section className="insight-chapter" aria-labelledby="scenes-title">
      <Chapter id="scenes" number="02" title="シーンが変われば、顔ぶれも変わる。" description="入場の一曲から、最後の退場まで。シーンや部門ごとに、選ばれてきた音楽を比べます。" />
      <div className="insight-two-column">
        <Card className="insight-card">
          <CardHeader><div className="insight-panel-heading"><h3 id={`${id}-scenes`}>このシーンの定番は？</h3>
            <label className="insight-scene-select"><span className="sr-only">ランキングのシーン</span><select value={scene} onChange={(event) => setScene(event.target.value as typeof scene)}>{insightScenes.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div></CardHeader>
          <CardContent><ol className="scene-ranking" aria-live="polite">{sceneLeaders.map((artist) => <li key={artist.id}>
            <span className="insight-rank">{artist.rank}</span><div><span><strong>{artist.name}</strong><span>{artist.count} 枠</span></span><Bar value={artist.count} max={sceneLeaders[0]?.count ?? 1} /></div>
          </li>)}</ol>
          {sceneLeaders.length > 0 && <p className="insight-caption insight-scene-result">{scene}の最多は{sceneLeaders.filter((artist) => artist.rank === 1).map((artist) => artist.name).join("、")}（{sceneLeaders[0].count}枠）。</p>}
          <p className="insight-caption insight-chart-note">上位5組を表示。同数は同順位・名前順。シーンを切り替えて、顔ぶれを比べてみてください。</p></CardContent>
        </Card>
        <Card className="insight-card">
          <CardHeader><h3>太陽・赤と、月・白。</h3><p className="insight-caption">全体の採用枠数上位6組を、部門ごとに比較。</p>
            <div className="insight-legend"><span><i className="legend-sun" />太陽・赤</span><span><i className="legend-moon" />月・白</span></div>
          </CardHeader>
          <CardContent><div className="side-comparison">{sideArtists.map((artist) => <div key={artist.id}>
            <strong>{artist.name}</strong><div><span className="sr-only">太陽・赤</span><Bar value={artist.sunCount} max={sideMax} tone="sun" /><span>{artist.sunCount}枠</span></div>
            <div><span className="sr-only">月・白</span><Bar value={artist.moonCount} max={sideMax} tone="moon" /><span>{artist.moonCount}枠</span></div>
          </div>)}</div><p className="insight-caption insight-chart-note">部門の記録数や未判明のシーン数に偏りがあります。採用枠数をそのまま比べたグラフです。</p></CardContent>
        </Card>
      </div>
      <Card className="insight-card scene-heatmap-card">
        <CardHeader><h3>定番アーティストの「得意なシーン」</h3><p className="insight-caption">採用枠数上位8組 × 6つのシーン。数字は採用枠数、色が濃いほど多く採用されています。</p></CardHeader>
        <CardContent><div className="insight-table-scroll" role="region" aria-label="シーン別採用枠数の表" tabIndex={0}>
          <table className="scene-heatmap"><thead><tr><th scope="col">アーティスト</th>{insightScenes.map((value) => <th key={value} scope="col">{value}</th>)}</tr></thead>
            <tbody>{topArtists.map((artist) => <tr key={artist.id}><th scope="row">{artist.name}</th>{artist.sceneCounts.map((count, index) => <td key={index}><span className={`heat-${count === 0 ? 0 : Math.min(4, Math.ceil(count / Math.max(...topArtists.flatMap((item) => item.sceneCounts), 1) * 4))}`}>{count || "—"}</span></td>)}</tr>)}</tbody>
          </table>
        </div></CardContent>
      </Card>
      {specialists.length > 0 && <p className="insight-takeaway">シーンをしぼると見える個性。{specialists.map((artist) => <span key={artist.id}><strong>{artist.name}</strong>の{artist.count}枠は、すべて<strong>{insightScenes[artist.sceneCounts.findIndex(Boolean)]}</strong>での採用です。 </span>)}</p>}
    </section>

    <section className="insight-chapter" aria-labelledby="generations-title">
      <Chapter id="generations" number="03" title="世代ごとのマス曲" description="先輩たちが選んだ曲と、後輩たちが選ぶ曲。年代ごとのランキングから、選曲の移り変わりをたどります。" />
      <h3 id={`${id}-generations`} className="insight-small-heading">年代別アーティスト TOP 3</h3>
      <div className="decade-grid">{data.decades.map((decade) => <Card className="insight-card decade-card" key={decade.decade}>
        <CardHeader><h4>{decade.decade}<span>年代</span></h4><p className="insight-caption">記録範囲 {decade.firstYear}〜{decade.lastYear}</p></CardHeader>
        <CardContent><ol>{decade.top.slice(0, 3).map((artist) => <li key={artist.id}><span>{artist.rank}</span><div><strong>{artist.name}</strong><Bar value={artist.count} max={decadeMax} /><small>{artist.count}枠・{artist.years.length}年度</small></div></li>)}</ol>
          {decade.top.length > 3 && <details className="insight-ties"><summary>同順位の{decade.top.length - 3}組を見る</summary><ol>{decade.top.slice(3).map((artist) => <li key={artist.id}><span>{artist.rank}</span><div><strong>{artist.name}</strong><small>{artist.count}枠・{artist.years.length}年度</small></div></li>)}</ol></details>}
          <span className="decade-records">曲の記録 {decade.trackCount}件</span></CardContent>
      </Card>)}</div>
      <p className="insight-caption">棒の長さは全年代で共通の尺度です。各年代の上位3組を表示し、同順位の組は展開して確認できます。同数は同順位・名前順。記録範囲が異なるため、年代をまたいだ枠数の大小だけで人気の変化は判断できません。</p>

      <Card className="insight-card novelty-card">
        <CardHeader><h3>定番の再登場と、記録上の初登場。</h3><p className="insight-caption">曲名とアーティストの組み合わせで比較。過去の年度にも記録がある曲は、どのくらい？</p>
          <div className="insight-legend"><span><i className="legend-primary" />記録上の初登場</span><span><i className="legend-returning" />過去年度にも登場</span></div>
        </CardHeader>
        <CardContent><div className="novelty-list">{data.novelty.map((item) => <div className="novelty-row" key={item.decade}>
          <strong>{item.decade}年代</strong><div><svg viewBox="0 0 100 14" preserveAspectRatio="none" role="img" aria-label={`記録上の初登場${item.first}件、過去年度にも登場${item.returning}件`}>
            <rect width={item.total ? item.first / item.total * 100 : 0} height="14" className="novelty-first" />
            <rect x={item.total ? item.first / item.total * 100 : 0} width={item.total ? item.returning / item.total * 100 : 0} height="14" className="novelty-returning" />
          </svg><span>初登場 {item.first}件 <span>再登場 {item.returning}件（{item.total ? Math.round(item.returning / item.total * 100) : 0}%）</span></span></div>
        </div>)}</div><p className="insight-caption insight-chart-note">未収録の過去の採用は含みません。「記録上の初登場」は新曲や実際の初採用を意味しません。同一年の初登場は、部門・シーンが違っても初登場として数えます。</p></CardContent>
      </Card>
    </section>

    <section className="insight-chapter" aria-labelledby="returns-title">
      <Chapter id="returns" number="04" title="時を越えて、もう一度。" description="違う年に、もう一度選ばれた同じ曲。年度の間には、それぞれのマスゲームがあります。" />
      <p className="insight-takeaway">確認済みの<strong>{data.trackCount}件</strong>の記録に、異なる曲とアーティストの組み合わせは<strong>{data.uniqueTrackCount}曲</strong>。同じアーティストが繰り返し選ばれる一方、曲には幅広い顔ぶれが見られます。</p>
      <h3 id={`${id}-returns`} className="sr-only">複数の年度で採用された曲</h3>
      <div className="returning-grid">{data.returningSongs.map((song) => <Card className="insight-card returning-card" key={`${song.artist}-${song.title}`}>
        <CardHeader><div className="insight-panel-heading"><Repeat2 size={18} aria-hidden="true" /><Badge variant="secondary">初回から{song.years.at(-1)! - song.years[0]}年</Badge></div><h4>{song.title}</h4><p className="insight-caption">{song.artist}</p></CardHeader>
        <CardContent><div className="returning-timeline">{song.years.map((year) => <a key={year} href={`/years/${year}/#music`}><span aria-hidden="true" />{year}<small>年度</small></a>)}</div>
          <p className="insight-caption">{song.appearances.map((appearance) => `${appearance.year} ${appearance.group} ${appearance.scene}`).join(" / ")}</p>
        </CardContent>
      </Card>)}</div>
      {!data.returningSongs.length && <p className="insight-caption">複数年度での採用が確認できた曲は、まだありません。</p>}
      <p className="insight-caption">同じアーティスト・同じ曲名の記録を集計しています。ミックス名・バージョン名が異なる曲は別曲として扱います。</p>
    </section>

    <section className="insight-methodology" aria-labelledby={`${id}-method`}>
      <div><ArrowDownUp size={20} aria-hidden="true" /><h2 id={`${id}-method`}>この数字について</h2></div>
      <p>確認済みの曲名・アーティストがそろった記録から集計しています。未判明の曲はランキングの対象外です。数字は、記録が増えると変わります。</p>
      <details><summary>集計のルールを読む</summary><ul>
        <li>アーティストの採用枠数は「年度・部門・シーン」ごとに1回。同じ枠で複数曲を使っても1回です。複数アーティストの連名は、分割せず1組として扱います。</li>
        <li>英字の大小、全角・半角、連続する空白を統一しています。Dragon Force / DragonForce、White Snake / Whitesnake、FabreDrive / Fabre Driveはそれぞれまとめています。その他の異なる表記は別のアーティストとして残しています。</li>
        <li>曲の件数は同じ曲の複数年度・部門・シーンでの採用を含みます。重複を除く曲数は「曲名とアーティスト」の組み合わせです。</li>
        <li>判明しているシーンの割合は、登録済みの年度・部門レコードにある6シーンを母数としています。全開催年度の網羅率ではありません。</li>
        <li>年代別の初登場・再登場は「曲・年度・部門・シーン」ごとに数え、同じ枠の同じ曲の重複は除きます。初登場の判定には全期間の記録を使います。</li>
        <li>過去の記録には未判明・未収録の部分があり、アーティストの人気や選曲理由を直接示すものではありません。</li>
      </ul></details>
      <a className="text-link" href="/contribute/">あなたの知っている一曲を、記録に。<ArrowUpRight size={16} aria-hidden="true" /></a>
    </section>
  </div>;
}
