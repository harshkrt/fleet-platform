import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableRides, acceptRide } from "../../api/rides";
import { ApiError } from "../../api/client";
import { LoadingState, ErrorState, EmptyState } from "../../components/AsyncState";

export default function AvailableRidesPage() {
  const navigate = useNavigate();
  const [rides, setRides] = useState(null);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptError, setAcceptError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getAvailableRides();
      setRides(data.rides);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load available rides.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (id) => {
    if (acceptingId) return;
    setAcceptingId(id);
    setAcceptError("");
    try {
      await acceptRide(id);
      navigate("/driver/assigned");
    } catch (err) {
      setAcceptError(
        err instanceof ApiError
          ? err.message
          : "Could not accept this ride."
      );
      await load();
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-lg font-semibold text-gray-900">Available rides</h1>

      {acceptError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{acceptError}</p>
      )}

      <div className="mt-6">
        {rides === null && !error && <LoadingState label="Loading available rides..." />}
        {error && <ErrorState message={error} onRetry={load} />}
        {rides && rides.length === 0 && (
          <EmptyState message="No ride requests are available right now." />
        )}

        {rides && rides.length > 0 && (
          <ul className="space-y-3">
            {rides.map((ride) => (
              <li
                key={ride._id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    {ride.pickupLocation} → {ride.dropLocation}
                  </p>
                  <span className="text-sm font-medium text-gray-900">₹{ride.estimatedFare}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Customer: {ride.customerId?.name || "Unknown"} · Requested for{" "}
                  {new Date(ride.requestedTime).toLocaleString()}
                </p>
                <button
                  onClick={() => handleAccept(ride._id)}
                  disabled={acceptingId === ride._id}
                  className="mt-3 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {acceptingId === ride._id ? "Accepting..." : "Accept ride"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
