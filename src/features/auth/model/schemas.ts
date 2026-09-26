import { z } from 'zod';
import { userSchema } from '@/entities/users';
import {
  authAccessTokenSchema,
  recoveryCodesSchema,
  twoFactorChallengeResponseSchema,
} from './auth-form';

export {
  authAccessTokenSchema,
  authChallengeTokenSchema,
  confirmTwoFactorSetupSchema,
  defaultLoginFormValues,
  defaultRegisterFormValues,
  disableTwoFactorSchema,
  getAuthMutationErrorKey,
  getAuthValidationKey,
  loginSchema,
  mapRegisterRequest,
  recoveryCodeSchema,
  recoveryCodesSchema,
  regenerateRecoveryCodesSchema,
  registerSchema,
  registerRequestSchema,
  totpCodeSchema,
  twoFactorChallengeResponseSchema,
  twoFactorLoginSchema,
  twoFactorSetupResponseSchema,
  twoFactorSetupSchema,
  twoFactorStatusSchema,
} from './auth-form';
export type {
  ConfirmTwoFactorSetupDto,
  DisableTwoFactorDto,
  LoginDto,
  RegenerateRecoveryCodesDto,
  RegisterDto,
  RegisterRequestDto,
  TwoFactorLoginDto,
  TwoFactorSetupDto,
  TwoFactorSetupResponse,
  TwoFactorStatus,
} from './auth-form';

export const authResponseSchema = z.object({
  accessToken: authAccessTokenSchema,
  user: userSchema,
});

export const loginResponseSchema = z.union([
  authResponseSchema,
  twoFactorChallengeResponseSchema,
]);

export const recoveryCodesAuthResponseSchema = authResponseSchema.extend({
  recoveryCodes: recoveryCodesSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RecoveryCodesAuthResponse = z.infer<typeof recoveryCodesAuthResponseSchema>;
export type TwoFactorChallengeResponse = z.infer<typeof twoFactorChallengeResponseSchema>;
