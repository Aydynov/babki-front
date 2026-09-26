import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  authResponseSchema,
  confirmTwoFactorSetupSchema,
  type ConfirmTwoFactorSetupDto,
  disableTwoFactorSchema,
  type DisableTwoFactorDto,
  type LoginDto,
  loginResponseSchema,
  loginSchema,
  mapRegisterRequest,
  recoveryCodesAuthResponseSchema,
  regenerateRecoveryCodesSchema,
  type RegenerateRecoveryCodesDto,
  type RegisterDto,
  twoFactorLoginSchema,
  type TwoFactorLoginDto,
  twoFactorSetupResponseSchema,
  twoFactorSetupSchema,
  type TwoFactorSetupDto,
  twoFactorStatusSchema,
} from '../model/schemas';

class AuthApiClient {
  private readonly client = apiClient;

  async login(payload: LoginDto) {
    const body = loginSchema.parse(payload);
    const response = await this.client.post('/auth/login', body);

    return parseRequiredWithSchema(loginResponseSchema, response.data);
  }

  async register(payload: RegisterDto) {
    const body = mapRegisterRequest(payload);
    const response = await this.client.post('/auth/register', body);

    return parseRequiredWithSchema(authResponseSchema, response.data);
  }

  async completeTwoFactorLogin(payload: TwoFactorLoginDto) {
    const body = twoFactorLoginSchema.parse(payload);
    const response = await this.client.post('/auth/login/two-factor', body);

    return parseRequiredWithSchema(authResponseSchema, response.data);
  }

  async getTwoFactorStatus() {
    const response = await this.client.get('/auth/two-factor');

    return parseRequiredWithSchema(twoFactorStatusSchema, response.data);
  }

  async startTwoFactorSetup(payload: TwoFactorSetupDto) {
    const body = twoFactorSetupSchema.parse(payload);
    const response = await this.client.post('/auth/two-factor/setup', body, {
      suppressSessionInvalidation: true,
    });

    return parseRequiredWithSchema(twoFactorSetupResponseSchema, response.data);
  }

  async confirmTwoFactorSetup(payload: ConfirmTwoFactorSetupDto) {
    const body = confirmTwoFactorSetupSchema.parse(payload);
    const response = await this.client.post('/auth/two-factor/setup/confirm', body, {
      suppressSessionInvalidation: true,
    });

    return parseRequiredWithSchema(recoveryCodesAuthResponseSchema, response.data);
  }

  async disableTwoFactor(payload: DisableTwoFactorDto) {
    const body = disableTwoFactorSchema.parse(payload);
    const response = await this.client.post('/auth/two-factor/disable', body, {
      suppressSessionInvalidation: true,
    });

    return parseRequiredWithSchema(authResponseSchema, response.data);
  }

  async regenerateRecoveryCodes(payload: RegenerateRecoveryCodesDto) {
    const body = regenerateRecoveryCodesSchema.parse(payload);
    const response = await this.client.post('/auth/two-factor/recovery/regenerate', body, {
      suppressSessionInvalidation: true,
    });

    return parseRequiredWithSchema(recoveryCodesAuthResponseSchema, response.data);
  }
}

export const authApi = new AuthApiClient();
