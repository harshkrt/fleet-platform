import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getMyRides } from "../../api/rides";
import { ApiError } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "../../components/AsyncState";

export default function MyRidesPage() {
  const [rides, setRides] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getMyRides();
      setRides(data.rides);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your rides.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-lg font-semibold text-gray-900">My rides</h1>

      <div className="mt-6">
        {rides === null && !error && <LoadingState label="Loading your rides..." />}
        {error && <ErrorState message={error} onRetry={load} />}
        {rides && rides.length === 0 && (
          <EmptyState message="You haven't booked a ride yet." />
        )}

        {rides && rides.length > 0 && (
          <ul className="space-y-3">
            {rides.map((ride) => (
              <li key={ride._id}>
                <Link
                  to={`/customer/rides/${ride._id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">
                      {ride.pickupLocation} → {ride.dropLocation}
                    </p>
                    <StatusBadge status={ride.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Requested for {new Date(ride.requestedTime).toLocaleString()} · ₹
                    {ride.estimatedFare}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
