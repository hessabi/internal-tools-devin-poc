export function logError(
  event: string,
  fields: { id?: string; actorId?: string; code?: string },
): void {
  console.error(JSON.stringify({ event, ...fields }));
}
