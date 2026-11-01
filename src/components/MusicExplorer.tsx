import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, ArrowDownUp, ChevronLeft, ChevronRight, Music2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

export type PublicTrack = {
  year: number; group: string; scene: string; title: string; artist: string; status: "known" | "unknown";
};
type Filters = { q: string; year: string; group: string; scene: string };
type SortKey = "year" | "group" | "scene" | "title" | "artist";
const emptyFilters: Filters = { q: "", year: "", group: "", scene: "" };
const scenes = ["入場", "一部", "インター", "二部", "三部", "退場"];
const groupOrder = ["太陽", "月", "赤", "白", "未整理", "不明"];
const columns: { key: SortKey; label: string }[] = [
  { key: "year", label: "年度" }, { key: "group", label: "部門" }, { key: "scene", label: "シーン" },
  { key: "title", label: "曲名" }, { key: "artist", label: "アーティスト" },
];
const pageSize = 30;

export default function MusicExplorer({ entries, searchable = false, groupedByYear = false }: { entries: PublicTrack[]; searchable?: boolean; groupedByYear?: boolean }) {
  const id = useId();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "year", direction: "desc" });
  const [page, setPage] = useState(1);
  const [activeYear, setActiveYear] = useState<number>();
  const yearNavigation = useRef<HTMLDivElement>(null);
  const resultsHeading = useRef<HTMLDivElement>(null);
  const years = useMemo(() => [...new Set(entries.map((entry) => entry.year))].sort((a, b) => b - a), [entries]);
  const groups = useMemo(() => [...new Set(entries.map((entry) => entry.group))], [entries]);

  useEffect(() => {
    if (!searchable) return;
    const readFilters = () => {
      const params = new URLSearchParams(location.search);
      setFilters({ q: params.get("q") ?? "", year: groupedByYear ? "" : params.get("year") ?? "", group: params.get("group") ?? "", scene: params.get("scene") ?? "" });
      if (groupedByYear && params.has("year")) {
        const url = new URL(location.href);
        url.searchParams.delete("year");
        history.replaceState(null, "", url);
      }
      setPage(1);
    };
    readFilters();
    window.addEventListener("popstate", readFilters);
    return () => window.removeEventListener("popstate", readFilters);
  }, [searchable, groupedByYear]);

  const updateFilters = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setPage(1);
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(next)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(null, "", url);
  };

  const filtered = useMemo(() => {
    const query = filters.q.trim().normalize("NFKC").toLocaleLowerCase("ja");
    const collator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });
    return entries.filter((entry) =>
      (!query || `${entry.title} ${entry.artist} ${entry.status === "unknown" ? "調査中 unknown 未判明" : ""}`.normalize("NFKC").toLocaleLowerCase("ja").includes(query)) &&
      (!filters.year || String(entry.year) === filters.year) &&
      (!filters.group || entry.group === filters.group) &&
      (!filters.scene || entry.scene === filters.scene)
    ).sort((a, b) => {
      if (groupedByYear) {
        return b.year - a.year || groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group) || scenes.indexOf(a.scene) - scenes.indexOf(b.scene);
      }
      const order = sort.key === "year" ? a.year - b.year
        : sort.key === "scene" ? scenes.indexOf(a.scene) - scenes.indexOf(b.scene)
        : collator.compare(String(a[sort.key]), String(b[sort.key]));
      return sort.direction === "asc" ? order : -order;
    });
  }, [entries, filters, sort, groupedByYear]);

  const tracksByYear = useMemo(() => {
    const grouped = new Map<number, PublicTrack[]>();
    for (const entry of filtered) {
      const tracks = grouped.get(entry.year);
      if (tracks) tracks.push(entry);
      else grouped.set(entry.year, [entry]);
    }
    return [...grouped];
  }, [filtered]);

  useEffect(() => {
    const navigation = yearNavigation.current;
    if (!groupedByYear || !navigation) return;
    const updateNavigation = () => {
      const height = navigation.getBoundingClientRect().height;
      navigation.parentElement?.style.setProperty("--music-year-nav-height", `${height}px`);
      const offset = (document.querySelector(".site-header")?.getBoundingClientRect().height ?? 80) + height + 40;
      const current = tracksByYear.findLast(([year]) => {
        const section = document.getElementById(`year-${year}`);
        return section && section.getBoundingClientRect().top <= offset;
      });
      setActiveYear(current?.[0] ?? tracksByYear[0]?.[0]);
    };
    updateNavigation();
    const observer = new ResizeObserver(updateNavigation);
    observer.observe(navigation);
    window.addEventListener("scroll", updateNavigation, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateNavigation);
    };
  }, [groupedByYear, tracksByYear]);

  const pageCount = groupedByYear ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = groupedByYear ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Object.values(filters).some(Boolean);
  const changePage = (next: number) => {
    setPage(next);
    resultsHeading.current?.scrollIntoView({ block: "start" });
    resultsHeading.current?.focus({ preventScroll: true });
  };
  const sortBy = (key: SortKey) => {
    setSort({ key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" });
    setPage(1);
  };

  const renderTable = (tracks: PublicTrack[], label: string) => (
    <div className={`records-surface${groupedByYear ? " music-year-records" : ""}`}>
      <table className="records-table" role="table" aria-label={label}>
        <thead role="rowgroup"><tr role="row">{columns.filter(({ key }) => !groupedByYear || key !== "year").map(({ key, label }) => <th role="columnheader" scope="col" key={key} aria-sort={groupedByYear ? undefined : sort.key === key ? sort.direction === "asc" ? "ascending" : "descending" : "none"}>
          {groupedByYear ? label : <><span className="mobile-column-label">{label}</span><button type="button" onClick={() => sortBy(key)}>{label}<ArrowDownUp size={13} aria-hidden="true" /></button></>}
        </th>)}</tr></thead>
        <tbody role="rowgroup">{tracks.map((entry, index) => <tr role="row" key={`${entry.year}-${entry.group}-${entry.scene}-${entry.title}-${index}`} className={entry.status === "unknown" ? "is-unknown" : undefined}>
          {!groupedByYear && <td role="cell" className="track-year"><a href={`/years/${entry.year}/`} aria-label={`${entry.year}年度の曲と動画を見る`}>{entry.year}<span className="mobile-year-label">年度</span></a></td>}
          <td role="cell" className="track-group"><Badge variant="secondary" className={entry.group === "太陽" || entry.group === "赤" ? "group-sun" : "group-moon"}>{entry.group}</Badge></td>
          <td role="cell" className="track-scene">{entry.scene}</td>
          <td role="cell" className="track-title">{entry.title}</td>
          <td role="cell" className="track-artist">{entry.artist}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );

  return (
    <div className="music-explorer">
      {searchable && <div className="search-panel" role="search" aria-label="曲を検索">
        <label className="search-field" htmlFor={`${id}-query`}>
          <span className="sr-only">曲名・アーティスト</span>
          <Search size={20} aria-hidden="true" />
          <Input id={`${id}-query`} type="search" placeholder="曲名・アーティスト" value={filters.q} onChange={(event) => updateFilters({ q: event.target.value })} />
        </label>
        <div className={`filter-grid${groupedByYear ? " filter-grid-compact" : ""}`}>
          {!groupedByYear && <label htmlFor={`${id}-year`}>年度
            <select id={`${id}-year`} value={filters.year} onChange={(event) => updateFilters({ year: event.target.value })}>
              <option value="">すべて</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>}
          <label htmlFor={`${id}-group`}>部門
            <select id={`${id}-group`} value={filters.group} onChange={(event) => updateFilters({ group: event.target.value })}>
              <option value="">すべて</option>{groups.map((group) => <option key={group}>{group}</option>)}
            </select>
          </label>
          <label htmlFor={`${id}-scene`}>シーン
            <select id={`${id}-scene`} value={filters.scene} onChange={(event) => updateFilters({ scene: event.target.value })}>
              <option value="">すべて</option>{scenes.map((scene) => <option key={scene}>{scene}</option>)}
            </select>
          </label>
        </div>
      </div>}

      <div className="results-toolbar" ref={resultsHeading} tabIndex={-1}>
        <p role="status" aria-live="polite"><strong>{filtered.length.toLocaleString("ja")}</strong> 件{!groupedByYear && filtered.length > 0 && <span className="results-range"> / {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}件を表示</span>}</p>
        {hasFilters && <Button variant="ghost" className="reset-button" onClick={() => updateFilters(emptyFilters)}><X />クリア</Button>}
        {!groupedByYear && <label className="mobile-sort">
          <ArrowDownUp size={16} aria-hidden="true" /><span className="sr-only">並び順</span>
          <select value={`${sort.key}-${sort.direction}`} onChange={(event) => {
            const [key, direction] = event.target.value.split("-") as [SortKey, "asc" | "desc"];
            setSort({ key, direction }); setPage(1);
          }}>
            <option value="year-desc">新しい年度順</option><option value="year-asc">古い年度順</option>
            <option value="title-asc">曲名順</option><option value="title-desc">曲名の逆順</option>
            <option value="artist-asc">アーティスト順</option><option value="artist-desc">アーティストの逆順</option>
            <option value="group-asc">部門順</option><option value="group-desc">部門の逆順</option>
            <option value="scene-asc">シーン順</option><option value="scene-desc">シーンの逆順</option>
          </select>
        </label>}
      </div>

      {visible.length ? groupedByYear ? <>
        <div className="scroll-hint-shell" ref={yearNavigation}>
          <p className="scroll-hint">年度は横にスクロールできます</p>
          <nav className="year-filter" data-music-navigation aria-label="曲の年度">
            {tracksByYear.map(([year]) => <a key={year} href={`#year-${year}`} aria-current={activeYear === year ? "true" : undefined}>{year}</a>)}
          </nav>
        </div>
        <div className="music-years">
          {tracksByYear.map(([year, tracks]) => <section className="music-year" id={`year-${year}`} key={year} aria-labelledby={`year-${year}-title`}>
            <div className="section-heading">
              <h2 id={`year-${year}-title`}>{year}年度</h2>
              <a href={`/years/${year}/`}>年度ページ</a>
            </div>
            {renderTable(tracks, `${year}年度の曲`)}
          </section>)}
        </div>
      </> : renderTable(visible, "曲の検索結果") : <div className="empty-results"><Music2 size={30} aria-hidden="true" /><h3>該当する曲が見つかりませんでした</h3><p>キーワードや絞り込み条件を変えてみてください。</p><Button variant="outline" onClick={() => updateFilters(emptyFilters)}>絞り込みをクリア</Button></div>}

      {pageCount > 1 && <nav className="pagination" aria-label="曲一覧のページ">
        <Button variant="outline" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}><ChevronLeft />前へ</Button>
        <span>{currentPage} <span className="source-note">/ {pageCount}</span></span>
        <Button variant="outline" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>次へ<ChevronRight /></Button>
      </nav>}
    </div>
  );
}
