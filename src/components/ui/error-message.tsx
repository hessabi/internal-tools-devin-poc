export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}
