import { env } from '@/shared/lib/env';
import axios, { AxiosHeaders } from 'axios';
import { z } from 'zod';
import { handleUnauthorizedSession } from './unauthorized-session';

declare module 'axios' {
  export interface AxiosRequestConfig {
    suppressSessionInvalidation?: boolean;
  }
}

const ACCESS_TOKEN_STORAGE_KEY = 'babki.accessToken';

const canUseLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const getStoredAccessToken = () => {
  if (!canUseLocalStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const setAccessToken = (accessToken: string) => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
};

export const clearAccessToken = () => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const getAccessToken = () => {
  if (env.USE_LOCAL_AUTH_TOKEN) {
    return env.LOCAL_AUTH_TOKEN ?? null;
  }

  return getStoredAccessToken();
};

export const apiClient = axios.create({
  baseURL: env.BASE_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    const headers = new AxiosHeaders(config.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);

    return {
      ...config,
      headers,
    };
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const authorizationHeader = error.config?.headers
        ? new AxiosHeaders(error.config.headers).get('Authorization')
        : null;

      const groupMatch = error.config?.url?.match(/\/groups\/([a-f\d]{24})\//i);
      if (groupMatch && (error.response?.status === 403 || error.response?.status === 404)
        && authorizationHeader === `Bearer ${getAccessToken()}`) {
        window.dispatchEvent(new CustomEvent('babki:budget-access', {
          detail: { status: error.response.status, groupId: groupMatch[1] },
        }));
      }

      handleUnauthorizedSession({
        status: error.response?.status,
        url: error.config?.url,
        authorization: typeof authorizationHeader === 'string'
          ? authorizationHeader
          : null,
        currentAuthorization: (() => {
          const currentAccessToken = getAccessToken();
          return currentAccessToken ? `Bearer ${currentAccessToken}` : null;
        })(),
        suppressSessionInvalidation: error.config?.suppressSessionInvalidation,
      });
    }

    return Promise.reject(error);
  },
);

export const parseWithSchema = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  payload: unknown,
): z.infer<TSchema> | null => {
  const { success, data } = schema.safeParse(payload);
  if (success) {
    return data;
  }
  return null;
};
