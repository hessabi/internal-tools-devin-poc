import Link from "next/link";
import type { ColumnDef, ReviewItem } from "@/lib/review-queue/types";

export function QueueList<Item extends ReviewItem>({
  items,
  columns,
  basePath,
}: {
  items: Item[];
  columns: readonly ColumnDef<Item>[];
  basePath: string;
}) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 font-medium" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className="border-t border-slate-200" key={item.id}>
              {columns.map((column) => (
                <td className="px-4 py-3" key={column.key}>
                  <Link className="hover:underline" href={`${basePath}/${item.id}`}>
                    {column.render(item)}
                  </Link>
                </td>
              ))}
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length}>
                No items match these filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
