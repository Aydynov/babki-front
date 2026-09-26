import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type Snapshot,
  type SnapshotFindByQuery,
  snapshotResponseSchema,
} from '../model/schemas';

class SnapshotsApi {
  private readonly client = apiClient;

  async findBy(params: SnapshotFindByQuery) {
    const { accountId, date } = params;
    const { data } = await this.client.get<Snapshot>(`/accounts/${accountId}/snapshots`, {
      params: { date },
    });

    return parseRequiredWithSchema(snapshotResponseSchema, data);
  }
}

export const snapshotsApi = new SnapshotsApi();
