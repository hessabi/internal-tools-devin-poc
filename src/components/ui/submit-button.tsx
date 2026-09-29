export function SubmitButton({
  label,
  pending,
  variant,
}: {
  label: string;
  pending: boolean;
  variant: "primary" | "secondary";
}) {
  const style =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-700"
      : "border border-slate-300 hover:bg-slate-50";
  return (
    <button
      className={`mt-3 rounded px-4 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-60 ${style}`}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}
