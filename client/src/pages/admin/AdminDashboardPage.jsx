import { useEffect, useState, useCallback } from "react";
import { getMetrics, getAdminRides } from "../../api/admin";
import { ApiError } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "../../components/AsyncState";

const STATUS_OPTIONS = [
  "REQUESTED",
  "ACCEPTED",
  "DRIVER_ARRIVING",
  "STARTED",
  "COMPLETED",
  "CANCELLED",
];

const emptyFilters = { status: "", driver: "", customer: "", date: "" };

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState("");

  const [filters, setFilters] = useState(emptyFilters);
  const [rides, setRides] = useState(null);
  const [ridesError, setRidesError] = useState("");

  const loadMetrics = useCallback(async () => {
    setMetricsError("");
    try {
      setMetrics(await getMetrics());
    } catch (err) {
      setMetricsError(err instanceof ApiError ? err.message : "Could not load metrics.");
    }
  }, []);

  const loadRides = useCallback(async (activeFilters) => {
    setRidesError("");
    try {
      const data = await getAdminRides(activeFilters);
      setRides(data.rides);
    } catch (err) {
      setRidesError(err instanceof ApiError ? err.message : "Could not load rides.");
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    loadRides(emptyFilters);
  }, [loadMetrics, loadRides]); //without useCallback fn would be recreated on every render

  //apply filter button logic
  const applyFilters = (e) => {
    e.preventDefault();
    loadRides(filters);
  };

  //clear filter button logic
  const clearFilters = () => {
    setFilters(emptyFilters);
    loadRides(emptyFilters);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-lg font-semibold text-gray-900">Admin dashboard</h1>

      <div className="mt-6">
        {!metrics && !metricsError && <LoadingState label="Loading metrics..." />}
        {metricsError && <ErrorState message={metricsError} onRetry={loadMetrics} />}
        {metrics && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard label="Total rides" value={metrics.totalRides} />
            <MetricCard label="Requested" value={metrics.requestedRides} />
            <MetricCard label="Active" value={metrics.activeRides} />
            <MetricCard label="Completed" value={metrics.completedRides} />
            <MetricCard label="Cancelled" value={metrics.cancelledRides} />
            <MetricCard label="Revenue" value={`₹${metrics.totalCompletedRevenue}`} />
          </div>
        )}
      </div>

      <form
        onSubmit={applyFilters}
        className="mt-8 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-4"
      >
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="input"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          placeholder="Driver ID"
          value={filters.driver}
          onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
          className="input"
        />
        <input
          placeholder="Customer ID"
          value={filters.customer}
          onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
          className="input"
        />
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="input"
        />
        <div className="col-span-2 flex gap-2 sm:col-span-4">
          <button type="submit" className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">
            Apply filters
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="mt-6">
        {rides === null && !ridesError && <LoadingState label="Loading rides..." />}
        {ridesError && <ErrorState message={ridesError} onRetry={() => loadRides(filters)} />}
        {rides && rides.length === 0 && <EmptyState message="No rides match these filters." />}

        {rides && rides.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Route</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Fare</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rides.map((ride) => (
                  <tr key={ride._id}>
                    <td className="px-4 py-2">
                      {ride.pickupLocation} → {ride.dropLocation}
                    </td>
                    <td className="px-4 py-2">{ride.customerId?.name || "—"}</td>
                    <td className="px-4 py-2">{ride.driverId?.name || "—"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={ride.status} />
                    </td>
                    <td className="px-4 py-2">₹{ride.estimatedFare}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {new Date(ride.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
