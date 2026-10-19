import type { BudgetScope } from '@/shared/types';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type Snapshot, type SnapshotFindByQuery, snapshotResponseSchema, SnapshotFindByQuerySchema,
} from '../model/schemas';

class SnapshotsApi {
  private readonly client = apiClient;

  async findBy(params: SnapshotFindByQuery, scope?: BudgetScope, signal?: AbortSignal) {
    if (scope?.kind === 'group') {
      throw new Error('Снимки группы недоступны: исторический остаток рассчитывается по операциям счёта.');
    }
    const { accountId, date } = SnapshotFindByQuerySchema.parse(params);
    const { data } = await this.client.get<Snapshot>(`/accounts/${accountId}/snapshots`, {
      params: { date },
      signal,
    });

    return parseRequiredWithSchema(snapshotResponseSchema, data);
  }
}

export const snapshotsApi = new SnapshotsApi();
