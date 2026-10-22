import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  closePlanPayloadSchema,
  planSchema,
  plansPaginatedResponseSchema,
  createPlanPayloadSchema,
  updatePlanPayloadSchema,
  type ClosePlanPayload,
  type CreatePlanPayload,
  type ListPlansQuery,
  listPlansQuerySchema,
  type Plan,
  type PlansPaginatedResponse,
  type UpdatePlanPayload,
} from '../model/schemas';

class PlansApi {
  private readonly client = apiClient;

  findAll = async (
    query: ListPlansQuery,
    signal: AbortSignal | undefined,
    scope: BudgetScope,
  ) => {
    const querySchema = listPlansQuerySchema;
    const parsed = querySchema.parse(query);
    const params = {
      ...parsed,
      includeArchived:
        parsed.includeArchived === undefined
          ? undefined
          : String(parsed.includeArchived),
    };
    const response = await this.client.get<PlansPaginatedResponse>(
      budgetPath(scope, '/plans'),
      {
        params,
        signal,
      },
    );

    return parseRequiredWithSchema(plansPaginatedResponseSchema, response.data);
  };

  create = async (payload: CreatePlanPayload, scope: BudgetScope) => {
    const body = createPlanPayloadSchema.parse(payload);
    const response = await this.client.post<Plan>(
      budgetPath(scope, '/plans'),
      body,
    );

    return parseRequiredWithSchema(planSchema, response.data);
  };

  update = async (
    planId: string,
    payload: UpdatePlanPayload,
    scope: BudgetScope,
  ) => {
    const body = updatePlanPayloadSchema.parse(payload);
    const response = await this.client.patch<Plan>(
      budgetPath(scope, `/plans/${planId}`),
      body,
    );

    return parseRequiredWithSchema(planSchema, response.data);
  };

  remove = async (planId: string, scope: BudgetScope) => {
    await this.client.delete(budgetPath(scope, `/plans/${planId}`));
  };

  close = async (
    planId: string,
    payload: ClosePlanPayload,
    scope: BudgetScope,
  ) => {
    const body = closePlanPayloadSchema.parse(payload);
    const response = await this.client.post<Plan>(
      budgetPath(scope, `/plans/${planId}/close`),
      body,
    );

    return parseRequiredWithSchema(planSchema, response.data);
  };

  archive = async (planId: string, scope: BudgetScope) => {
    await this.client.post(budgetPath(scope, `/plans/${planId}/archive`));
  };

  findOne = async (
    planId: string,
    signal: AbortSignal | undefined,
    scope: BudgetScope,
  ) => {
    const response = await this.client.get(
      budgetPath(scope, `/plans/${planId}`),
      { signal },
    );
    return parseRequiredWithSchema(planSchema, response.data);
  };
}

export const plansApi = new PlansApi();
