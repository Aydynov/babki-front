import { JoinInvitation } from '@/features/group-invitations';
import { AuthShell } from '@/widgets/auth-shell';

export function JoinPage({ userId, invitationVersion }: {
  userId: string | null;
  invitationVersion: number;
}) {
  return (
    <AuthShell>
      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Совместные финансы</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Приглашение в группу</h1>
      </div>
      <JoinInvitation key={`${userId ?? 'anonymous'}-${invitationVersion}`} userId={userId} />
    </AuthShell>
  );
}
