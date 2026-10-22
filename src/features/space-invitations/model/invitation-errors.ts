interface InvitationError {
  response?: { status?: number; headers?: { get?: (key: string) => unknown; [key: string]: unknown } };
}
export const invitationErrorStatus = (error: unknown) => (error as InvitationError | null)?.response?.status;
export const invitationRetryAfter = (error: unknown, now = Date.now()) => {
  if (invitationErrorStatus(error) !== 429) return 0;
  const headers = (error as InvitationError).response?.headers;
  const value = headers?.get?.('retry-after') ?? headers?.['retry-after'];
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
  const date = Date.parse(String(value));
  return Number.isFinite(date) && date > now ? Math.ceil((date - now) / 1000) : 60;
};
