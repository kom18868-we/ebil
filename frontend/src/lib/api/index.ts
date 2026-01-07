/**
 * API Exports
 * This file re-exports all API modules for easy importing
 */

// Export base API client and types from parent api.ts
export { apiClient, ApiResponse, PaginatedResponse } from '../api';

// Export all API modules
export { authApi } from './auth';
export { invoicesApi } from './invoices';
export { paymentsApi } from './payments';
export { paymentMethodsApi } from './payment-methods';
export { ticketsApi } from './tickets';
export { dashboardApi } from './dashboard';
export { profileApi } from './profile';
export { usersApi } from './users';
export { adminApi } from './admin';
export { rolesApi } from './roles';
export { permissionsApi } from './permissions';
export { serviceProvidersApi } from './service-providers';
export { ratingsApi } from './ratings';
export type { ServiceProviderRating, RatingStatistics, CreateRatingData, UpdateRatingData } from './ratings';
export type { ServiceProvider, CreateServiceProviderData, UpdateServiceProviderData } from './service-providers';
export { notificationsApi } from './notifications';
export type { Notification } from './notifications';
export { activityLogsApi } from './activity-logs';
export type { ActivityLog, ActivityLogStats, ActivityLogFilters } from './activity-logs';
export { refundsApi } from './refunds';
export type { Refund, CreateRefundData } from './refunds';

