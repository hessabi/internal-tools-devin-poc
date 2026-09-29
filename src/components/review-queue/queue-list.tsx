import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <Card className="py-0">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {columns.map((column) => (
              <TableHead className="px-4" key={column.key}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {columns.map((column) => (
                <TableCell className="px-4 py-3" key={column.key}>
                  <Link className="hover:underline" href={`${basePath}/${item.id}`}>
                    {column.render(item)}
                  </Link>
                </TableCell>
              ))}
            </TableRow>
          ))}
          {items.length === 0 ? (
            <TableRow>
              <TableCell className="py-8 text-center text-muted-foreground" colSpan={columns.length}>
                No items match these filters.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Card>
  );
}
