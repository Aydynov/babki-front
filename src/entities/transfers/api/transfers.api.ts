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

  create = async (payload: CreateTransferDto) => {
    const response = await this.client.post<Transfer>('/transfers', createTransferSchema.parse(payload));
    return parseRequiredWithSchema(transferSchema, response.data);
  };

  findAll = async (query: ListTransfersQuery = {}) => {
    const response = await this.client.get<TransfersPaginatedResponse>('/transfers', {
      params: listTransfersQuerySchema.parse(query),
    });
    return parseRequiredWithSchema(transfersPaginatedResponseSchema, response.data);
  };

  findOne = async (transferId: string) => {
    const response = await this.client.get<Transfer>(`/transfers/${transferId}`);
    return parseRequiredWithSchema(transferSchema, response.data);
  };

  update = async (transferId: string, payload: UpdateTransferDto) => {
    const response = await this.client.patch<Transfer>(
      `/transfers/${transferId}`,
      updateTransferSchema.parse(payload),
    );
    return parseRequiredWithSchema(transferSchema, response.data);
  };

  remove = async (transferId: string) => {
    await this.client.delete(`/transfers/${transferId}`);
  };
}

export const transfersApi = new TransfersApi();
