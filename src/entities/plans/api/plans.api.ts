import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  closePlanPayloadSchema,
  groupPlanSchema,
  groupPlansPaginatedResponseSchema,
  createGroupPlanPayloadSchema,
  updateGroupPlanPayloadSchema,
  closeGroupPlanPayloadSchema,
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

  findAll = async (query: ListPlansQuery = {}, signal?: AbortSignal, scope?: BudgetScope) => {
    const querySchema = scope?.kind === 'group'
      ? listPlansQuerySchema : listPlansQuerySchema.omit({ includeArchived: true });
    const params = querySchema.parse(query);
    const response = await this.client.get<PlansPaginatedResponse>(budgetPath(scope, '/plans'), { params, signal });

    return parseRequiredWithSchema(
      scope?.kind === 'group' ? groupPlansPaginatedResponseSchema : plansPaginatedResponseSchema,
      response.data,
    );
  };

  create = async (payload: CreatePlanPayload, scope?: BudgetScope) => {
    const body = (scope?.kind === 'group' ? createGroupPlanPayloadSchema : createPlanPayloadSchema).parse(payload);
    const response = await this.client.post<Plan>(budgetPath(scope, '/plans'), body);

    return parseRequiredWithSchema(scope?.kind === 'group' ? groupPlanSchema : planSchema, response.data);
  };

  update = async (planId: string, payload: UpdatePlanPayload, scope?: BudgetScope) => {
    const body = (scope?.kind === 'group' ? updateGroupPlanPayloadSchema : updatePlanPayloadSchema).parse(payload);
    const response = await this.client.patch<Plan>(budgetPath(scope, `/plans/${planId}`), body);

    return parseRequiredWithSchema(scope?.kind === 'group' ? groupPlanSchema : planSchema, response.data);
  };

  remove = async (planId: string, scope?: BudgetScope) => {
    await this.client.delete(budgetPath(scope, `/plans/${planId}`));
  };

  close = async (planId: string, payload: ClosePlanPayload, scope?: BudgetScope) => {
    const body = (scope?.kind === 'group' ? closeGroupPlanPayloadSchema : closePlanPayloadSchema).parse(payload);
    const response = await this.client.post<Plan>(budgetPath(scope, `/plans/${planId}/close`), body);

    return parseRequiredWithSchema(scope?.kind === 'group' ? groupPlanSchema : planSchema, response.data);
  };

  archive = async (planId: string, scope?: BudgetScope) => {
    await this.client.post(budgetPath(scope, `/plans/${planId}/archive`));
  };

  findOne = async (planId: string, signal?: AbortSignal, scope?: BudgetScope) => {
    const response = await this.client.get(budgetPath(scope, `/plans/${planId}`), { signal });
    return parseRequiredWithSchema(scope?.kind === 'group' ? groupPlanSchema : planSchema, response.data);
  };
}

export const plansApi = new PlansApi();
