import { useEffect, useState, useCallback } from "react";
import { getAssignedRides, updateRideStatus } from "../../api/rides";
import { ApiError } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "../../components/AsyncState";
import { NEXT_STATUS, STATUS_LABEL } from "../../rideLifecycle";

export default function AssignedRidesPage() {
  const [rides, setRides] = useState(null);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getAssignedRides();
      setRides(data.rides);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your rides.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdvance = async (ride) => {
    const nextStatus = NEXT_STATUS[ride.status];
    if (!nextStatus || updatingId) return;

    setUpdatingId(ride._id);
    setUpdateError("");
    try {
      await updateRideStatus(ride._id, nextStatus);
      await load();
    } catch (err) {
      setUpdateError(err instanceof ApiError ? err.message : "Could not update ride status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-lg font-semibold text-gray-900">My rides</h1>

      {updateError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{updateError}</p>
      )}

      <div className="mt-6">
        {rides === null && !error && <LoadingState label="Loading your rides..." />}
        {error && <ErrorState message={error} onRetry={load} />}
        {rides && rides.length === 0 && (
          <EmptyState message="You haven't accepted any rides yet." />
        )}

        {rides && rides.length > 0 && (
          <ul className="space-y-3">
            {rides.map((ride) => {
              const nextStatus = NEXT_STATUS[ride.status];
              return (
                <li key={ride._id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">
                      {ride.pickupLocation} → {ride.dropLocation}
                    </p>
                    <StatusBadge status={ride.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Customer: {ride.customerId?.name || "Unknown"} · ₹{ride.estimatedFare}
                  </p>
                  {nextStatus && (
                    <button
                      onClick={() => handleAdvance(ride)}
                      disabled={updatingId === ride._id}
                      className="mt-3 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingId === ride._id
                        ? "Updating..."
                        : `Mark as ${STATUS_LABEL[nextStatus]}`}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
