import {
  mutationOptions,
  queryOptions,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  resetUnauthorizedSessionHandling,
  setAccessToken,
} from '@/shared/api';
import { usersQueryKeys } from '@/entities/users';
import { authApi } from './auth.api';
import type {
  AuthResponse,
  ConfirmTwoFactorSetupDto,
  DisableTwoFactorDto,
  LoginDto,
  LoginResponse,
  RecoveryCodesAuthResponse,
  RegenerateRecoveryCodesDto,
  RegisterDto,
  TwoFactorLoginDto,
  TwoFactorChallengeResponse,
  TwoFactorSetupDto,
  TwoFactorSetupResponse,
} from '../model/schemas';
import {
  establishAuthSession,
  type AuthSessionTransition,
} from '../model/session-response';
import { getTwoFactorStatusAfterSetup } from '../model/two-factor-management';

const isAuthResponse = (response: LoginResponse): response is AuthResponse => (
  'accessToken' in response
);

export const authQueryKeys = {
  all: ['auth'] as const,
  twoFactor: () => [...authQueryKeys.all, 'two-factor'] as const,
};

const twoFactorManagementMutationKey = [
  ...authQueryKeys.twoFactor(),
  'management-mutation',
] as const;

export const twoFactorStatusQueryOptions = () => queryOptions({
  queryKey: authQueryKeys.twoFactor(),
  queryFn: () => authApi.getTwoFactorStatus(),
});

const establishSession = (
  queryClient: ReturnType<typeof useQueryClient>,
  authResponse: AuthResponse,
  transition: AuthSessionTransition,
) => {
  if (transition === 'identity-change') {
    window.dispatchEvent(new Event('babki:session-cleared'));
  }
  establishAuthSession(authResponse, {
    clearQueryData: () => queryClient.removeQueries(),
    setAccessToken,
    resetUnauthorizedHandling: resetUnauthorizedSessionHandling,
    setCurrentUser: (user) => queryClient.setQueryData(usersQueryKeys.me(), user),
  }, transition);
};

export const useLoginMutation = (
  onChallenge: (challenge: TwoFactorChallengeResponse) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: async (payload: LoginDto) => {
        const response = await authApi.login(payload);
        if (isAuthResponse(response)) {
          establishSession(queryClient, response, 'identity-change');
          return 'authenticated' as const;
        }

        onChallenge(response);
        return 'challenge' as const;
      },
    }),
  );
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: async (payload: RegisterDto) => {
        const authResponse = await authApi.register(payload);
        establishSession(queryClient, authResponse, 'identity-change');
      },
    }),
  );
};

export const useCompleteTwoFactorLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: async (payload: TwoFactorLoginDto) => {
        const authResponse = await authApi.completeTwoFactorLogin(payload);
        establishSession(queryClient, authResponse, 'identity-change');
      },
    }),
  );
};

export const useTwoFactorStatusQuery = (enabled = true) => useQuery({
  ...twoFactorStatusQueryOptions(),
  enabled,
});

export const useStartTwoFactorSetupMutation = (
  onSetup: (setup: TwoFactorSetupResponse) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationKey: [...twoFactorManagementMutationKey, 'setup'],
      mutationFn: async (payload: TwoFactorSetupDto) => {
        const setup = await authApi.startTwoFactorSetup(payload);
        queryClient.setQueryData(
          authQueryKeys.twoFactor(),
          getTwoFactorStatusAfterSetup(),
        );
        onSetup(setup);
      },
    }),
  );
};

const establishRecoverySession = async (
  queryClient: ReturnType<typeof useQueryClient>,
  response: RecoveryCodesAuthResponse,
  onRecoveryCodes: (codes: string[]) => void,
) => {
  const { recoveryCodes, ...authResponse } = response;
  establishSession(queryClient, authResponse, 'same-user');
  onRecoveryCodes(recoveryCodes);
  await queryClient.invalidateQueries({ queryKey: authQueryKeys.twoFactor() });
};

export const useConfirmTwoFactorSetupMutation = (
  onRecoveryCodes: (codes: string[]) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationKey: [...twoFactorManagementMutationKey, 'confirm'],
      mutationFn: async (payload: ConfirmTwoFactorSetupDto) => {
        const response = await authApi.confirmTwoFactorSetup(payload);
        await establishRecoverySession(queryClient, response, onRecoveryCodes);
      },
    }),
  );
};

export const useDisableTwoFactorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationKey: [...twoFactorManagementMutationKey, 'disable'],
      mutationFn: async (payload: DisableTwoFactorDto) => {
        const response = await authApi.disableTwoFactor(payload);
        establishSession(queryClient, response, 'same-user');
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.twoFactor() });
      },
    }),
  );
};

export const useRegenerateRecoveryCodesMutation = (
  onRecoveryCodes: (codes: string[]) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationKey: [...twoFactorManagementMutationKey, 'regenerate'],
      mutationFn: async (payload: RegenerateRecoveryCodesDto) => {
        const response = await authApi.regenerateRecoveryCodes(payload);
        await establishRecoverySession(queryClient, response, onRecoveryCodes);
      },
    }),
  );
};

export const useTwoFactorManagementPending = () => useIsMutating({
  mutationKey: twoFactorManagementMutationKey,
}) > 0;
