import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { usersApi } from './users.api';
import type { UpdateUserDto } from '../model/schemas';
import { shouldRetryCurrentUserQuery } from '../model/session-query';

export const usersQueryKeys = {
  all: ['users'] as const,
  me: () => [...usersQueryKeys.all, 'me'] as const,
};

export const usersQueryOptions = {
  me: () => queryOptions({
    queryKey: usersQueryKeys.me(),
    queryFn: () => usersApi.me(),
    retry: shouldRetryCurrentUserQuery,
  }),
};

export const useUpdateCurrentUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: (payload: UpdateUserDto) => usersApi.updateMe(payload),
      onSuccess: (user) => {
        queryClient.invalidateQueries({ queryKey: usersQueryKeys.all }).catch(() => undefined);
        queryClient.setQueryData(usersQueryKeys.me(), user);
      },
    }),
  );
};
