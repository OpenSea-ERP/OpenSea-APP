import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  AnalyticsGoalResponse,
  AnalyticsGoalsResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalProgressResponse,
  AnalyticsDashboardResponse,
  AnalyticsDashboardsResponse,
  CreateDashboardRequest,
  AnalyticsReportResponse,
  AnalyticsReportsResponse,
  CreateReportRequest,
  RankingsResponse,
  CustomerPortalAccessResponse,
  CreatePortalAccessRequest,
} from '@/types/sales';

export const analyticsService = {
  // Goals
  async listGoals(params?: Record<string, unknown>): Promise<AnalyticsGoalsResponse> {
    return apiClient.get<AnalyticsGoalsResponse>(API_ENDPOINTS.ANALYTICS.GOALS.LIST, { params });
  },

  async createGoal(data: CreateGoalRequest): Promise<AnalyticsGoalResponse> {
    return apiClient.post<AnalyticsGoalResponse>(API_ENDPOINTS.ANALYTICS.GOALS.CREATE, data);
  },

  async updateGoal(id: string, data: UpdateGoalRequest): Promise<AnalyticsGoalResponse> {
    return apiClient.patch<AnalyticsGoalResponse>(API_ENDPOINTS.ANALYTICS.GOALS.UPDATE(id), data);
  },

  async deleteGoal(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.ANALYTICS.GOALS.DELETE(id));
  },

  async getGoalProgress(id: string): Promise<GoalProgressResponse> {
    return apiClient.get<GoalProgressResponse>(API_ENDPOINTS.ANALYTICS.GOALS.PROGRESS(id));
  },

  // Dashboards
  async listDashboards(params?: Record<string, unknown>): Promise<AnalyticsDashboardsResponse> {
    return apiClient.get<AnalyticsDashboardsResponse>(API_ENDPOINTS.ANALYTICS.DASHBOARDS.LIST, { params });
  },

  async createDashboard(data: CreateDashboardRequest): Promise<AnalyticsDashboardResponse> {
    return apiClient.post<AnalyticsDashboardResponse>(API_ENDPOINTS.ANALYTICS.DASHBOARDS.CREATE, data);
  },

  // Reports
  async listReports(params?: Record<string, unknown>): Promise<AnalyticsReportsResponse> {
    return apiClient.get<AnalyticsReportsResponse>(API_ENDPOINTS.ANALYTICS.REPORTS.LIST, { params });
  },

  async createReport(data: CreateReportRequest): Promise<AnalyticsReportResponse> {
    return apiClient.post<AnalyticsReportResponse>(API_ENDPOINTS.ANALYTICS.REPORTS.CREATE, data);
  },

  // Rankings
  async getSellerRanking(params?: Record<string, unknown>): Promise<RankingsResponse> {
    return apiClient.get<RankingsResponse>(API_ENDPOINTS.ANALYTICS.RANKINGS.SELLERS, { params });
  },

  async getProductRanking(params?: Record<string, unknown>): Promise<RankingsResponse> {
    return apiClient.get<RankingsResponse>(API_ENDPOINTS.ANALYTICS.RANKINGS.PRODUCTS, { params });
  },

  async getCustomerRanking(params?: Record<string, unknown>): Promise<RankingsResponse> {
    return apiClient.get<RankingsResponse>(API_ENDPOINTS.ANALYTICS.RANKINGS.CUSTOMERS, { params });
  },

  // Customer Portal
  async createPortalAccess(data: CreatePortalAccessRequest): Promise<CustomerPortalAccessResponse> {
    return apiClient.post<CustomerPortalAccessResponse>(API_ENDPOINTS.ANALYTICS.CUSTOMER_PORTAL.CREATE, data);
  },

  async getPortalData(token: string): Promise<CustomerPortalAccessResponse> {
    return apiClient.get<CustomerPortalAccessResponse>(API_ENDPOINTS.ANALYTICS.CUSTOMER_PORTAL.GET(token));
  },
};
