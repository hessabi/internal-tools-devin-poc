import { Button } from "@/components/ui/button";

export function SubmitButton({
  label,
  pending,
  variant,
}: {
  label: string;
  pending: boolean;
  variant: "primary" | "secondary";
}) {
  return (
    <Button
      className="disabled:cursor-wait"
      disabled={pending}
      type="submit"
      variant={variant === "primary" ? "default" : "outline"}
    >
      {pending ? "Saving..." : label}
    </Button>
  );
}
