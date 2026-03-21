// Analytics Goal
export type GoalType =
  | 'REVENUE'
  | 'QUANTITY'
  | 'DEALS_WON'
  | 'NEW_CUSTOMERS'
  | 'TICKET_AVERAGE'
  | 'CONVERSION_RATE'
  | 'COMMISSION'
  | 'BID_WIN_RATE'
  | 'CUSTOM';

export type GoalPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
export type GoalScope = 'INDIVIDUAL' | 'TEAM' | 'TENANT';
export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'MISSED' | 'ARCHIVED';

export interface AnalyticsGoal {
  id: string;
  name: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  scope: GoalScope;
  userId?: string;
  teamId?: string;
  status: GoalStatus;
  achievedAt?: string;
  progressPercentage: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnalyticsGoalResponse {
  goal: AnalyticsGoal;
}

export interface AnalyticsGoalsResponse {
  goals: AnalyticsGoal[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CreateGoalRequest {
  name: string;
  type: GoalType;
  targetValue: number;
  unit?: string;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  scope: GoalScope;
  userId?: string;
  teamId?: string;
}

export interface UpdateGoalRequest {
  name?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status?: GoalStatus;
  startDate?: string;
  endDate?: string;
}

export interface GoalProgressResponse {
  goal: AnalyticsGoal;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
  onTrack: boolean;
}

// Analytics Dashboard
export type DashboardRole = 'SELLER' | 'MANAGER' | 'DIRECTOR' | 'BID_SPECIALIST' | 'MARKETPLACE_OPS' | 'CASHIER';
export type DashboardVisibility = 'PRIVATE' | 'TEAM' | 'TENANT';

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isSystem: boolean;
  role?: DashboardRole;
  visibility: DashboardVisibility;
  layout?: Record<string, unknown>;
  createdByUserId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnalyticsDashboardResponse {
  dashboard: AnalyticsDashboard;
}

export interface AnalyticsDashboardsResponse {
  dashboards: AnalyticsDashboard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  role?: DashboardRole;
  visibility?: DashboardVisibility;
  layout?: Record<string, unknown>;
}

// Analytics Report
export type ReportType =
  | 'SALES_SUMMARY'
  | 'COMMISSION_REPORT'
  | 'PIPELINE_REPORT'
  | 'PRODUCT_PERFORMANCE'
  | 'CUSTOMER_ANALYSIS'
  | 'BID_REPORT'
  | 'MARKETPLACE_REPORT'
  | 'CASHIER_REPORT'
  | 'GOAL_PROGRESS'
  | 'CURVA_ABC'
  | 'CUSTOM';

export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV';
export type ReportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ReportDeliveryMethod = 'EMAIL' | 'WHATSAPP' | 'BOTH' | 'DOWNLOAD_ONLY';

export interface AnalyticsReport {
  id: string;
  name: string;
  type: ReportType;
  config: Record<string, unknown>;
  format: ReportFormat;
  dashboardId?: string;
  isScheduled: boolean;
  scheduleFrequency?: ReportFrequency;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  scheduleTimezone: string;
  deliveryMethod?: ReportDeliveryMethod;
  recipientUserIds: string[];
  recipientEmails: string[];
  recipientPhones: string[];
  lastGeneratedAt?: string;
  lastStatus?: string;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnalyticsReportResponse {
  report: AnalyticsReport;
}

export interface AnalyticsReportsResponse {
  reports: AnalyticsReport[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CreateReportRequest {
  name: string;
  type: ReportType;
  config?: Record<string, unknown>;
  format: ReportFormat;
  dashboardId?: string;
  isScheduled?: boolean;
  scheduleFrequency?: ReportFrequency;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  scheduleTimezone?: string;
  deliveryMethod?: ReportDeliveryMethod;
  recipientUserIds?: string[];
  recipientEmails?: string[];
  recipientPhones?: string[];
}

// Rankings
export interface RankingEntry {
  rank: number;
  userId?: string;
  customerId?: string;
  variantId?: string;
  name: string;
  productName?: string;
  sku?: string;
  totalRevenue: number;
  totalQuantity?: number;
  orderCount: number;
}

export interface RankingsResponse {
  rankings: RankingEntry[];
  period: string;
}

// Customer Portal
export interface CustomerPortalAccess {
  id: string;
  customerId: string;
  accessToken: string;
  contactId?: string;
  isActive: boolean;
  permissions: Record<string, boolean>;
  lastAccessAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerPortalAccessResponse {
  access: CustomerPortalAccess;
}

export interface CreatePortalAccessRequest {
  customerId: string;
  contactId?: string;
  permissions?: Record<string, boolean>;
  expiresAt?: string;
}
