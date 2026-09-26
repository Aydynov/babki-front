import { z } from 'zod';
// Native node:test executes this module without Vite alias resolution and requires the explicit TypeScript entry point.
// eslint-disable-next-line import-x/extensions, import-x/no-useless-path-segments
import { currencyCodeSchema } from '../../../shared/lib/currency/index.ts';

const emailSchema = z.string()
  .trim()
  .min(1, 'required')
  .pipe(z.email('email'));
const passwordSchema = z.string()
  .min(1, 'required')
  .min(8, 'passwordMin')
  .max(128, 'passwordMax');

const dateStringSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  'date',
);

export const authChallengeTokenSchema = z.string()
  .regex(/^[A-Za-z0-9_-]{43}$/, 'challengeToken');

export const totpCodeSchema = z.string()
  .trim()
  .regex(/^\d{6}$/, 'totp');

export const recoveryCodeSchema = z.string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, '').toUpperCase())
  .pipe(z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'recoveryCode'));

const recoveryCodeResponseSchema = z.string()
  .regex(
    /^[0-9A-HJKMNP-TV-Z]{5}(?:-[0-9A-HJKMNP-TV-Z]{5}){3}-[0-9A-HJKMNP-TV-Z]{6}$/,
    'recoveryCode',
  );

export const recoveryCodesSchema = z.array(recoveryCodeResponseSchema)
  .length(10, 'recoveryCodesCount')
  .superRefine((codes, context) => {
    if (new Set(codes).size !== codes.length) {
      context.addIssue({
        code: 'custom',
        message: 'recoveryCodesUnique',
      });
    }
  });

export const twoFactorChallengeResponseSchema = z.object({
  requiresTwoFactor: z.literal(true),
  challengeToken: authChallengeTokenSchema,
  expiresAt: dateStringSchema,
});

const totpLoginSchema = z.object({
  challengeToken: authChallengeTokenSchema,
  method: z.literal('totp'),
  code: totpCodeSchema,
});

const recoveryLoginSchema = z.object({
  challengeToken: authChallengeTokenSchema,
  method: z.literal('recovery'),
  code: recoveryCodeSchema,
});

export const twoFactorLoginSchema = z.discriminatedUnion('method', [
  totpLoginSchema,
  recoveryLoginSchema,
]);

export const twoFactorStatusSchema = z.object({
  status: z.enum(['disabled', 'pending', 'enabled']),
  recoveryCodesRemaining: z.number().int().min(0),
});

export const twoFactorSetupSchema = z.object({
  password: passwordSchema,
});

export const twoFactorSetupResponseSchema = z.object({
  secret: z.string().regex(/^[A-Z2-7]{32}$/, 'totpSecret'),
  otpauthUri: z.string().refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'otpauth:' && url.hostname === 'totp';
    } catch {
      return false;
    }
  }, 'otpauthUri'),
  expiresAt: dateStringSchema,
});

export const confirmTwoFactorSetupSchema = z.object({
  token: totpCodeSchema,
});

const disableWithTotpSchema = z.object({
  password: passwordSchema,
  method: z.literal('totp'),
  code: totpCodeSchema,
});

const disableWithRecoverySchema = z.object({
  password: passwordSchema,
  method: z.literal('recovery'),
  code: recoveryCodeSchema,
});

export const disableTwoFactorSchema = z.discriminatedUnion('method', [
  disableWithTotpSchema,
  disableWithRecoverySchema,
]);

export const regenerateRecoveryCodesSchema = z.object({
  password: passwordSchema,
  token: totpCodeSchema,
});

export const authAccessTokenSchema = z.string()
  .refine((value) => value.trim().length > 0);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'required').max(100, 'nameMax'),
  lastName: z.string().trim().min(1, 'required').max(100, 'nameMax'),
  email: emailSchema,
  password: passwordSchema,
  defaultCurrency: currencyCodeSchema,
});

export const registerRequestSchema = z.object({
  firstName: z.string().trim().min(1, 'required').max(100, 'nameMax'),
  lastName: z.string().trim().min(1, 'required').max(100, 'nameMax'),
  email: emailSchema,
  password: passwordSchema,
  currency: currencyCodeSchema,
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type RegisterRequestDto = z.infer<typeof registerRequestSchema>;
export type TwoFactorLoginDto = z.infer<typeof twoFactorLoginSchema>;
export type TwoFactorStatus = z.infer<typeof twoFactorStatusSchema>;
export type TwoFactorSetupDto = z.infer<typeof twoFactorSetupSchema>;
export type TwoFactorSetupResponse = z.infer<typeof twoFactorSetupResponseSchema>;
export type ConfirmTwoFactorSetupDto = z.infer<typeof confirmTwoFactorSetupSchema>;
export type DisableTwoFactorDto = z.infer<typeof disableTwoFactorSchema>;
export type RegenerateRecoveryCodesDto = z.infer<typeof regenerateRecoveryCodesSchema>;

export const defaultLoginFormValues: LoginDto = {
  email: '',
  password: '',
};

export const defaultRegisterFormValues: RegisterDto = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  defaultCurrency: 'RUB',
};

export const mapRegisterRequest = (values: RegisterDto): RegisterRequestDto => {
  const parsed = registerSchema.parse(values);
  return registerRequestSchema.parse({
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    password: parsed.password,
    currency: parsed.defaultCurrency,
  });
};

interface AuthMutationError {
  response?: {
    status?: number;
  };
}

export const getAuthMutationErrorKey = (
  error: unknown,
  mode: 'login' | 'register',
) => {
  const status = (error as AuthMutationError | null)?.response?.status;

  if (mode === 'login' && status === 401) {
    return 'auth.login.errors.credentials';
  }

  if (mode === 'register' && status === 409) {
    return 'auth.register.errors.emailTaken';
  }

  return 'auth.errors.generic';
};

const authValidationKeys = {
  required: 'validation.required',
  email: 'auth.validation.email',
  passwordMin: 'auth.validation.passwordMin',
  passwordMax: 'auth.validation.passwordMax',
  nameMax: 'auth.validation.nameMax',
  currency: 'auth.validation.currency',
  totp: 'auth.validation.totp',
  recoveryCode: 'auth.validation.recoveryCode',
} as const;

export const getAuthValidationKey = (code: string | undefined) => (
  code && code in authValidationKeys
    ? authValidationKeys[code as keyof typeof authValidationKeys]
    : undefined
);
