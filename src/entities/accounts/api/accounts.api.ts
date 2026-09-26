import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  accountSchema,
  createAccountSchema,
  type CreateAccountDto,
  findAccountByQuerySchema,
  type FindAccountByQuery,
  renameAccountSchema,
  type RenameAccountDto,
} from '../model/schemas';

class AccountsApi {
  private readonly client = apiClient;

  async findAll(query: FindAccountByQuery = {}) {
    const params = findAccountByQuerySchema.parse(query);
    const response = await this.client.get('/accounts', { params });
    return parseRequiredWithSchema(accountSchema.array(), response.data);
  }

  async create(payload: CreateAccountDto) {
    const body = createAccountSchema.parse(payload);
    const response = await this.client.post('/accounts', body);
    return parseRequiredWithSchema(accountSchema, response.data);
  }

  async findOne(accountId: string) {
    const response = await this.client.get(`/accounts/${accountId}`);
    return parseRequiredWithSchema(accountSchema, response.data);
  }

  async rename(accountId: string, payload: RenameAccountDto) {
    const body = renameAccountSchema.parse(payload);
    const response = await this.client.patch(`/accounts/${accountId}`, body);
    return parseRequiredWithSchema(accountSchema, response.data);
  }

  async archive(accountId: string) {
    await this.client.post(`/accounts/${accountId}/archive`);
  }

  async remove(accountId: string) {
    await this.client.delete(`/accounts/${accountId}`);
  }

  delete = this.remove.bind(this);
}

export const accountsApi = new AccountsApi();
