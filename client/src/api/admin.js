import { apiRequest } from "./client";

export const getMetrics = () => apiRequest("/admin/metrics");

export const getAdminRides = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return apiRequest(`/admin/rides${query ? `?${query}` : ""}`);
};
