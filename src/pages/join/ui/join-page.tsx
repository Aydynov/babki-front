import { JoinInvitation } from '@/features/space-invitations';
import { AuthShell } from '@/widgets/auth-shell';

export function JoinPage({ userId, invitationVersion }: {
  userId: string | null;
  invitationVersion: number;
}) {
  const content = (
    <>
      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Совместные финансы</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Приглашение в пространство</h1>
      </div>
      <JoinInvitation key={`${userId ?? 'anonymous'}-${invitationVersion}`} userId={userId} />
    </>
  );
  return userId ? (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8">{content}</main>
  ) : <AuthShell>{content}</AuthShell>;
}
