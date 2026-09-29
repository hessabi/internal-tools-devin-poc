import type { ReviewItem, ReviewQueueConfig } from "@/lib/review-queue/types";

export function QueueDetail<Item extends ReviewItem>({
  config,
  item,
}: {
  config: ReviewQueueConfig<Item>;
  item: Item;
}) {
  return (
    <dl className="grid gap-4 rounded border border-slate-200 bg-white p-5 sm:grid-cols-2">
      {config.detailFields.map((field) => (
        <div key={field.key}>
          <dt className="text-xs font-medium uppercase text-slate-500">{field.label}</dt>
          <dd className="mt-1">{field.render(item)}</dd>
        </div>
      ))}
    </dl>
  );
}
