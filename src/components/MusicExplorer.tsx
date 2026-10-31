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
const columns: { key: SortKey; label: string }[] = [
  { key: "year", label: "年度" }, { key: "group", label: "部門" }, { key: "scene", label: "場面" },
  { key: "title", label: "曲名" }, { key: "artist", label: "アーティスト" },
];
const pageSize = 30;

export default function MusicExplorer({ entries, searchable = false }: { entries: PublicTrack[]; searchable?: boolean }) {
  const id = useId();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "year", direction: "desc" });
  const [page, setPage] = useState(1);
  const resultsHeading = useRef<HTMLDivElement>(null);
  const years = useMemo(() => [...new Set(entries.map((entry) => entry.year))].sort((a, b) => b - a), [entries]);
  const groups = useMemo(() => [...new Set(entries.map((entry) => entry.group))], [entries]);

  useEffect(() => {
    if (!searchable) return;
    const readFilters = () => {
      const params = new URLSearchParams(location.search);
      setFilters({ q: params.get("q") ?? "", year: params.get("year") ?? "", group: params.get("group") ?? "", scene: params.get("scene") ?? "" });
      setPage(1);
    };
    readFilters();
    window.addEventListener("popstate", readFilters);
    return () => window.removeEventListener("popstate", readFilters);
  }, [searchable]);

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
      const order = sort.key === "year" ? a.year - b.year
        : sort.key === "scene" ? scenes.indexOf(a.scene) - scenes.indexOf(b.scene)
        : collator.compare(String(a[sort.key]), String(b[sort.key]));
      return sort.direction === "asc" ? order : -order;
    });
  }, [entries, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
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

  return (
    <div className="music-explorer">
      {searchable && <div className="search-panel" role="search" aria-label="曲を検索">
        <label className="search-field" htmlFor={`${id}-query`}>
          <span className="sr-only">曲名・アーティスト</span>
          <Search size={20} aria-hidden="true" />
          <Input id={`${id}-query`} type="search" placeholder="曲名・アーティスト" value={filters.q} onChange={(event) => updateFilters({ q: event.target.value })} />
        </label>
        <div className="filter-grid">
          <label htmlFor={`${id}-year`}>年度
            <select id={`${id}-year`} value={filters.year} onChange={(event) => updateFilters({ year: event.target.value })}>
              <option value="">すべて</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label htmlFor={`${id}-group`}>部門
            <select id={`${id}-group`} value={filters.group} onChange={(event) => updateFilters({ group: event.target.value })}>
              <option value="">すべて</option>{groups.map((group) => <option key={group}>{group}</option>)}
            </select>
          </label>
          <label htmlFor={`${id}-scene`}>場面
            <select id={`${id}-scene`} value={filters.scene} onChange={(event) => updateFilters({ scene: event.target.value })}>
              <option value="">すべて</option>{scenes.map((scene) => <option key={scene}>{scene}</option>)}
            </select>
          </label>
        </div>
      </div>}

      <div className="results-toolbar" ref={resultsHeading} tabIndex={-1}>
        <p role="status" aria-live="polite"><strong>{filtered.length.toLocaleString("ja")}</strong> 件{filtered.length > 0 && <span className="results-range"> / {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}件を表示</span>}</p>
        {hasFilters && <Button variant="ghost" className="reset-button" onClick={() => updateFilters(emptyFilters)}><X />クリア</Button>}
        <label className="mobile-sort">
          <ArrowDownUp size={16} aria-hidden="true" /><span className="sr-only">並び順</span>
          <select value={`${sort.key}-${sort.direction}`} onChange={(event) => {
            const [key, direction] = event.target.value.split("-") as [SortKey, "asc" | "desc"];
            setSort({ key, direction }); setPage(1);
          }}>
            <option value="year-desc">新しい年度順</option><option value="year-asc">古い年度順</option>
            <option value="title-asc">曲名順</option><option value="title-desc">曲名の逆順</option>
            <option value="artist-asc">アーティスト順</option><option value="artist-desc">アーティストの逆順</option>
            <option value="group-asc">部門順</option><option value="group-desc">部門の逆順</option>
            <option value="scene-asc">場面順</option><option value="scene-desc">場面の逆順</option>
          </select>
        </label>
      </div>

      {visible.length ? <div className="records-surface">
        <table className="records-table" role="table" aria-label="曲の検索結果">
          <thead role="rowgroup"><tr role="row">{columns.map(({ key, label }) => <th role="columnheader" scope="col" key={key} aria-sort={sort.key === key ? sort.direction === "asc" ? "ascending" : "descending" : "none"}>
            <span className="mobile-column-label">{label}</span><button type="button" onClick={() => sortBy(key)}>{label}<ArrowDownUp size={13} aria-hidden="true" /></button>
          </th>)}</tr></thead>
          <tbody role="rowgroup">{visible.map((entry, index) => <tr role="row" key={`${entry.year}-${entry.group}-${entry.scene}-${entry.title}-${index}`} className={entry.status === "unknown" ? "is-unknown" : undefined}>
            <td role="cell" className="track-year"><a href={`/years/${entry.year}/`} aria-label={`${entry.year}年度の曲と動画を見る`}>{entry.year}<span className="mobile-year-label">年度</span></a></td>
            <td role="cell" className="track-group"><Badge variant="secondary" className={entry.group === "太陽" || entry.group === "赤" ? "group-sun" : "group-moon"}>{entry.group}</Badge></td>
            <td role="cell" className="track-scene">{entry.scene}</td>
            <td role="cell" className="track-title">{entry.title}</td>
            <td role="cell" className="track-artist">{entry.artist}</td>
          </tr>)}</tbody>
        </table>
      </div> : <div className="empty-results"><Music2 size={30} aria-hidden="true" /><h3>該当する曲が見つかりませんでした</h3><p>キーワードや絞り込み条件を変えてみてください。</p><Button variant="outline" onClick={() => updateFilters(emptyFilters)}>絞り込みをクリア</Button></div>}

      {pageCount > 1 && <nav className="pagination" aria-label="曲一覧のページ">
        <Button variant="outline" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}><ChevronLeft />前へ</Button>
        <span>{currentPage} <span className="source-note">/ {pageCount}</span></span>
        <Button variant="outline" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>次へ<ChevronRight /></Button>
      </nav>}
    </div>
  );
}
