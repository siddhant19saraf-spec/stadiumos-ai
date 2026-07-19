import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface AccessibleTableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption?: string;
  summary?: string;
  ariaLabel?: string;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  emptyMessage?: string;
}

export function AccessibleTable<T extends { id: string }>({
  data, columns, caption, summary, ariaLabel, onSort, sortKey, sortDirection, emptyMessage = "No data available.",
}: AccessibleTableProps<T>) {
  if (data.length === 0) {
    return (
      <div role="status" className="flex items-center justify-center py-12 text-sm text-white/40">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table
        className="w-full text-sm"
        aria-label={ariaLabel}
        summary={summary}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60 ${col.sortable ? "cursor-pointer hover:text-white/80" : ""}`}
                style={col.width ? { width: col.width } : undefined}
                aria-sort={
                  sortKey === col.key
                    ? sortDirection === "asc" ? "ascending" : "descending"
                    : undefined
                }
                onClick={() => col.sortable && onSort?.(col.key)}
                tabIndex={col.sortable ? 0 : undefined}
                onKeyDown={(e) => { if (col.sortable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSort?.(col.key); } }}
              >
                {col.header}
                {sortKey === col.key && (
                  <span aria-hidden="true" className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((item, index) => (
            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-white/80">
                  {col.render(item, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccessibleTableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden" role="status" aria-label="Loading table data">
      <div className="sr-only">Loading table data...</div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex border-b border-white/5 last:border-0">
          {Array.from({ length: columns }, (_, c) => (
            <div key={c} className="flex-1 px-4 py-3">
              <div className="h-4 rounded bg-white/10 animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
