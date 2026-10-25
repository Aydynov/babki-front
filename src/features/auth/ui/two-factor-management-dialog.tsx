import { Dialog as DialogPrimitive } from '@base-ui/react';
import {
  LucideShieldCheck,
  LucideX,
} from 'lucide-react';
import { useEffect, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { env } from '@/shared/lib/env';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Typography } from '@/shared/ui/typography';
import {
  useTwoFactorManagementPending,
  useTwoFactorStatusQuery,
} from '../api/auth.query';
import {
  canDismissTwoFactorManagement,
  canStartTwoFactorLifecycle,
  createTwoFactorManagementState,
  expireProvisioning,
  getTwoFactorManagementCloseCleanup,
  showManagementError,
  showProvisioning,
  showRecoveryCodes,
  showTwoFactorStatus,
  startDisable,
  startRecoveryRegeneration,
  startSetupAuthorization,
  type TwoFactorManagementState,
} from '../model/two-factor-management';
import { TwoFactorDisableForm } from './two-factor-disable-form';
import { TwoFactorProvisioningForm } from './two-factor-provisioning-form';
import { TwoFactorRecoveryCodesView } from './two-factor-recovery-codes-view';
import { TwoFactorRegenerateForm } from './two-factor-regenerate-form';
import { TwoFactorSetupForm } from './two-factor-setup-form';
import { useRetryAfter } from './use-retry-after';

export function TwoFactorManagementDialog({ open: controlledOpen, onOpenChange, finalFocus }: {
  open?: boolean; onOpenChange?: (open: boolean) => void; finalFocus?: RefObject<HTMLButtonElement | null>;
} = {}) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [state, setState] = useState<TwoFactorManagementState>(
    createTwoFactorManagementState,
  );
  const statusQuery = useTwoFactorStatusQuery(open);
  const lifecyclePending = useTwoFactorManagementPending();
  const retryAfter = useRetryAfter();

  useEffect(() => {
    if (!open) return;
    if (statusQuery.isFetching) return;
    if (statusQuery.isError) {
      setState(showManagementError());
      return;
    }
    if (statusQuery.data && (state.view === 'loading' || state.view === 'error')) {
      setState(showTwoFactorStatus(statusQuery.data));
    }
  }, [
    open,
    state.view,
    statusQuery.data,
    statusQuery.isError,
    statusQuery.isFetching,
  ]);

  if (env.USE_LOCAL_AUTH_TOKEN) {
    return null;
  }

  const closeDialog = () => {
    if (!canDismissTwoFactorManagement(
      state,
      recoveryAcknowledged,
      lifecyclePending,
    )) return;
    setOpen(false);
  };

  const handleOpenChangeComplete = (nextOpen: boolean) => {
    const cleanup = getTwoFactorManagementCloseCleanup(nextOpen);
    if (!cleanup) return;
    setRecoveryAcknowledged(false);
    setState(cleanup);
  };

  const showCurrentStatus = () => {
    if (statusQuery.data) {
      setState(showTwoFactorStatus(statusQuery.data));
    } else {
      setState(createTwoFactorManagementState());
      statusQuery.refetch();
    }
  };

  const refreshCurrentStatus = () => {
    setState(createTwoFactorManagementState());
    statusQuery.refetch();
  };

  const finishRecoveryCodes = async () => {
    setRecoveryAcknowledged(false);
    setState(createTwoFactorManagementState());
    const result = await statusQuery.refetch();
    if (result.data) setState(showTwoFactorStatus(result.data));
    else if (result.isError) setState(showManagementError());
  };

  const titleKey = state.view === 'setup' || state.view === 'confirmation'
    ? 'auth.twoFactor.setup.title'
    : state.view === 'recovery'
      ? 'auth.twoFactor.recovery.title'
      : state.view === 'regeneration'
        ? 'auth.twoFactor.recovery.regenerateTitle'
        : state.view === 'disable'
          ? 'auth.twoFactor.disable.title'
          : 'auth.twoFactor.management.title';

  return (
    <Dialog.Base
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setState(createTwoFactorManagementState());
          setOpen(true);
        } else {
          closeDialog();
        }
      }}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      {controlledOpen === undefined && (
      <DialogPrimitive.Trigger
        render={(
          <Button.Base
            type="button"
            variant="outline"
            aria-label={t('auth.twoFactor.management.open')}
          />
        )}
      >
        <LucideShieldCheck />
        <span className="hidden sm:inline">{t('auth.twoFactor.management.open')}</span>
      </DialogPrimitive.Trigger>
      )}
      <Dialog.Content
        className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto"
        finalFocus={finalFocus}
      >
        <Dialog.Header>
          <Dialog.Title>{t(titleKey)}</Dialog.Title>
          <Button.Icon
            type="button"
            aria-label={t('auth.twoFactor.management.close')}
            disabled={!canDismissTwoFactorManagement(
              state,
              recoveryAcknowledged,
              lifecyclePending,
            )}
            onClick={closeDialog}
          >
            <LucideX />
          </Button.Icon>
        </Dialog.Header>
        <Dialog.Body>
          {state.view === 'loading' && (
            <Typography.Body3 className="text-muted-foreground" role="status">
              {t('auth.twoFactor.management.loading')}
            </Typography.Body3>
          )}
          {state.view === 'error' && (
            <div className="flex flex-col gap-4">
              <Typography.Body3 className="text-destructive" role="alert">
                {t('auth.errors.generic')}
              </Typography.Body3>
              <Button.Base
                type="button"
                variant="outline"
                onClick={() => {
                  setState(createTwoFactorManagementState());
                  statusQuery.refetch();
                }}
              >
                {t('auth.twoFactor.management.retry')}
              </Button.Base>
            </div>
          )}
          {state.view === 'disabled' && (
            <div className="flex flex-col gap-4">
              <Dialog.Description>{t('auth.twoFactor.management.disabled')}</Dialog.Description>
              <Button.Base
                type="button"
                disabled={!canStartTwoFactorLifecycle(lifecyclePending)}
                onClick={() => setState(startSetupAuthorization())}
              >
                {t('auth.twoFactor.management.enable')}
              </Button.Base>
            </div>
          )}
          {state.view === 'pending' && (
            <div className="flex flex-col gap-4">
              <Dialog.Description>{t('auth.twoFactor.management.pending')}</Dialog.Description>
              <Button.Base
                type="button"
                disabled={!canStartTwoFactorLifecycle(lifecyclePending)}
                onClick={() => setState(startSetupAuthorization())}
              >
                {t('auth.twoFactor.management.restartSetup')}
              </Button.Base>
            </div>
          )}
          {state.view === 'enabled' && (
            <div className="flex flex-col gap-4">
              <Dialog.Description>
                {t('auth.twoFactor.management.enabled', {
                  count: state.recoveryCodesRemaining ?? 0,
                })}
              </Dialog.Description>
              <Button.Base
                type="button"
                variant="outline"
                disabled={!canStartTwoFactorLifecycle(lifecyclePending)}
                onClick={() => setState(startRecoveryRegeneration(
                  state.recoveryCodesRemaining ?? 0,
                ))}
              >
                {t('auth.twoFactor.management.regenerate')}
              </Button.Base>
              <Button.Base
                type="button"
                variant="destructive"
                disabled={!canStartTwoFactorLifecycle(lifecyclePending)}
                onClick={() => setState(startDisable(state.recoveryCodesRemaining ?? 0))}
              >
                {t('auth.twoFactor.management.disable')}
              </Button.Base>
            </div>
          )}
          {state.view === 'setup' && (
            <TwoFactorSetupForm
              onBack={showCurrentStatus}
              retryAfter={retryAfter}
              onStatusChanged={refreshCurrentStatus}
              onSuccess={(setup) => setState(showProvisioning(setup))}
            />
          )}
          {state.view === 'confirmation' && state.provisioning && (
            <TwoFactorProvisioningForm
              setup={state.provisioning}
              onExpired={() => setState(expireProvisioning())}
              onRestart={() => setState(startSetupAuthorization())}
              retryAfter={retryAfter}
              onSuccess={(codes) => setState(showRecoveryCodes(codes))}
            />
          )}
          {state.view === 'recovery' && state.recoveryCodes && (
            <TwoFactorRecoveryCodesView
              codes={state.recoveryCodes}
              onAcknowledgeChange={setRecoveryAcknowledged}
              onDone={finishRecoveryCodes}
            />
          )}
          {state.view === 'regeneration' && (
            <TwoFactorRegenerateForm
              onBack={showCurrentStatus}
              onSuccess={(codes) => setState(showRecoveryCodes(codes))}
              retryAfter={retryAfter}
            />
          )}
          {state.view === 'disable' && (
            <TwoFactorDisableForm
              onBack={showCurrentStatus}
              retryAfter={retryAfter}
              onSuccess={() => setState(showTwoFactorStatus({
                status: 'disabled',
                recoveryCodesRemaining: 0,
              }))}
            />
          )}
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Base>
  );
}
