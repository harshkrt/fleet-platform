import { apiRequest } from "./client";

export const createRide = (payload) =>
  apiRequest("/rides", { method: "POST", body: payload });

export const getMyRides = () => apiRequest("/rides/my");

export const getRideDetails = (id) => apiRequest(`/rides/${id}`);

export const getAvailableRides = () => apiRequest("/rides/available");

export const getAssignedRides = () => apiRequest("/rides/assigned");

export const acceptRide = (id) => apiRequest(`/rides/${id}/accept`, { method: "POST" });

export const updateRideStatus = (id, status) =>
  apiRequest(`/rides/${id}/status`, { method: "PATCH", body: { status } });

export const cancelRide = (id) => apiRequest(`/rides/${id}/cancel`, { method: "POST" });
