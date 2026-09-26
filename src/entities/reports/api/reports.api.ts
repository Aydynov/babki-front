import {
  apiClient,
  parseRequiredWithSchema,
} from '@/shared/api';
import {
  type FindMonthlyReportsByQuery,
  type FindYearlyReportsByQuery,
  type ReportPeriod,
  reportPeriodSchema,
} from '../model/schemas';

class ReportsApi {
  private readonly client = apiClient;

  getMonthly = async (params?: FindMonthlyReportsByQuery) => {
    const response = await this.client.get<ReportPeriod[]>('/reports/months', { params });
    return parseRequiredWithSchema(reportPeriodSchema.array(), response.data);
  };

  getYearly = async (params?: FindYearlyReportsByQuery) => {
    const response = await this.client.get<ReportPeriod[]>('/reports/years', { params });
    return parseRequiredWithSchema(reportPeriodSchema.array(), response.data);
  };
}

export const reportsApi = new ReportsApi();
