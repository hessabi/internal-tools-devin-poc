import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  values,
}: {
  page: number;
  pageCount: number;
  values: Record<string, string | string[] | undefined>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string" && value && key !== "page") {
      query.set(key, value);
    }
  }
  const makeHref = (nextPage: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(nextPage));
    return `?${next.toString()}`;
  };
  return (
    <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link className="rounded border border-slate-300 px-3 py-2 hover:bg-white" href={makeHref(page - 1)}>
          Previous
        </Link>
      ) : <span />}
      <span className="text-slate-600">Page {page} of {pageCount}</span>
      {page < pageCount ? (
        <Link className="rounded border border-slate-300 px-3 py-2 hover:bg-white" href={makeHref(page + 1)}>
          Next
        </Link>
      ) : <span />}
    </nav>
  );
}
