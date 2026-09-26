import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  closePlanPayloadSchema,
  createPlanPayloadSchema,
  type ClosePlanPayload,
  type CreatePlanPayload,
  type ListPlansQuery,
  listPlansQuerySchema,
  type Plan,
  planSchema,
  type PlansPaginatedResponse,
  plansPaginatedResponseSchema,
  updatePlanPayloadSchema,
  type UpdatePlanPayload,
} from '../model/schemas';

class PlansApi {
  private readonly client = apiClient;

  findAll = async (query: ListPlansQuery = {}) => {
    const params = listPlansQuerySchema.parse(query);
    const response = await this.client.get<PlansPaginatedResponse>('/plans', { params });

    return parseRequiredWithSchema(plansPaginatedResponseSchema, response.data);
  };

  create = async (payload: CreatePlanPayload) => {
    const body = createPlanPayloadSchema.parse(payload);
    const response = await this.client.post<Plan>('/plans', body);

    return parseRequiredWithSchema(planSchema, response.data);
  };

  update = async (planId: string, payload: UpdatePlanPayload) => {
    const body = updatePlanPayloadSchema.parse(payload);
    const response = await this.client.patch<Plan>(`/plans/${planId}`, body);

    return parseRequiredWithSchema(planSchema, response.data);
  };

  remove = async (planId: string) => {
    await this.client.delete(`/plans/${planId}`);
  };

  close = async (planId: string, payload: ClosePlanPayload) => {
    const body = closePlanPayloadSchema.parse(payload);
    const response = await this.client.post<Plan>(`/plans/${planId}/close`, body);

    return parseRequiredWithSchema(planSchema, response.data);
  };
}

export const plansApi = new PlansApi();
