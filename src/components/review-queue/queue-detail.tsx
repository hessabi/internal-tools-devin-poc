import { Card, CardContent } from "@/components/ui/card";
import type { ReviewItem, ReviewQueueConfig } from "@/lib/review-queue/types";

export function QueueDetail<Item extends ReviewItem>({
  config,
  item,
}: {
  config: ReviewQueueConfig<Item>;
  item: Item;
}) {
  return (
    <Card>
      <CardContent>
        <dl className="grid gap-5 sm:grid-cols-2">
          {config.detailFields.map((field) => (
            <div key={field.key}>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{field.label}</dt>
              <dd className="mt-1 text-sm">{field.render(item)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
