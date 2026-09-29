import Link from "next/link";
import type { FilterDef } from "@/lib/review-queue/types";

export function QueueFilters({
  filters,
  values,
}: {
  filters: readonly FilterDef[];
  values: Record<string, string | string[] | undefined>;
}) {
  return (
    <form className="flex flex-wrap items-end gap-4 rounded border border-slate-200 bg-white p-4" method="get">
      {filters.map((filter) => (
        <label className="flex min-w-36 flex-col gap-1 text-sm" key={filter.key}>
          <span className="font-medium">{filter.label}</span>
          <select className="rounded border border-slate-300 px-2 py-2" name={filter.key} defaultValue={typeof values[filter.key] === "string" ? values[filter.key] : ""}>
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
        Apply filters
      </button>
      <Link className="px-2 py-2 text-sm text-slate-600 hover:underline" href="?">
        Clear filters
      </Link>
    </form>
  );
}
