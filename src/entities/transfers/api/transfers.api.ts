import type { BudgetScope } from '@/shared/types';
import { budgetPath, utcPeriod } from '@/shared/lib/budget-api';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type CreateTransferDto,
  createTransferSchema,
  type ListTransfersQuery,
  listTransfersQuerySchema,
  type Transfer,
  type TransfersPaginatedResponse,
  transferSchema,
  transfersPaginatedResponseSchema,
  type UpdateTransferDto,
  updateTransferSchema,
} from '../model/schemas';

class TransfersApi {
  private readonly client = apiClient;

  create = async (
    payload: CreateTransferDto,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const response = await this.client.post<Transfer>(
      budgetPath(scope, '/transfers'),
      createTransferSchema.parse(payload),
    );
    return parseRequiredWithSchema(transferSchema, response.data);
  };

  findAll = async (
    query: ListTransfersQuery,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const response = await this.client.get<TransfersPaginatedResponse>(
      budgetPath(scope, '/transfers'),
      {
        params: utcPeriod(listTransfersQuerySchema.parse(query)),
        signal,
      },
    );
    return parseRequiredWithSchema(
      transfersPaginatedResponseSchema,
      response.data,
    );
  };

  findOne = async (
    transferId: string,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const response = await this.client.get<Transfer>(
      budgetPath(scope, `/transfers/${transferId}`),
      {
        signal,
      },
    );
    return parseRequiredWithSchema(transferSchema, response.data);
  };

  update = async (
    transferId: string,
    payload: UpdateTransferDto,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const response = await this.client.patch<Transfer>(
      budgetPath(scope, `/transfers/${transferId}`),
      updateTransferSchema.parse(payload),
    );
    return parseRequiredWithSchema(transferSchema, response.data);
  };

  remove = async (
    transferId: string,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    await this.client.delete(budgetPath(scope, `/transfers/${transferId}`));
  };
}

export const transfersApi = new TransfersApi();
