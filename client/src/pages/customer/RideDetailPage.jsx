import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getRideDetails, cancelRide } from "../../api/rides";
import { ApiError } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import { LoadingState, ErrorState } from "../../components/AsyncState";
import { isCancellable } from "../../rideLifecycle";

const POLL_INTERVAL_MS = 5000;

export default function RideDetailPage() {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getRideDetails(id);
      setRide(data.ride);
      setHistory(data.history);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this ride.");
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelRide(id);
      await load();
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "Could not cancel this ride.");
    } finally {
      setCancelling(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <LoadingState label="Loading ride..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/customer/rides" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to my rides
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            {ride.pickupLocation} → {ride.dropLocation}
          </h1>
          <StatusBadge status={ride.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Detail label="Driver" value={ride.driverId ? ride.driverId.name : "Not assigned yet"} />
          <Detail label="Fare" value={`₹${ride.estimatedFare}`} />
          <Detail label="Requested time" value={new Date(ride.requestedTime).toLocaleString()} />
          <Detail label="Distance" value={`${ride.estimatedDistance} km`} />
        </dl>

        {isCancellable(ride.status) && (
          <div className="mt-5">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Cancel ride"}
            </button>
            {cancelError && <p className="mt-2 text-sm text-red-600">{cancelError}</p>}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900">Status history</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No status changes yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {history.map((entry) => (
              <li
                key={entry._id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                <span>
                  {entry.previousStatus || "—"} → {entry.newStatus}
                </span>
                <span className="text-gray-400">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
