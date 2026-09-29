import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        <Button asChild size="sm" variant="outline">
          <Link href={makeHref(page - 1)}>Previous</Link>
        </Button>
      ) : <span />}
      <span className="text-muted-foreground">Page {page} of {pageCount}</span>
      {page < pageCount ? (
        <Button asChild size="sm" variant="outline">
          <Link href={makeHref(page + 1)}>Next</Link>
        </Button>
      ) : <span />}
    </nav>
  );
}
