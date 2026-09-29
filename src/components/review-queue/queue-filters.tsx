import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { FilterDef } from "@/lib/review-queue/types";

export function QueueFilters({
  filters,
  values,
}: {
  filters: readonly FilterDef[];
  values: Record<string, string | string[] | undefined>;
}) {
  const formKey = filters
    .map((filter) => `${filter.key}=${typeof values[filter.key] === "string" ? values[filter.key] : ""}`)
    .join("&");
  return (
    <Card size="sm">
      <CardContent>
        <form className="flex flex-wrap items-end gap-4" key={formKey} method="get">
          {filters.map((filter) => (
            <div className="flex min-w-40 flex-col gap-1.5" key={filter.key}>
              <Label htmlFor={`filter-${filter.key}`}>{filter.label}</Label>
              <NativeSelect
                className="w-full"
                defaultValue={typeof values[filter.key] === "string" ? values[filter.key] : ""}
                id={`filter-${filter.key}`}
                name={filter.key}
              >
                <NativeSelectOption value="">All</NativeSelectOption>
                {filter.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          ))}
          <Button type="submit">Apply filters</Button>
          <Button asChild variant="ghost">
            <Link href="?">Clear filters</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
