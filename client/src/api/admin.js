import { apiRequest } from "./client";

//get admin metrices
export const getMetrics = () => apiRequest("/admin/metrics");

//get all rides made
export const getAdminRides = (filters = {}) => {
  //builtin api for creating URL query params
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  
  //converts the query params into string only if it has a value
  const query = params.toString();
  return apiRequest(`/admin/rides${query ? `?${query}` : ""}`);
};